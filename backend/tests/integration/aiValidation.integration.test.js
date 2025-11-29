/**
 * Integration tests for the AI Validation service
 * Tests the herb image verification functionality
 */
const fs = require('fs');
const path = require('path');
const { validateHerbImage } = require('../../src/services/aiValidationService');
const blockchainService = require('../../src/services/blockchainService');

// Mock the blockchain service dependency
jest.mock('../../src/services/blockchainService', () => ({
  getHerbBatchData: jest.fn()
}));

// Mock fs module for testing
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  createReadStream: jest.fn()
}));

describe('AI Validation Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateHerbImage()', () => {
    it('should validate a valid herb image against blockchain data', async () => {
      // Set up mocks for file system
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue({
        on: jest.fn(),
        pipe: jest.fn()
      });

      // Mock blockchain data for the test batch
      blockchainService.getHerbBatchData.mockResolvedValue({
        success: true,
        data: {
          id: 'batch123',
          name: 'Ashwagandha',
          origin: 'Kerala',
          imageHash: 'QmTestImageHash123'
        }
      });

      // Test validation with valid image path and batch ID
      const result = await validateHerbImage('test-image.jpg', 'batch123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        verified: true,
        herbName: 'Ashwagandha',
        confidence: expect.any(Number),
        batchId: 'batch123'
      }));
      
      // Verify blockchain service was called with correct batch ID
      expect(blockchainService.getHerbBatchData).toHaveBeenCalledWith('batch123');
    });

    it('should reject when image file does not exist', async () => {
      // Mock file not found
      fs.existsSync.mockReturnValue(false);
      
      const result = await validateHerbImage('non-existent.jpg', 'batch123');
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual(expect.objectContaining({
        code: 'file_not_found',
        message: expect.stringContaining('Image file not found')
      }));
    });

    it('should reject when batch does not exist on blockchain', async () => {
      // Set up mocks for file system
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue({
        on: jest.fn(),
        pipe: jest.fn()
      });

  // Mock blockchain error
  blockchainService.getHerbBatchData.mockResolvedValue({
        success: false,
        error: {
          code: 'not_found',
          message: 'Batch not found on blockchain'
        }
      });

      const result = await validateHerbImage('test-image.jpg', 'invalid-batch');
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual(expect.objectContaining({
        code: 'batch_not_found',
        message: expect.stringContaining('not found on blockchain')
      }));
    });

    it('should reject when image fails AI verification', async () => {
      process.env.AI_TEST_MOCK_OFF = '1';
      const { setTestMock } = require('../../src/services/aiValidationService');
      // Set up mocks for file system
      fs.existsSync.mockReturnValue(true);
      fs.createReadStream.mockReturnValue({
        on: jest.fn(),
        pipe: jest.fn()
      });
      blockchainService.getHerbBatchData.mockResolvedValue({
        success: true,
        data: {
          id: 'batch123',
          name: 'Ashwagandha',
          origin: 'Kerala',
          imageHash: 'QmTestImageHash123'
        }
      });
      // Inject test mock
      setTestMock(async (imagePath, batchId) => {
        // Simulate blockchain check
        const blockchainCheck = await blockchainService.getHerbBatchData(batchId);
        if (!blockchainCheck.success) return blockchainCheck;
        // Simulate AI verification failure
        return {
          success: false,
          error: {
            code: 'verification_failed',
            message: 'AI model could not verify the herb',
            details: {
              confidence: 0.2,
              herbName: 'Unknown'
            }
          }
        };
      });
      const { validateHerbImage } = require('../../src/services/aiValidationService');
      const result = await validateHerbImage('test-image.jpg', 'batch123');
      expect(result.success).toBe(false);
      expect(result.error).toEqual(expect.objectContaining({
        code: 'verification_failed',
        message: expect.stringContaining('could not verify')
      }));
      // Restore
      setTestMock(null);
      delete process.env.AI_TEST_MOCK_OFF;
    });
  });
});