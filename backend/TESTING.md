# Testing Guide for Ayurvedic Herb Traceability System

This document provides comprehensive instructions for running tests on the backend of the Ayurvedic Herb Traceability System.

## Testing Setup

The backend uses Jest as the primary testing framework, along with Supertest for API testing. The testing environment is configured to work with:

- **Unit Tests**: Testing individual functions and components in isolation
- **Integration Tests**: Testing interactions between components
- **E2E Tests**: Testing complete workflows through the API

## Test Structure

```
backend/
└── tests/
    ├── e2e/               # End-to-end tests for complete workflows
    ├── integration/       # Integration tests between components
    ├── unit/              # Unit tests for individual components
    ├── setup.js           # Global setup for tests
    └── teardown.js        # Global teardown for tests
```

## Running Tests

### All Tests

To run all tests:

```bash
npm test
```

### Specific Test Types

To run specific test types:

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Watch Mode

For development, you can run tests in watch mode:

```bash
npm run test:watch
```

### Coverage Reports

To generate coverage reports:

```bash
npm run test:coverage
```

This will create coverage reports in the `/coverage` directory.

## Test Environment

The test environment uses:

- MongoDB in-memory fallback for database tests
- Mock blockchain service for blockchain interactions
- Mock IPFS service for file storage
- Mock AI validation service

Tests can be run without external dependencies as all services have mock implementations.

## Writing New Tests

### Unit Tests

Unit tests should be placed in the `tests/unit/` directory and focus on testing individual functions or classes in isolation. Use Jest mocks to isolate the component under test.

Example:
```javascript
// tests/unit/example.test.js
const { functionToTest } = require('../../src/module');

describe('functionToTest', () => {
  it('should return expected output for given input', () => {
    const result = functionToTest('input');
    expect(result).toBe('expected output');
  });
});
```

### Integration Tests

Integration tests should be placed in the `tests/integration/` directory and test interactions between components. These tests may involve multiple modules working together.

Example:
```javascript
// tests/integration/example.test.js
const service = require('../../src/services/exampleService');
const repository = require('../../src/models/exampleModel');

describe('Example Integration', () => {
  it('should save data through the service and retrieve it through the repository', async () => {
    await service.saveData({ id: 'test', value: 'example' });
    const result = await repository.findById('test');
    expect(result.value).toBe('example');
  });
});
```

### E2E Tests

E2E tests should be placed in the `tests/e2e/` directory and test complete workflows through the API.

Example:
```javascript
// tests/e2e/example.test.js
const request = require('supertest');
const { createServer } = require('../../src/index');

describe('API E2E', () => {
  let app;
  
  beforeAll(async () => {
    const server = await createServer();
    app = server.app;
  });
  
  it('should create and retrieve data through the API', async () => {
    // Create data
    const createResponse = await request(app)
      .post('/api/resource')
      .send({ value: 'example' });
      
    const id = createResponse.body.data.id;
    
    // Retrieve data
    const getResponse = await request(app)
      .get(`/api/resource/${id}`);
      
    expect(getResponse.body.data.value).toBe('example');
  });
});
```

## Mocking Dependencies

For dependencies that need to be mocked:

```javascript
// Example mocking
jest.mock('../../src/services/dependencyService', () => ({
  methodName: jest.fn().mockResolvedValue({
    success: true,
    data: { /* mock data */ }
  })
}));
```

## Environment Variables

The test environment automatically sets:

- `NODE_ENV=test`
- `MOCK_MODE=true`

For E2E tests that require specific configurations, use the `cross-env` utility:

```bash
cross-env CUSTOM_VAR=value npm test
```

## Troubleshooting Tests

### Common Issues

1. **Database Connection Failures**
   - Tests will automatically fall back to in-memory repositories

2. **External Service Unavailability**
   - Mock implementations are used when in test mode

3. **Timeouts**
   - For slow tests, increase the timeout in Jest config or in individual tests:
   ```javascript
   it('should handle slow operations', async () => {
     // Test code
   }, 10000); // 10 second timeout
   ```

### Debug Logging

To enable debug logs during tests:

```bash
cross-env DEBUG=app:* npm test
```

## Continuous Integration

Tests are configured to run in CI environments. Make sure all tests pass before submitting a pull request.

---

For questions or issues with testing, please contact the development team.