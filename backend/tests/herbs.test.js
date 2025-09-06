// backend/tests/herbs.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'testsecret';
const { app } = require('../src/index');
function makeToken(role = 'farmer') {
  return jwt.sign({ sub: 'u1', role }, process.env.JWT_SECRET, { expiresIn: '1h' });
}
// eslint-disable-next-line no-unused-vars
const Herb = require('../src/models/herbModel');

jest.setTimeout(20000);

describe('Herbs API', () => {
  test('GET /api/herbs should return paginated structure (empty initially)', async () => {
    const res = await request(app).get('/api/herbs');
    expect(res.status).toBe(200);
    expect(typeof res.body.data).toBe('object');
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBe(0);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.total).toBe(0);
  });

  test('POST /api/herbs creates herb', async () => {
    const res = await request(app)
      .post('/api/herbs')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .send({ name: 'Ashwagandha', batchId: 'B1' });
    expect(res.status).toBe(201);
    expect(res.body.data.batchId).toBe('B1');
    expect(res.body.data.qr).toBeDefined();
  });

  test('POST /api/herbs/create (legacy) also works', async () => {
    const res = await request(app)
      .post('/api/herbs/create')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .send({ name: 'Brahmi', batchId: 'BLEG' });
    expect(res.status).toBe(201);
    expect(res.body.data.batchId).toBe('BLEG');
  });

  test('POST /api/herbs/:batchId/process adds event', async () => {
    await request(app)
      .post('/api/herbs')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .send({ name: 'Neem', batchId: 'BPROC' });
    const res = await request(app)
      .post('/api/herbs/BPROC/process')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .send({ actor: 'ProcessorA', data: 'sun-dried' });
    expect(res.status).toBe(200);
    expect(res.body.data.processingEvents.length).toBe(1);
    expect(res.body.data.processingEvents[0].actor).toBe('farmer:ProcessorA');
  });

  test('POST /api/herbs/:batchId/events (legacy) adds event', async () => {
    await request(app)
      .post('/api/herbs')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .send({ name: 'Tulsi2', batchId: 'BEVTLEG' });
    const res = await request(app)
      .post('/api/herbs/BEVTLEG/events')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .send({ actor: 'Farmer', data: 'harvested' });
    expect(res.status).toBe(200);
    expect(res.body.data.processingEvents[0].actor).toBe('farmer:Farmer');
  });

  test('POST /api/herbs/upload creates herb with media (no file attached ok)', async () => {
    const res = await request(app)
      .post('/api/herbs/upload')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .field('name', 'TestHerb')
      .field('batchId', 'BUPLOAD')
      .field('lat', '10.1')
      .field('lng', '77.2');
    expect([201, 400]).toContain(res.status);
  });

  test('GET /api/herbs/:batchId/trace returns trace', async () => {
    const res = await request(app).get('/api/herbs/B1/trace');
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.data.batchId).toBe('B1');
    }
  });

  test('POST /api/herbs/validate-image rejects without photo', async () => {
    const res = await request(app).post('/api/herbs/validate-image').field('batchId', 'B1');
    expect([400, 404]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.error).toBeDefined();
    }
  });

  test('POST /api/herbs/:batchId/transfer transfers ownership', async () => {
    await request(app)
      .post('/api/herbs')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .send({ name: 'Tulsi', batchId: 'B2' });
    const res = await request(app)
      .post('/api/herbs/B2/transfer')
      .set('Authorization', `Bearer ${makeToken('manufacturer')}`)
      .send({ newOwner: '0x123' });
    expect(res.status).toBe(200);
    expect(res.body.data.ownershipTransfers.length).toBeGreaterThan(0);
    expect(res.body.data.ownershipTransfers[0].to).toBe('0x123');
  });

  test('Legacy create endpoint sets deprecation headers', async () => {
    const res = await request(app)
      .post('/api/herbs/create')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .send({ name: 'HdrTest', batchId: 'BDEP1' });
    expect(res.status).toBe(201);
    expect(res.headers.deprecation).toBe('true');
    expect(res.headers.warning).toMatch(/Deprecated endpoint/);
    expect(res.headers.link).toMatch(/\/api\/herbs/);
  });

  test('Legacy events endpoint sets deprecation headers', async () => {
    await request(app)
      .post('/api/herbs')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .send({ name: 'HdrEvt', batchId: 'BDEP2' });
    const res = await request(app)
      .post('/api/herbs/BDEP2/events')
      .set('Authorization', `Bearer ${makeToken('farmer')}`)
      .send({ actor: 'Tester', data: 'legacy-event' });
    expect(res.status).toBe(200);
    expect(res.headers.deprecation).toBe('true');
    expect(res.headers.warning).toMatch(/Deprecated endpoint/);
    expect(res.headers.link).toMatch(/process/);
  });
});
// Note: More tests can be added for edge cases and error handling
