/**
 * Enhanced Herb Model for Ayurvedic Herb Traceability
 * Stores herb information and links to blockchain data
 */
const mongoose = require('mongoose');
// Use in-memory repo for tests
const isTest = process.env.NODE_ENV === 'test';
const memoryRepo = require('./herbMemoryRepo');

// Geolocation schema for herb origin
const geoSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: [0, 0] },
  description: String
});

// Processing events schema
const eventSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    actor: String,
    eventType: { 
      type: String, 
      enum: ['harvest', 'process', 'test', 'package', 'ship', 'verify']
    },
    data: String,
    location: geoSchema
  },
  { _id: false }
);

// Ownership transfer schema
const transferSchema = new mongoose.Schema(
  {
    from: String,
    to: String,
    timestamp: { type: Date, default: Date.now },
    transactionHash: String
  },
  { _id: false }
);

// Verification schema
const verificationSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    verifier: String,
    status: Boolean,
    confidence: Number,
    evidence: String, // Path to verification image or data
    transactionHash: String
  },
  { _id: false }
);

// Main herb schema
const herbSchema = new mongoose.Schema({
  // Core identification
  id: { type: String, required: true, unique: true },
  batchId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  scientificName: String,
  
  // Origin information
  origin: { type: String, required: true },
  farmer: { type: String, required: true },
  farmerContact: String,
  location: geoSchema,
  // Harvest information
  harvestDate: { type: String, required: true }, // ISO date format
  quantity: Number,
  unit: { type: String, default: 'kg' },
  
  // Quality and certification
  organicCertified: { type: Boolean, default: false },
  certificationAuthority: String,
  certificationId: String,
  properties: [String], // Medicinal properties
  
  // Blockchain integration
  imageHash: String, // IPFS hash of herb image
  blockchainId: String, // ID on blockchain
  transactionHash: String, // Blockchain transaction hash
  blockNumber: Number, // Blockchain block number
  verified: { type: Boolean, default: false },
  
  // History
  processingEvents: [eventSchema],
  ownershipTransfers: [transferSchema],
  verificationHistory: [verificationSchema],
  
  // AI validation results
  aiValidation: {
    confidence: Number,
    herbName: String,
    verified: Boolean,
    timestamp: { type: Date, default: Date.now }
  },
  
  // Metadata
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create model from schema
const Herb = mongoose.model('Herb', herbSchema);

/**
 * Get all herbs with basic information
 * @returns {Array} - List of herbs
 */
async function getAllHerbs() {
  try {
    return await Herb.find({}, {
      id: 1,
      name: 1,
      origin: 1,
      farmer: 1,
      harvestDate: 1,
      verified: 1
    }).lean();
  } catch (error) {
    console.error('Error fetching herbs:', error);
    throw error;
  }
}

/**
 * Get herb by ID
 * @param {string} id - Herb ID
 * @returns {Object} - Herb data
 */
async function getHerbById(id) {
  try {
    return await Herb.findOne({ id }).lean();
  } catch (error) {
    console.error(`Error fetching herb ${id}:`, error);
    throw error;
  }
}

/**
 * Add a new herb batch
 * @param {Object} herbData - Herb data
 * @returns {Object} - Created herb
 */
async function addHerbBatch(herbData) {
  if (isTest) {
    // Use in-memory repo for tests
    if (!herbData.id) {
      herbData.id = `herb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    if (!herbData.batchId) {
      herbData.batchId = herbData.id;
    }
    await memoryRepo.create(herbData);
    return { success: true, data: herbData };
  }
  try {
    if (!herbData.id) {
      herbData.id = `herb-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    if (!herbData.batchId) {
      herbData.batchId = herbData.id;
    }
    const herb = new Herb(herbData);
    await herb.save();
    return { success: true, data: herb };
  } catch (error) {
    return { success: false, error };
  }
}

// Export model and functions
if (isTest) {
  module.exports = {
    getAllHerbs: memoryRepo.find,
    getHerbById: memoryRepo.findOne,
    addHerbBatch: memoryRepo.create
  };
} else {
  module.exports = {
    Herb,
    getAllHerbs,
    getHerbById,
    addHerbBatch
  };
}
