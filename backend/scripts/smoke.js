#!/usr/bin/env node
/**
 * Simple smoke test script to be run after full stack is up.
 * It performs:
 * 1. Health check
 * 2. Admin login
 * 3. Herb creation
 * 4. Processing event addition
 * 5. Ownership transfer
 * 6. Trace retrieval
 */

const http = require('http');

function delay(ms){ return new Promise(r=>setTimeout(r,ms)); }

function request(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body ? Buffer.byteLength(body) : 0,
        ...headers
      }
    };
    const req = http.request(options, res => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        const text = chunks.toString();
        let json = null;
        try { json = JSON.parse(text); } catch { /* ignore */ }
        resolve({ status: res.statusCode, body: text, json });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

(async () => {
  try {
    console.log('Starting smoke test...');
    // Wait for backend readiness (retry up to 30s)
    let health; let attempts=0;
    while (attempts < 30) {
      try { health = await request('GET', '/healthz'); if (health.status === 200) break; } catch(_) {}
      await delay(1000); attempts++;
    }
    if (!health || health.status !== 200) throw new Error('Health check failed after retries');
    if (health.status !== 200) throw new Error('Health check failed');
    console.log('✓ Health OK');

    // Login
    const login = await request('POST', '/api/auth/login', { username: 'admin', password: 'admin123' });
    if (login.status !== 200 || !login.json?.data?.token) throw new Error('Login failed');
    console.log('✓ Login OK');
    const token = login.json.data.token;

    // Create herb
    const batchId = 'smoke-' + Date.now();
    const create = await request('POST', '/api/herbs', {
      batchId,
      name: 'Smoke Test Herb',
      origin: 'DemoFarm',
      farmer: 'Demo Farmer',
      harvestDate: new Date().toISOString().slice(0,10),
      quantity: 5,
      unit: 'kg'
    });
    if (create.status !== 201) {
      console.error('Create response status:', create.status, 'body:', create.body);
      throw new Error('Herb create failed');
    }
    console.log('✓ Herb create OK');

    // Add processing event
    const proc = await request('POST', `/api/herbs/${batchId}/process`, {
      actor: 'processor-unit',
      data: 'Drying:Low-temp'
    }, { Authorization: `Bearer ${token}` });
    if (proc.status !== 200) throw new Error('Processing event failed');
    console.log('✓ Processing event OK');

    // Ownership transfer
    const transfer = await request('POST', `/api/herbs/${batchId}/transfer`, {
      newOwner: '0x1234567890abcdef',
      notes: 'To distributor'
    }, { Authorization: `Bearer ${token}` });
    if (transfer.status !== 200) throw new Error('Transfer failed');
    console.log('✓ Ownership transfer OK');

    // Trace
    const trace = await request('GET', `/api/herbs/${batchId}/trace`);
    if (trace.status !== 200) throw new Error('Trace retrieval failed');
    console.log('✓ Trace retrieval OK');

    console.log('\nSMOKE TEST SUCCESS');
  } catch (e) {
    console.error('SMOKE TEST FAILED:', e);
    process.exit(1);
  }
})();
