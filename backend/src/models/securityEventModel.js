// Persistent audit/security events (append-only)
const mongoose = require('mongoose');

const securityEventSchema = new mongoose.Schema({
  type: { type: String, index: true },
  username: String,
  ip: String,
  userAgent: String,
  meta: {},
  ts: { type: Date, default: Date.now }
}, { timestamps: false });

securityEventSchema.index({ ts: -1 });

module.exports = mongoose.models.SecurityEvent || mongoose.model('SecurityEvent', securityEventSchema);