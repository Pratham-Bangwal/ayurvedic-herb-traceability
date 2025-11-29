/**
 * Integration tests for Herbs Routes
 * Tests endpoints for herb management and verification
 */
const request = require('supertest');
const express = require('express');
const herbsRouter = require('../../src/routes/herbs');
const herbModel = require('../../src/models/herbModel');
const aiValidationService = require('../../src/services/aiValidationService');
const blockchainService = require('../../src/services/blockchainService');

// Mock dependencies
jest.mock('../../src/middleware/rateLimiter', () => ({
  limiters: {
    api: (req, res, next) => next(), // No-op for tests
    sensitive: (req, res, next) => next()
  }
}));

jest.mock('../../src/middleware/auth', () => ({
  authRequired: (req, res, next) => {
    req.user = { role: 'admin' };
    next();
  },
  requireRole: (role) => (req, res, next) => next()
}));

jest.mock('../../src/models/herbModel');
jest.mock('../../src/services/aiValidationService');
jest.mock('../../src/services/blockchainService');

// Mock multer middleware for file uploads
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        path: 'uploads/test-image.jpg',
        filename: 'test-image.jpg'
      };
      next();
    },
    any: () => (req, res, next) => {
      req.files = [
        {
          path: 'uploads/test-image.jpg',
          filename: 'test-image.jpg',
          fieldname: 'photo',
          originalname: 'test-image.jpg',
          mimetype: 'image/jpeg',
        }
      ];
      req.file = req.files[0];
      req.body = req.body || {};
      req.body.batchId = req.body.batchId || 'batch123';
      next();
    }
  });
  multer.memoryStorage = () => ({});
  return multer;
});

// Create Express app with herbs routes
const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/herbs', herbsRouter);
  return app;
};

