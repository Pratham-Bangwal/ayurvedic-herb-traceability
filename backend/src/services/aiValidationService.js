/**
 * AI Image Validation Service (Stub)
 * Replace with actual TensorFlow.js or ML service
 */

const HERBS = ['ashwagandha', 'tulsi', 'neem', 'turmeric', 'ginger', 'brahmi'];

function validateHerbImage(expectedHerb, imageBuffer) {
  // Mock validation logic
  const size = imageBuffer.length;
  const herbLower = expectedHerb.toLowerCase();
  
  // Simulate confidence based on herb name and image size
  let confidence = 0.5;
  if (HERBS.includes(herbLower)) confidence += 0.2;
  if (size > 10000) confidence += 0.1;
  if (size < 100000) confidence += 0.1;
  
  // Add some randomness
  confidence += (Math.random() - 0.5) * 0.2;
  confidence = Math.max(0.1, Math.min(0.99, confidence));
  
  return {
    confidence: parseFloat(confidence.toFixed(2)),
    label: expectedHerb,
    detected: confidence > 0.7,
    mock: true,
    message: confidence > 0.7 ? 'High confidence match' : 'Low confidence - manual review recommended'
  };
}

module.exports = { validateHerbImage };
