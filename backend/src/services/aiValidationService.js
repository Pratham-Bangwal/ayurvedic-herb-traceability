/**
 * AI Image Validation Service (Stub)
 * Replace with actual TensorFlow.js or ML service
 */

const HERBS = ['ashwagandha', 'tulsi', 'neem', 'turmeric', 'ginger', 'brahmi'];
const crypto = require('crypto');
const { isMock } = require('./mode');

function validateHerbImage(expectedHerb, imageBuffer) {
  const size = imageBuffer.length;
  const herbLower = expectedHerb.toLowerCase();

  let confidence;
  if (isMock()) {
    // Deterministic mock: hash of inputs -> stable confidence [0.1, 0.99]
    const h = crypto
      .createHash('sha256')
      .update(herbLower)
      .update('|')
      .update(imageBuffer)
      .digest('hex');
    const n = parseInt(h.slice(0, 8), 16) / 0xffffffff; // 0..1
    const boost = HERBS.includes(herbLower) ? 0.15 : 0;
    confidence = 0.1 + Math.min(0.89, n * 0.89 + boost);
  } else {
    // Non-deterministic demo logic
    confidence = 0.5;
    if (HERBS.includes(herbLower)) confidence += 0.2;
    if (size > 10000) confidence += 0.1;
    if (size < 100000) confidence += 0.1;
    confidence += (Math.random() - 0.5) * 0.2;
  }

  confidence = Math.max(0.1, Math.min(0.99, confidence));

  return {
    confidence: parseFloat(confidence.toFixed(2)),
    label: expectedHerb,
    detected: confidence > 0.7,
    mock: true,
    message:
      confidence > 0.7 ? 'High confidence match' : 'Low confidence - manual review recommended',
  };
}

module.exports = { validateHerbImage };
