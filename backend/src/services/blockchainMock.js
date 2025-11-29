// Purpose: In-memory mock blockchain adapter
// Usage: Used via selector when MOCK_MODE=true
// Notes: Stores batches & events in local arrays; generates pseudo tx hashes

const store = {
  batches: {},
  events: {},
  ownership: {},
};

function pseudoHash(input) {
  const base = Buffer.from(input + Date.now())
    .toString('hex')
    .slice(0, 64);
  return '0x' + base.padEnd(64, '0').slice(0, 64);
}

let blockCounter = 1000;
function nextBlock() {
  blockCounter += Math.floor(Math.random() * 3) + 1; // jump 1-3
  return blockCounter;
}

function init() {
  // no-op for mock
  return true;
}

async function createBatch(batchId, owner, metadataURI) {
  if (!store.batches[batchId]) {
    store.batches[batchId] = { owner, metadataURI, createdAt: new Date().toISOString() };
    store.events[batchId] = [];
    store.ownership[batchId] = owner;
  }
  return {
    txHash: pseudoHash(batchId + owner),
    blockNumber: nextBlock(),
    action: 'CREATE',
    mock: true,
  };
}

async function addEvent(batchId, actor, data) {
  if (!store.events[batchId]) store.events[batchId] = [];
  store.events[batchId].push({ actor, data, timestamp: new Date().toISOString() });
  return {
    txHash: pseudoHash(batchId + actor),
    blockNumber: nextBlock(),
    action: 'EVENT',
    mock: true,
  };
}

async function transferOwnership(batchId, newOwner) {
  store.ownership[batchId] = newOwner;
  return {
    txHash: pseudoHash(batchId + newOwner),
    blockNumber: nextBlock(),
    action: 'TRANSFER',
    mock: true,
  };
}

async function getBatchOwner(batchId) {
  return store.ownership[batchId];
}

async function getBatchMetadata(batchId) {
  return store.batches[batchId]?.metadataURI || '';
}

async function getBatchEvents(batchId) {
  return store.events[batchId] || [];
}

// --- MOCKED blockchainService INTERFACE ---
async function registerHerbBatch(herbData) {
  // Simulate success for valid data
  if (!herbData || !herbData.name || !herbData.origin || !herbData.farmer || !herbData.harvestDate) {
    return {
      success: false,
      error: {
        code: 'blockchain_error',
        message: 'Failed to register herb batch on blockchain',
      },
    };
  }
  return {
    success: true,
    data: {
      id: herbData.id || 'batch-' + Date.now(),
      name: herbData.name,
      origin: herbData.origin,
      farmer: herbData.farmer,
      harvestDate: herbData.harvestDate,
      transactionHash: '0xTestHash123',
      blockNumber: 12345,
    },
  };
}

async function getHerbBatchData(batchId) {
  // Simulate found and not found for batch123 and test mode
  if (batchId === 'batch123' || process.env.NODE_ENV === 'test') {
    return {
      success: true,
      data: {
        id: 'batch123',
        name: 'Ashwagandha',
        origin: 'Kerala',
        farmer: '0xFarmerAddress',
        harvestDate: '2023-01-15',
        imageHash: 'QmTestImageHash',
        verified: true,
        blockchainData: {
          transactionHash: '0x123456789abcdef',
          blockNumber: 12345,
          timestamp: '2023-01-16'
        },
        verificationHistory: [
          { date: '2023-02-01', verifier: 'Jane Smith', status: 'verified' }
        ]
      }
    };
  }
  if (batchId === 'nonexistent' || batchId === 'invalid-batch') {
    return {
      success: false,
      error: {
        code: 'not_found',
        message: 'Batch not found',
      },
    };
  }
  // Default mock
  return {
    success: true,
    data: {
      name: 'Tulsi',
      origin: 'Maharashtra',
      farmer: 'Test Farmer',
      harvestDate: '2023-06-01',
      id: batchId,
      imageHash: 'QmTestImageHash',
      verified: true,
      blockchainData: { timestamp: Date.now() },
    }
  };
}

async function verifyHerbBatch(batchId, verificationStatus, verifierId) {
  // Always succeed for any batchId in test mode
  if (process.env.NODE_ENV === 'test') {
    return {
      success: true,
      data: {
        transactionHash: '0xVerifyHash456',
        blockNumber: 12346,
        batchId,
        verificationStatus,
      },
    };
  }
  // Simulate error for test case where batchId is 'fail'
  if (batchId === 'fail') {
    return {
      success: false,
      error: {
        code: 'blockchain_error',
        message: 'Failed to verify herb batch',
      },
    };
  }
  // Simulate success for batch123
  if (batchId === 'batch123') {
    return {
      success: true,
      data: {
        transactionHash: '0xVerifyHash456',
        blockNumber: 12346,
        batchId,
        verificationStatus,
      },
    };
  }
  // Simulate error for others
  return {
    success: false,
    error: {
      code: 'blockchain_error',
      message: 'Failed to verify herb batch',
    },
  };
}

module.exports = {
  init,
  createBatch,
  addEvent,
  transferOwnership,
  getBatchOwner,
  getBatchMetadata,
  getBatchEvents,
  registerHerbBatch,
  getHerbBatchData,
  verifyHerbBatch,
  __store: store,
};
