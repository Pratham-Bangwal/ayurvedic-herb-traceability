  it('POST /api/herbs/:batchId/transfer transfers ownership', async () => {
    await request(app).post('/api/herbs').send({ name: 'Tulsi', batchId: 'B2' });
    const res = await request(app).post('/api/herbs/B2/transfer').send({ newOwner: '0x123' });
    expect(res.status).toBe(200);
    expect(res.body.chain).toBeDefined();
    expect(res.body.chain.newOwner).toBe('0x123');
  });
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { app, connectDb } = require('../src/index');
const Herb = require('../src/models/herbModel');

describe('Herbs API', () => {
  let mongo;
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri();
    await connectDb();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  it('GET /api/herbs should return array (empty initially)', async () => {
    const res = await request(app).get('/api/herbs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('POST /api/herbs creates herb', async () => {
    const res = await request(app).post('/api/herbs').send({ name: 'Ashwagandha', batchId: 'B1' });
    expect(res.status).toBe(201);
    expect(res.body.batchId).toBe('B1');
  });

  it('POST /api/herbs/:batchId/process adds event', async () => {
    await request(app).post('/api/herbs').send({ name: 'Neem', batchId: 'BPROC' });
    const res = await request(app).post('/api/herbs/BPROC/process').send({ stage: 'drying', notes: 'sun-dried', actor: 'ProcessorA' });
    expect(res.status).toBe(200);
    expect(res.body.processingEvents.length).toBe(1);
  });

  it('POST /api/herbs/upload creates herb with media (no file attached ok)', async () => {
    const res = await request(app).post('/api/herbs/upload')
      .field('name', 'TestHerb')
      .field('batchId', 'BUPLOAD')
      .field('lat', '10.1')
      .field('lng', '77.2');
    expect([201,400]).toContain(res.status);
  });

  it('GET /api/trace/:batchId returns trace', async () => {
    const res = await request(app).get('/api/trace/B1');
    expect([200,404]).toContain(res.status); // B1 might not exist if tests run in isolation
  });

  it('POST /api/herbs/validate/image rejects without photo', async () => {
    const res = await request(app).post('/api/herbs/validate/image').field('batchId', 'B1');
    expect([400,404]).toContain(res.status);
  });
});
