// Placeholder AI validation: randomly assigns a confidence for claimed herb name.
function validateHerbImage(claimedName, filePath) {
  const confidence = Number((0.5 + Math.random() * 0.5).toFixed(2));
  return {
    predictedName: claimedName, // pretend model matches claim
    confidence,
    model: 'demo-cnn-v0',
    validatedAt: new Date()
  };
}

module.exports = { validateHerbImage };