const mongoose = require('mongoose');

const geoSchema = new mongoose.Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: [0, 0] },
});

const eventSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    actor: String,
    data: String,
  },
  { _id: false }
);

const transferSchema = new mongoose.Schema(
  {
    to: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const herbSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  herbName: String, // Specific herb name (e.g., Turmeric, Ashwagandha)
  farmerName: String,
  plantingDate: Date,
  harvestDate: Date,
  quantity: Number,
  unit: { type: String, default: 'kg' },
  farmLocation: String, // Human-readable location
  organicCertified: { type: Boolean, default: false },
  notes: String,
  geo: geoSchema,
  photoIpfsCid: String,
  processingEvents: [eventSchema],
  ownershipTransfers: [transferSchema],
  aiValidation: {
    confidence: Number,
    label: String,
    mock: Boolean,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Herb', herbSchema);
