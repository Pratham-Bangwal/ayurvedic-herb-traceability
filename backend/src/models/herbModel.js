const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GeoSchema = new Schema({
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], default: [0, 0] },
});

const EventSchema = new Schema(
  {
    actor: String,
    data: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TransferSchema = new Schema(
  {
    to: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const HerbSchema = new Schema({
  batchId: { type: String, required: true, unique: true },
  name: String,
  farmerName: String,
  geo: GeoSchema,
  metadataURI: String,
  ipfsHash: String,
  photoIpfsCid: String,
  processingEvents: [EventSchema],
  ownershipTransfers: [TransferSchema], // ✅ new field
  aiValidation: {
    confidence: Number,
    model: String,
    validatedAt: Date,
  },
  chain: Object,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Herb', HerbSchema);
