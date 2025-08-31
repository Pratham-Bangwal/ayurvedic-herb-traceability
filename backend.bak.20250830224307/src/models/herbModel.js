const mongoose = require('mongoose');

const GeoPointSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
}, { _id: false });

const ProcessingEventSchema = new mongoose.Schema({
  stage: String, // e.g., 'drying', 'extraction', 'packaging'
  notes: String,
  at: { type: Date, default: Date.now },
  actor: String
}, { _id: false });

const HerbSchema = new mongoose.Schema({
  name: { type: String, required: true },
  batchId: { type: String, required: true, unique: true },
  originFarm: String,
  harvestedAt: Date,
  qualityScore: Number,
  geoLocation: GeoPointSchema,
  photoIpfsCid: String,
  metadataIpfsCid: String,
  processingEvents: [ProcessingEventSchema],
  chain: {
    txHash: String,
    registryAddress: String
  },
  aiValidation: {
    predictedName: String,
    confidence: Number,
    model: String,
    validatedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('Herb', HerbSchema);
