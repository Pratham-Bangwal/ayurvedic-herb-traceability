const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GeoSchema = new Schema({
  type: { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number], default: [0, 0] }
});

const EventSchema = new Schema({
  timestamp: { type: Date, default: Date.now },
  actor: String,
  data: String
}, { _id: false });

const HerbSchema = new Schema({
  batchId: { type: String, required: true, unique: true },
  farmerName: String,
  geo: GeoSchema,
  metadataURI: String,
  imagePath: String,
  processingEvents: [EventSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = require("mongoose").model("Herb", HerbSchema);
