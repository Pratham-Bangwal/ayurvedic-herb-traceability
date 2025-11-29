/**
 * Integration test for blockchain service
 * Tests interaction with the blockchain for herb registration and verification
 */
const blockchainService = require('../../src/services/blockchainService');
const mode = require('../../src/services/mode');

// Save original mock mode setting and mock dependencies
let originalMockMode;

// Mock the blockchain Web3 dependency
jest.mock('web3', () => {
  return function() {
    return {
      eth: {
        Contract: jest.fn().mockImplementation(() => ({
          methods: {
            registerHerbBatch: jest.fn().mockReturnValue({
              send: jest.fn().mockResolvedValue({
                transactionHash: '0xTestHash123',
                blockNumber: 12345
              })
            }),
            getHerbBatch: jest.fn().mockReturnValue({
              call: jest.fn().mockResolvedValue({
                name: 'Ashwagandha',
                origin: 'Kerala',
                farmer: '0xFarmerAddress',
                harvestDate: '1610000000',
                imageHash: 'QmTestImageHash',
                verified: true
              })
            }),
            verifyHerbBatch: jest.fn().mockReturnValue({
              send: jest.fn().mockResolvedValue({
                transactionHash: '0xVerifyHash456',
                blockNumber: 12346
              })
            })
          }
        })),
        accounts: {
          create: jest.fn().mockReturnValue({ address: '0xNewAccount123' }),
          privateKeyToAccount: jest.fn().mockReturnValue({ address: '0xExistingAccount456' }),
          getAccounts: jest.fn().mockResolvedValue(['0xTestAccount123'])
        },
        getBlock: jest.fn().mockResolvedValue({
          timestamp: 1620000000
        }),
        getTransactionReceipt: jest.fn().mockResolvedValue({
          status: true
        })
      },
      utils: {
        toChecksumAddress: jest.fn(address => address),
        fromWei: jest.fn(value => value.toString()),
        toWei: jest.fn(value => value)
      }
    };
  };
});

describe('Blockchain Service Integration', () => {
  beforeAll(() => {
    // Store original mock mode setting
    originalMockMode = process.env.MOCK_MODE;
    // Force real blockchain mode for these tests
    process.env.MOCK_MODE = 'false';
  });

  afterAll(() => {
    // Restore original mock mode setting
    process.env.MOCK_MODE = originalMockMode;
  });

  beforeEach(() => {
    // Removed jest.clearAllMocks() to keep web3 mocks
  });

  describe('registerHerbBatch()', () => {
    it('should register herb batch on blockchain successfully', async () => {
      const herbData = {
        name: 'Ashwagandha',
        origin: 'Kerala',
        farmer: 'Farmer Name',
        harvestDate: '2023-05-15',
        imageHash: 'QmTestImageHash'
      };

      const result = await blockchainService.registerHerbBatch(herbData);
      
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        transactionHash: '0xTestHash123',
        blockNumber: 12345,
        name: 'Ashwagandha',
        origin: 'Kerala'
      });
    });

    it('should handle registration errors', async () => {
      // Mock a failure in the blockchain interaction
      const mockContract = require('web3')().eth.Contract();
      mockContract.methods.registerHerbBatch().send.mockRejectedValueOnce(
        new Error('Blockchain transaction failed')
      );

      const herbData = {
        name: 'Tulsi',
        origin: 'Maharashtra',
        farmer: 'Farmer Name',
        harvestDate: '2023-06-20',
        imageHash: 'QmAnotherTestHash'
      };

      const result = await blockchainService.registerHerbBatch(herbData);
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual(expect.objectContaining({
        code: 'blockchain_error',
        message: expect.stringContaining('Failed to register herb batch')
      }));
    });
  });

  describe('getHerbBatchData()', () => {
    it('should retrieve herb batch data from blockchain', async () => {
      const result = await blockchainService.getHerbBatchData('batch123');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        name: 'Ashwagandha',
        origin: 'Kerala',
        farmer: '0xFarmerAddress',
        verified: true
      }));
    });

    it('should handle errors when batch does not exist', async () => {
      // Mock a failure when batch doesn't exist
      const mockContract = require('web3')().eth.Contract();
      mockContract.methods.getHerbBatch().call.mockRejectedValueOnce(
        new Error('Batch not found')
      );

      const result = await blockchainService.getHerbBatchData('nonexistent');
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual(expect.objectContaining({
        code: 'not_found',
        message: expect.stringContaining('Herb batch not found')
      }));
    });
  });

  describe('verifyHerbBatch()', () => {
    it('should verify herb batch successfully', async () => {
      const result = await blockchainService.verifyHerbBatch('batch123', true, '0xVerifier789');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expect.objectContaining({
        transactionHash: '0xVerifyHash456',
        blockNumber: 12346,
        batchId: 'batch123',
        verificationStatus: true
      }));
    });

    it('should handle verification errors', async () => {
      // Simulate error in the mock by using batchId 'fail'
      const result = await blockchainService.verifyHerbBatch('fail', true, '0xVerifier789');
      
      expect(result.success).toBe(false);
      expect(result.error).toEqual(expect.objectContaining({
        code: 'blockchain_error',
        message: expect.stringContaining('Failed to verify herb batch')
      }));
    });
  });
});