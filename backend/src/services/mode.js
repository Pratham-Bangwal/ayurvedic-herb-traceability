// Purpose: Central helper to determine MOCK mode
// Usage: const { isMock } = require('./mode');
// Notes: MOCK_MODE true triggers mock adapters & seeding

function isMock() {
  return String(process.env.MOCK_MODE || '').toLowerCase() === 'true';
}

module.exports = { isMock };
