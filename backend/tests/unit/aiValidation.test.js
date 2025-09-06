process.env.MOCK_MODE = 'true';
const { validateHerbImage } = require('../../src/services/aiValidationService');

describe('AI validation service (mock deterministic)', () => {
  test('returns deterministic confidence for same input', () => {
    const buf = Buffer.from('sample');
    const a = validateHerbImage('Tulsi', buf).confidence;
    const b = validateHerbImage('Tulsi', buf).confidence;
    expect(a).toBe(b);
  });

  test('different name yields different (likely) confidence', () => {
    const buf = Buffer.from('sample');
    const a = validateHerbImage('Tulsi', buf).confidence;
    const b = validateHerbImage('Ashwagandha', buf).confidence;
    expect(a).not.toBe(b);
  });
});
