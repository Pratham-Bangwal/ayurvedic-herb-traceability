// Rate limiting middleware
const rateLimit = require('express-rate-limit');

/**
 * Creates rate limiters with different configurations
 * @param {Object} options - Limiter options
 * @returns {Function} Express middleware
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      error: {
        code: 'too_many_requests',
        message: 'Too many requests, please try again later.'
      }
    }
  };

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

// Pre-configured limiters
const limiters = {
  // Strict limiter for auth endpoints (5 requests per minute)
  auth: createRateLimiter({
    windowMs: 60 * 1000,
    max: 5,
    message: {
      error: {
        code: 'too_many_auth_attempts',
        message: 'Too many authentication attempts, please try again later.'
      }
    }
  }),

  // API limiter (100 requests per minute)
  api: createRateLimiter({
    windowMs: 60 * 1000,
    max: 100
  }),

  // Very strict limiter for sensitive operations (3 per hour)
  sensitive: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
      error: {
        code: 'too_many_sensitive_operations',
        message: 'Too many sensitive operations. Please try again later.'
      }
    }
  })
};

module.exports = {
  limiters,
  createRateLimiter
};