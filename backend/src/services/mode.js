/**
 * Environment mode detection
 */

function isMock() {
  return process.env.MOCK_MODE === 'true' || process.env.NODE_ENV === 'test';
}

function isDev() {
  return process.env.NODE_ENV === 'development';
}

function isProd() {
  return process.env.NODE_ENV === 'production';
}

module.exports = { isMock, isDev, isProd };