describe('Herbs Routes', () => {
  let app;
  
  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('GET /api/herbs', () => {
    it('should return a list of herbs', async () => {
      const mockHerbs = [
        { id: 'herb1', name: 'Ashwagandha', origin: 'Kerala' },
        { id: 'herb2', name: 'Tulsi', origin: 'Maharashtra' }
      ];
      herbModel.getAllHerbs.mockResolvedValue(mockHerbs);
      const response = await request(app).get('/api/herbs');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: {
          items: mockHerbs,
          page: 1,
          total: mockHerbs.length
        }
      });
      expect(herbModel.getAllHerbs).toHaveBeenCalled();
    });

    it('should handle errors when fetching herbs', async () => {
      herbModel.getAllHerbs.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/herbs');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'internal_error',
          message: expect.stringContaining('Error fetching herbs')
        })
      });
    });
  });

  describe('GET /api/herbs/:id', () => {
    it('should return a specific herb', async () => {
      const mockHerb = { 
        id: 'herb1', 
        name: 'Ashwagandha',
        origin: 'Kerala',
        batches: [{ id: 'batch1', date: '2023-01-01' }]
      };
      
      herbModel.getHerbById.mockResolvedValue(mockHerb);

      const response = await request(app).get('/api/herbs/herb1');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: mockHerb });
      expect(herbModel.getHerbById).toHaveBeenCalledWith('herb1');
    });

    it('should return 404 for non-existent herb', async () => {
      herbModel.getHerbById.mockResolvedValue(null);

      const response = await request(app).get('/api/herbs/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'not_found',
          message: 'Herb not found'
        })
      });
    });

    it('should handle errors when fetching a specific herb', async () => {
      herbModel.getHerbById.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/herbs/herb1');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'internal_error'
        })
      });
    });
  });

  describe('POST /api/herbs/verify', () => {
    it('should verify herb image successfully', async () => {
      aiValidationService.validateHerbImage.mockResolvedValue({
        success: true,
        data: {
          verified: true,
          herbName: 'Ashwagandha',
          confidence: 0.95,
          batchId: 'batch123'
        }
      });

      const response = await request(app)
        .post('/api/herbs/verify')
        .field('batchId', 'batch123');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: {
          verified: true,
          herbName: 'Ashwagandha',
          confidence: 0.95,
          batchId: 'batch123'
        }
      });
      expect(aiValidationService.validateHerbImage).toHaveBeenCalled();
    });

    it('should return 400 when verification fails', async () => {
      aiValidationService.validateHerbImage.mockResolvedValue({
        success: false,
        error: {
          code: 'invalid_herb',
          message: 'Could not verify herb image'
        }
      });

      const response = await request(app)
        .post('/api/herbs/verify')
        .field('batchId', 'batch123');
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: {
          code: 'invalid_herb',
          message: 'Could not verify herb image'
        }
      });
    });

    it('should handle errors during verification', async () => {
      aiValidationService.validateHerbImage.mockRejectedValue(new Error('AI service error'));

      const response = await request(app)
        .post('/api/herbs/verify')
        .field('batchId', 'batch123');
      
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'verification_error'
        })
      });
    });
  });

  describe('POST /api/herbs/register', () => {
    it('should register a new herb batch', async () => {
      const mockRegistrationData = {
        id: 'batch456',
        name: 'Tulsi',
        origin: 'Maharashtra',
        farmer: 'John Doe',
        harvestDate: '2023-05-15',
        transactionHash: '0x123456789abcdef'
      };

      blockchainService.registerHerbBatch.mockResolvedValue({
        success: true,
        data: mockRegistrationData
      });
      
      herbModel.addHerbBatch.mockResolvedValue({
        success: true,
        data: mockRegistrationData
      });

      const response = await request(app)
        .post('/api/herbs/register')
        .send({
          name: 'Tulsi',
          origin: 'Maharashtra',
          farmer: 'John Doe',
          harvestDate: '2023-05-15'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        data: mockRegistrationData
      });
      expect(blockchainService.registerHerbBatch).toHaveBeenCalled();
      expect(herbModel.addHerbBatch).toHaveBeenCalled();
    });

    it('should return 400 for invalid registration data', async () => {
      const response = await request(app)
        .post('/api/herbs/register')
        .send({ name: 'Tulsi' }); // Missing required fields
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: expect.objectContaining({
          code: 'invalid_input'
        })
      });
    });

    it('should handle blockchain registration errors', async () => {
      blockchainService.registerHerbBatch.mockResolvedValue({
        success: false,
        error: {
          code: 'blockchain_error',
          message: 'Failed to register on blockchain'
        }
      });

      const response = await request(app)
        .post('/api/herbs/register')
        .send({
          name: 'Tulsi',
          origin: 'Maharashtra',
          farmer: 'John Doe',
          harvestDate: '2023-05-15'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: {
          code: 'blockchain_error',
          message: 'Failed to register on blockchain'
        }
      });
    });
  });

  describe('GET /api/herbs/batch/:batchId', () => {
    it('should return batch verification information', async () => {
      const mockBatchData = {
        id: 'batch123',
        name: 'Ashwagandha',
        origin: 'Kerala',
        farmer: 'John Doe',
        harvestDate: '2023-01-15',
        verificationHistory: [
          { date: '2023-02-01', verifier: 'Jane Smith', status: 'verified' }
        ],
        blockchainData: {
          transactionHash: '0x123456789abcdef',
          blockNumber: 12345,
          timestamp: '2023-01-16'
        }
      };

      blockchainService.getHerbBatchData.mockResolvedValue({
        success: true,
        data: mockBatchData
      });

      const response = await request(app).get('/api/herbs/batch/batch123');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: mockBatchData });
      expect(blockchainService.getHerbBatchData).toHaveBeenCalledWith('batch123');
    });

    it('should return 404 for non-existent batch', async () => {
      blockchainService.getHerbBatchData.mockResolvedValue({
        success: false,
        error: {
          code: 'not_found',
          message: 'Batch not found'
        }
      });

      const response = await request(app).get('/api/herbs/batch/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: {
          code: 'not_found',
          message: 'Batch not found'
        }
      });
    });
  });
});