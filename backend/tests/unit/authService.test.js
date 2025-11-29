/**
 * Unit tests for AuthService
 * Tests authentication service functionality
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../../src/services/authService');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Service', () => {
  // Original environment variables
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    
    // Setup process.env for tests
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test_secret',
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'admin123',
      BCRYPT_ROUNDS: '4' // speed up hashing for tests
    };
  });

  afterAll(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('initializeUsers', () => {
    it('should initialize users with admin user', async () => {
      // Mock bcrypt.hash to return a fixed hash
      bcrypt.hash.mockResolvedValue('hashed_password');

      const users = await authService.initializeUsers();
      
      // Check if bcrypt.hash was called correctly
      expect(bcrypt.hash).toHaveBeenCalledWith('admin123', expect.any(Number));
      
      // Check if users were initialized correctly
      expect(users).toHaveLength(1);
      expect(users[0]).toEqual(expect.objectContaining({
        username: 'admin',
        password: 'hashed_password',
        role: 'admin',
        loginAttempts: 0,
        locked: false
      }));
    });
  });

  describe('authenticateUser', () => {
    beforeEach(async () => {
      // Initialize users before each test
      bcrypt.hash.mockResolvedValue('hashed_password');
      await authService.initializeUsers();
    });

    it('should authenticate valid user and return token', async () => {
      // Mock bcrypt.compare to return true (valid password)
      bcrypt.compare.mockResolvedValue(true);
      
      // Mock jwt.sign to return a fixed token
      jwt.sign.mockReturnValue('test_token');

      const result = await authService.authenticateUser('admin', 'admin123');
      
      // Check bcrypt.compare was called correctly
      expect(bcrypt.compare).toHaveBeenCalledWith('admin123', 'hashed_password');
      
      // Check jwt.sign was called with correct parameters
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'admin',
          sub: expect.stringContaining('admin:')
        }),
        'test_secret',
        expect.any(Object)
      );
      
      // Check result structure
      expect(result).toEqual({
        success: true,
        data: {
          token: 'test_token',
          user: {
            username: 'admin',
            role: 'admin'
          }
        }
      });
    });

    it('should reject authentication with invalid username', async () => {
      const result = await authService.authenticateUser('invalid_user', 'password');
      
      // bcrypt.compare should not be called
      expect(bcrypt.compare).not.toHaveBeenCalled();
      
      // Check result structure
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'invalid_credentials'
        })
      });
    });

    it('should reject authentication with invalid password', async () => {
      // Mock bcrypt.compare to return false (invalid password)
      bcrypt.compare.mockResolvedValue(false);
      
      const result = await authService.authenticateUser('admin', 'wrong_password');
      
      // Check bcrypt.compare was called
      expect(bcrypt.compare).toHaveBeenCalled();
      
      // Check result structure
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'invalid_credentials'
        })
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      // Mock bcrypt.compare to return false (invalid password)
      bcrypt.compare.mockResolvedValue(false);
      
      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await authService.authenticateUser('admin', 'wrong_password');
      }
      
      // 6th attempt should show account locked
      const result = await authService.authenticateUser('admin', 'wrong_password');
      
      // bcrypt.compare should not be called on locked account
      expect(bcrypt.compare).toHaveBeenCalledTimes(5);
      
      // Check result shows account locked
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'account_locked'
        })
      });
    });

    it('should reset login attempts after successful login', async () => {
      // First make a failed login attempt
      bcrypt.compare.mockResolvedValue(false);
      await authService.authenticateUser('admin', 'wrong_password');
      
      // Then succeed
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('test_token');
      
      await authService.authenticateUser('admin', 'admin123');
      
      // Make another failed attempt (should be count 1, not 2)
      bcrypt.compare.mockResolvedValue(false);
      await authService.authenticateUser('admin', 'wrong_password');
      
      // Should still be able to login (not locked)
      bcrypt.compare.mockResolvedValue(true);
      const result = await authService.authenticateUser('admin', 'admin123');
      
      expect(result.success).toBe(true);
    });
  });

  describe('createUser', () => {
    beforeEach(async () => {
      // Initialize users before each test
      bcrypt.hash.mockResolvedValue('hashed_password');
      await authService.initializeUsers();
    });

    it('should create a new user successfully', async () => {
      // Mock a new hash for the new user
      bcrypt.hash.mockResolvedValue('new_hashed_password');
      
      const result = await authService.createUser({
        username: 'newuser',
        password: 'password123',
        role: 'farmer'
      });
      
      // Check bcrypt.hash was called
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', expect.any(Number));
      
      // Check result structure
      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          username: 'newuser',
          role: 'farmer'
        })
      });
    });

    it('should reject user creation with missing fields', async () => {
      // Clear mocks before this specific test
      bcrypt.hash.mockClear();
      
      const result = await authService.createUser({
        username: 'newuser'
        // missing password
      });
      
      // bcrypt.hash should not be called
      expect(bcrypt.hash).not.toHaveBeenCalled();
      
      // Check result structure
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'invalid_input'
        })
      });
    });

    it('should reject creation of duplicate username', async () => {
      // First create a user
      bcrypt.hash.mockResolvedValue('hashed_password');
      await authService.createUser({
        username: 'farmer1',
        password: 'password123'
      });
      
      // Reset mock to track new calls
      bcrypt.hash.mockClear();
      
      // Try to create with same username
      const result = await authService.createUser({
        username: 'farmer1',
        password: 'different_password'
      });
      
      // bcrypt.hash should not be called
      expect(bcrypt.hash).not.toHaveBeenCalled();
      
      // Check result structure
      expect(result).toEqual({
        success: false,
        error: expect.objectContaining({
          code: 'username_taken'
        })
      });
    });

    it('should assign default role if not specified', async () => {
      bcrypt.hash.mockResolvedValue('hashed_password');
      
      const result = await authService.createUser({
        username: 'basicuser',
        password: 'password123'
      });
      
      // Check result has default role
      expect(result.success).toBe(true);
      expect(result.data.role).toBe('user');
    });
  });
});