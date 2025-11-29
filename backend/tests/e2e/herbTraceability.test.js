/**
 * End-to-end test for the herb traceability workflow
 * This tests the complete flow from registration to verification
 */
const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { createServer } = require('../../src/index');

// Skip these tests if CI environment doesn't support it
if (!process.env.RUN_E2E_TESTS) process.env.RUN_E2E_TESTS = 'true';
const runEndToEndTests = process.env.RUN_E2E_TESTS === 'true';
const testGroup = runEndToEndTests ? describe : describe;

// Prepare test image
const copyTestImage = () => {
  const sourceImage = path.join(__dirname, '..', '..', 'test.jpg');
  const targetImage = path.join(__dirname, '..', '..', 'uploads', 'test', 'test-herb.jpg');
  
  if (fs.existsSync(sourceImage)) {
    fs.copyFileSync(sourceImage, targetImage);
    return targetImage;
  }
  return null;
};

testGroup('Herb Traceability E2E Flow', () => {
  let app;
  let server;
  let testImagePath = path.join(__dirname, '..', '..', 'herb.jpg');
  let authToken;
  let createdHerbBatchId;

  // Debug: Print resolved path and existence
  console.log('DEBUG: Resolved herb.jpg path:', testImagePath);
  console.log('DEBUG: Exists:', fs.existsSync(testImagePath));

  // Set up server and test data before tests
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    
    // Use herb.jpg for both registration and verification
    if (!fs.existsSync(testImagePath)) {
      console.error('DEBUG: herb.jpg not found at', testImagePath);
      // List files in parent directory for further debug
      const parentDir = path.dirname(testImagePath);
      console.error('DEBUG: Files in', parentDir, ':', fs.readdirSync(parentDir));
      throw new Error('Test image herb.jpg not found');
    }
    
    // Create and start server
    const serverInstance = await createServer(4001);
    app = serverInstance.app;
    server = serverInstance.server;
  }, 30000);

  // Clean up after all tests
  afterAll(async () => {
    if (server && server.close) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('Authentication Flow', () => {
    it('should authenticate admin user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('token');
      authToken = response.body.data.token;
    });
  });

  describe('Herb Registration Flow', () => {
    it('should register a new herb batch', async () => {
      expect(authToken).toBeDefined();
      // Always use herb.jpg for registration
      const response = await request(app)
        .post('/api/herbs/register')
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Tulsi')
        .field('origin', 'Maharashtra')
        .field('farmer', 'Test Farmer')
        .field('harvestDate', '2023-06-01')
        .attach('photo', testImagePath);
      if (response.status !== 201) {
        // Print error for debugging
        console.error('Registration error:', response.body);
      }
      expect(response.status).toBe(201);
  expect(response.body.data).toHaveProperty('batchId');
  createdHerbBatchId = response.body.data.batchId;
    });

    it('should retrieve the registered herb batch', async () => {
      expect(createdHerbBatchId).toBeDefined();
      
      const response = await request(app)
        .get(`/api/herbs/batch/${createdHerbBatchId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('name', 'Tulsi');
      expect(response.body.data).toHaveProperty('origin', 'Maharashtra');
    });
  });

  describe('Herb Verification Flow', () => {
    it('should verify herb image', async () => {
      expect(createdHerbBatchId).toBeDefined();
      const response = await request(app)
        .post('/api/herbs/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('photo', testImagePath)
        .field('batchId', createdHerbBatchId);
      // In test mode, we expect the mock verification to succeed
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('verified');
      expect(response.body.data).toHaveProperty('batchId', createdHerbBatchId);
    });
  });

  describe('Analytics Data Flow', () => {
    it('should retrieve analytics data', async () => {
      expect(authToken).toBeDefined();
      
      const response = await request(app)
        .get('/api/analytics/herb-distribution')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      // Verify our registered herb is included in analytics
      expect(response.body.data.some(item => 
        item.name === 'Tulsi' && item.origin === 'Maharashtra'
      )).toBe(true);
    });
  });
});