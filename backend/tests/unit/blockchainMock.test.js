const {
  createBatch,
  addEvent,
  transferOwnership,
  __store,
} = require('../../src/services/blockchainMock');

describe('blockchainMock adapter', () => {
  test('createBatch initializes structures with blockNumber', async () => {
    const res = await createBatch('MOCK-1', '0xOwner', 'meta://x');
    expect(res).toHaveProperty('txHash');
    expect(res).toHaveProperty('blockNumber');
    expect(res.action).toBe('CREATE');
    expect(__store.batches['MOCK-1']).toBeDefined();
  });

  test('addEvent appends event with chain meta', async () => {
    const res = await addEvent('MOCK-1', 'actorA', 'drying');
    expect(res.action).toBe('EVENT');
    expect(res.blockNumber).toBeGreaterThan(0);
    expect(__store.events['MOCK-1'].length).toBeGreaterThan(0);
  });

  test('transferOwnership updates owner with chain meta', async () => {
    const res = await transferOwnership('MOCK-1', '0xNew');
    expect(res.action).toBe('TRANSFER');
    expect(res.blockNumber).toBeGreaterThan(0);
    expect(__store.ownership['MOCK-1']).toBe('0xNew');
  });
});
