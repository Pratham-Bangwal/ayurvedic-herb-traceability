// backend/tests/unit/memoryRepo.test.js
const repo = require('../../src/models/herbMemoryRepo');

/**
 * These tests lock down expected behavior of the in-memory repository
 * used when MongoDB is unavailable (offline demo / CI with MOCK_MODE).
 */

describe('herbMemoryRepo', () => {
  beforeEach(() => {
    repo.__store.clear();
  });

  test('create stores and findOne retrieves same reference', async () => {
    const doc = await repo.create({ batchId: 'T1', name: 'Tulsi' });
    const found = await repo.findOne({ batchId: 'T1' });
    expect(found).toBe(doc); // same object reference
    expect(found.name).toBe('Tulsi');
    expect(Array.isArray(found.processingEvents)).toBe(true);
  });

  test('processingEvents persist after manual push + save', async () => {
    const doc = await repo.create({ batchId: 'T2', name: 'Neem' });
    doc.processingEvents.push({ actor: 'ProcA', data: 'washed', timestamp: new Date() });
    await doc.save();
    const reread = await repo.findOne({ batchId: 'T2' });
    expect(reread.processingEvents.length).toBe(1);
    expect(reread.processingEvents[0].actor).toBe('ProcA');
  });

  test('ownershipTransfers accumulate', async () => {
    const doc = await repo.create({ batchId: 'T3', name: 'Ashwagandha' });
    doc.ownershipTransfers.push({ to: '0xABC', timestamp: new Date() });
    await doc.save();
    doc.ownershipTransfers.push({ to: '0xDEF', timestamp: new Date() });
    await doc.save();
    const reread = await repo.findOne({ batchId: 'T3' });
    expect(reread.ownershipTransfers.map((t) => t.to)).toEqual(['0xABC', '0xDEF']);
  });

  test('duplicate create replaces previous doc', async () => {
    const first = await repo.create({ batchId: 'T4', name: 'Old' });
    const second = await repo.create({ batchId: 'T4', name: 'New' });
    expect(second).not.toBe(first);
    const found = await repo.findOne({ batchId: 'T4' });
    expect(found.name).toBe('New');
  });

  test('find returns all docs', async () => {
    await repo.create({ batchId: 'A', name: 'A' });
    await repo.create({ batchId: 'B', name: 'B' });
    const all = await repo.find();
    const ids = all.map((d) => d.batchId).sort();
    expect(ids).toEqual(['A', 'B']);
  });
});
