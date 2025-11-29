// Model for storing encrypted TOTP secrets and backup codes
const mongoose = require('mongoose');

const twoFactorSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  secretEnc: { type: String, required: true }, // encrypted secret
  backupCodesEnc: { type: [String], default: [] }, // encrypted backup codes
  enabled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.TwoFactor || mongoose.model('TwoFactor', twoFactorSchema);
