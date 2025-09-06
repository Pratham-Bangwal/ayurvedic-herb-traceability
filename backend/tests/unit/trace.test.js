const { buildTraceLinks } = require('../../src/utils/trace');

describe('buildTraceLinks', () => {
  test('generates traceUrl and qrDataURL', async () => {
    const { traceUrl, qrDataURL } = await buildTraceLinks('BATCH123');
    expect(traceUrl).toMatch(/trace\/BATCH123$/);
    expect(qrDataURL).toMatch(/^data:image\/png;base64,/);
  });

  test('throws on missing batchId', async () => {
    await expect(buildTraceLinks()).rejects.toThrow('batchId required');
  });
});
