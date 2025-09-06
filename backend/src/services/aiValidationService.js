// Placeholder AI validation: assigns confidence.
// When MOCK_MODE=true produces deterministic pseudo confidence based on hash of inputs.
const crypto = require('crypto');
const { isMock } = require('./mode');

function deterministicConfidence(seed) {
  const hash = crypto.createHash('sha256').update(seed).digest('hex');
  // Map first 2 bytes to range [0.55, 0.95]
  const raw = parseInt(hash.slice(0, 4), 16) / 0xffff; // 0..1
  return Number((0.55 + raw * 0.4).toFixed(2));
}

function validateHerbImage(claimedName, fileBuffer) {
  let confidence;
  if (isMock()) {
    const len = fileBuffer ? fileBuffer.length || 0 : 0;
    confidence = deterministicConfidence(`${claimedName}|${len}`);
  } else {
    confidence = Number((0.5 + Math.random() * 0.5).toFixed(2));
  }
  return {
    predictedName: claimedName,
    confidence,
    model: isMock() ? 'demo-cnn-mock' : 'demo-cnn-v0',
    validatedAt: new Date(),
  };
}

module.exports = { validateHerbImage };
