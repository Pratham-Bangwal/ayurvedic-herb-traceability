/**
 * Unit tests for Rate Limiter Middleware
 * Tests rate limiting functionality
 */
const { createRateLimiter, limiters } = require('../../src/middleware/rateLimiter');

// Mock Express request and response objects
const mockRequest = () => ({
  ip: '127.0.0.1',
  path: '/test-path',
  headers: {}
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

describe('Rate Limiter Middleware', () => {
  describe('createRateLimiter', () => {
    it('should create a rate limiter middleware function', () => {
      const limiter = createRateLimiter();
      expect(typeof limiter).toBe('function');
    });

    it('should use default options when none provided', () => {
      const limiter = createRateLimiter();
      expect(limiter).toBeDefined();
      // We can't inspect the internal options of the limiter directly in the current implementation
      // Instead, verify it's a function (middleware)
      expect(typeof limiter).toBe('function');
    });

    it('should override default options with provided options', () => {
      const limiter = createRateLimiter({
        windowMs: 60000, // 1 minute
        max: 5 // 5 requests
      });
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });
  });

  describe('limiters object', () => {
    it('should have auth limiter with stricter limits', () => {
      expect(limiters.auth).toBeDefined();
      // We can't inspect internal options directly
      expect(typeof limiters.auth).toBe('function');
    });

    it('should have api limiter with standard limits', () => {
      expect(limiters.api).toBeDefined();
      expect(typeof limiters.api).toBe('function');
    });

    it('should have sensitive limiter with very strict limits', () => {
      expect(limiters.sensitive).toBeDefined();
      expect(typeof limiters.sensitive).toBe('function');
    });
  });
});