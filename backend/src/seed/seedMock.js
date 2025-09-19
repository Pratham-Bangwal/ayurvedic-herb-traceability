// Purpose: Seed sample batches when MOCK_MODE enabled
// Usage: invoked from index.js after DB connect
// Notes: Idempotent insert based on batchId

const fs = require('fs');
const path = require('path');
const Herb = require('../models/herbModel');
const { isMock } = require('../services/mode');

async function seedMockData() {
  // Seed only if mock mode AND seeding explicitly enabled
  if (!isMock()) return;
  if (process.env.MOCK_SEED !== 'true') {
    console.log('ℹ️ Mock seeding disabled (set MOCK_SEED=true to enable)');
    return;
  }
  try {
    const file = path.join(__dirname, 'sample-batches.json');
    if (!fs.existsSync(file)) return;
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const entry of raw) {
      const exists = await Herb.findOne({ batchId: entry.batchId });
      if (exists) continue;
      await Herb.create(entry);
    }
    console.log(`✅ Mock seed complete (${raw.length} batches processed)`);
  } catch (e) {
    console.warn('⚠️ Mock seed failed:', e.message);
  }
}

module.exports = { seedMockData };
