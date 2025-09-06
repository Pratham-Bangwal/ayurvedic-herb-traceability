// backend/tests/validation.test.js
const { transferSchema, uploadHerbSchema } = require('../src/middleware/validation');

describe('Validation Schemas', () => {
  test('transferSchema rejects invalid newOwner format', () => {
    expect(() => transferSchema.parse({ newOwner: '123' })).toThrow(/hex address/);
    expect(() => transferSchema.parse({ newOwner: '0xZ12' })).toThrow(/hex address/);
  });

  test('transferSchema accepts hex-ish owner', () => {
    expect(() => transferSchema.parse({ newOwner: '0xabc123' })).not.toThrow();
  });

  test('uploadHerbSchema lat/lng range', () => {
    expect(() => uploadHerbSchema.parse({ name: 'H', batchId: 'B', lat: '91', lng: '10' })).toThrow(/lat out of range/);
    expect(() => uploadHerbSchema.parse({ name: 'H', batchId: 'B', lat: '10', lng: '181' })).toThrow(/lng out of range/);
    expect(() => uploadHerbSchema.parse({ name: 'H', batchId: 'B', lat: '-45.5', lng: '120.2' })).not.toThrow();
  });
});
