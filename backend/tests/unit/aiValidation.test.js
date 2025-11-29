process.env.MOCK_MODE = 'true';
const { validateHerbImage } = require('../../src/services/aiValidationService');

describe('AI validation service (mock deterministic)', () => {
  beforeAll(() => {
    // Patch the service to return deterministic confidence based on name
    const { setTestMock } = require('../../src/services/aiValidationService');
    setTestMock((imagePath, batchId) => {
      // Use name from batchId for deterministic confidence
      const name = batchId;
      return {
        success: true,
        data: {
          verified: true,
          confidence: name === 'Tulsi' ? 0.88 : name === 'Ashwagandha' ? 0.77 : 0.5,
          herbName: name,
          batchId,
        }
      };
    });
  });

  test('returns deterministic confidence for same input', async () => {
    const a = (await validateHerbImage('dummy-path', 'Tulsi')).data.confidence;
    const b = (await validateHerbImage('dummy-path', 'Tulsi')).data.confidence;
    expect(a).toBe(b);
  });

  test('different name yields different (likely) confidence', async () => {
    const a = (await validateHerbImage('dummy-path', 'Tulsi')).data.confidence;
    const b = (await validateHerbImage('dummy-path', 'Ashwagandha')).data.confidence;
    expect(a).not.toBe(b);
  });
});
