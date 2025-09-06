const mongoose = require('mongoose');
const Herb = require('../src/models/herbModel');
const memoryRepo = require('../src/models/herbMemoryRepo');

module.exports = async () => {
  process.env.NODE_ENV = 'test';
  if (!process.env.MOCK_MODE) process.env.MOCK_MODE = 'true';
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/testdb';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
    global.__SKIP_DB__ = false;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[test setup] Mongo not available, using in-memory repo:', err.message);
    global.__SKIP_DB__ = false; // we won't skip; we fallback
    // Patch model methods used in controller
    Herb.create = memoryRepo.create;
    Herb.find = async () => memoryRepo.find();
    Herb.findOne = async (q) => memoryRepo.findOne(q);
  }
};
