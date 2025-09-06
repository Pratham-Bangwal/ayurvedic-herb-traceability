const request = require('supertest');
const { app } = require('../src');

describe('metrics exposition', () => {
  it('exposes histogram and labeled status codes', async () => {
    // Hit an API endpoint that flows through logging/metrics middleware
    await request(app).get('/api/herbs').expect(200);
    const res = await request(app).get('/metrics').expect(200);
    const body = res.text;
    expect(body).toMatch(/app_requests_total/);
    expect(body).toMatch(/app_requests_total\{code="200"}/);
    expect(body).toMatch(/app_request_duration_ms_bucket\{le="5"}/);
    expect(body).toMatch(/app_request_duration_ms_bucket\{le="\+Inf"}/);
    expect(body).toMatch(/app_request_duration_ms_sum/);
    expect(body).toMatch(/app_request_duration_ms_count/);
  });
});
