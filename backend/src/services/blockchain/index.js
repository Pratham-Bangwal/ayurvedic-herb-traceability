// Purpose: Unified blockchain adapter selector
// Usage: const blockchain = require('../services/blockchain'); blockchain.createBatch(...)
// Notes: Chooses mock or real service based on MOCK_MODE

const { isMock } = require('../mode');
const real = require('../blockchainService');
const mock = require('../blockchainMock');

const adapter = isMock() ? mock : real;

module.exports = adapter;
