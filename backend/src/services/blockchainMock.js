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

module.exports = {
  init,
  createBatch,
  addEvent,
  transferOwnership,
  getBatchOwner,
  getBatchMetadata,
  getBatchEvents,
  __store: store,
};
