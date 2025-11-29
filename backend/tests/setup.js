/**
 * Setup file for Jest tests
 * Runs before tests start
 */
const mongoose = require('mongoose');
const Herb = require('../src/models/herbModel');
const memoryRepo = require('../src/models/herbMemoryRepo');

// Set test mode for services
process.env.MOCK_MODE = 'true';

// Optional: Set up global test fixtures here
global.testFixtures = {
  sampleHerb: {
    id: 'test-herb-1',
    name: 'Test Herb',
    origin: 'Test Region',
    properties: ['medicinal', 'aromatic']
  },
  sampleBatch: {
    id: 'test-batch-1',
    herbId: 'test-herb-1',
    quantity: 100,
    harvestDate: '2023-05-15',
    farmer: 'Test Farmer'
  },
  sampleUser: {
    username: 'testuser',
    password: 'password123',
    role: 'farmer'
  }
};

module.exports = async () => {
  process.env.NODE_ENV = 'test';
  if (!process.env.MOCK_MODE) process.env.MOCK_MODE = 'true';
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
  
  console.log('Setting up test environment...');
  
  if (process.env.USE_REAL_DB === 'true') {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log('Connected to test database');
      // Mark global flag so createServer() won't attempt a second connection
      global.mongoConnected = true;
      global.__SKIP_DB__ = false;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[test setup] Mongo not available, using in-memory repo:', err.message);
      global.__SKIP_DB__ = true;
      // Patch model methods used in controller
      Herb.create = memoryRepo.create;
      Herb.find = async () => memoryRepo.find();
      Herb.findOne = async (q) => memoryRepo.findOne(q);
    }
  } else {
    console.log('Skipping real Mongo connection (test memory mode)');
    global.__SKIP_DB__ = true;
    // Ensure model operations go to memory repo
    Herb.create = memoryRepo.create;
    Herb.find = async () => memoryRepo.find();
    Herb.findOne = async (q) => memoryRepo.findOne(q);
  }
  
  // Create test uploads directory if it doesn't exist
  const fs = require('fs');
  const path = require('path');
  const testUploadsDir = path.join(__dirname, '..', 'uploads', 'test');
  
  if (!fs.existsSync(testUploadsDir)) {
    fs.mkdirSync(testUploadsDir, { recursive: true });
  }
};
