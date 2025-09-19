const { isMock } = require('./mode');

// Dynamic import based on environment
const service = isMock() ? require('./blockchainMock') : require('./blockchainService');

module.exports = service;
