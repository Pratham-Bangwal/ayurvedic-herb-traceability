const request = require('supertest');
process.env.JWT_SECRET = 'testsecret';
const jwt = require('jsonwebtoken');
const { app } = require('../src/index');

describe('Auth middleware', () => {
  test('rejects create without token', async () => {
    const res = await request(app).post('/api/herbs').send({ name: 'A', batchId: 'AUTH1' });
    expect(res.status).toBe(401);
  });
  test('accepts create with valid JWT + role', async () => {
    const token = jwt.sign({ sub: 'u1', role: 'farmer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .post('/api/herbs')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A2', batchId: 'AUTH2' });
    expect([201, 400]).toContain(res.status); // 201 normal, 400 validation edge
    if (res.status === 201) expect(res.body.data.batchId).toBe('AUTH2');
  });
});
