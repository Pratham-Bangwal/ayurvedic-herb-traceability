/**
 * Integration tests for Auth Routes
 * Tests authentication endpoints
 */
const request = require('supertest');
const express = require('express');
const authRouter = require('../../src/routes/auth');
const authService = require('../../src/services/authService');

// Mock dependencies
jest.mock('../../src/middleware/rateLimiter', () => ({
  limiters: {
    auth: (req, res, next) => next() // No-op for tests
  }
}));

jest.mock('../../src/middleware/auth', () => ({
  authRequired: (req, res, next) => {
    req.user = { role: 'admin' };
    next();
  },
  requireRole: (role) => (req, res, next) => next()
}));

jest.mock('../../src/services/authService');

// Create Express app with auth routes
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
};

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'invalid_input',
          message: expect.stringContaining('Username and password are required')
        })
      });
    });

    it('should return 401 for failed authentication', async () => {
      // Mock authenticateUser to return failed authentication
      authService.authenticateUser.mockResolvedValue({
        success: false,
        error: {
          code: 'invalid_credentials',
          message: 'Invalid username or password'
        }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrong' });
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: {
          code: 'invalid_credentials',
          message: 'Invalid username or password'
        }
      });
    });

    it('should return token for successful authentication', async () => {
      // Mock authenticateUser to return successful authentication
      authService.authenticateUser.mockResolvedValue({
        success: true,
        data: {
          token: 'test_token',
          user: {
            username: 'admin',
            role: 'admin'
          }
        }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: {
          token: 'test_token',
          user: {
            username: 'admin',
            role: 'admin'
          }
        }
      });
    });

    it('should handle server errors', async () => {
      // Mock authenticateUser to throw an error
      authService.authenticateUser.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' });
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'auth_error'
        })
      });
    });
  });

  describe('POST /api/auth/users', () => {
    it('should return 400 if username or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/users')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'invalid_input'
        })
      });
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/users')
        .send({ 
          username: 'newuser', 
          password: 'password123', 
          role: 'invalid_role' 
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'invalid_role'
        })
      });
    });

    it('should return 400 if user creation fails', async () => {
      // Mock createUser to return failure
      authService.createUser.mockResolvedValue({
        success: false,
        error: {
          code: 'username_taken',
          message: 'Username is already taken'
        }
      });

      const response = await request(app)
        .post('/api/auth/users')
        .send({ 
          username: 'existinguser', 
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: {
          code: 'username_taken',
          message: 'Username is already taken'
        }
      });
    });

    it('should return 201 for successful user creation', async () => {
      // Mock createUser to return success
      authService.createUser.mockResolvedValue({
        success: true,
        data: {
          id: '123',
          username: 'newuser',
          role: 'farmer'
        }
      });

      const response = await request(app)
        .post('/api/auth/users')
        .send({ 
          username: 'newuser', 
          password: 'password123', 
          role: 'farmer'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        data: {
          id: '123',
          username: 'newuser',
          role: 'farmer'
        }
      });
    });

    it('should handle server errors', async () => {
      // Mock createUser to throw an error
      authService.createUser.mockRejectedValue(new Error('Test error'));

      const response = await request(app)
        .post('/api/auth/users')
        .send({ 
          username: 'newuser', 
          password: 'password123'
        });
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'user_creation_error'
        })
      });
    });
  });
});