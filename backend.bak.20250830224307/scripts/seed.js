/* Seed sample herb batches */
require('dotenv').config();
const { connectDb } = require('../src/index');
const Herb = require('../src/models/herbModel');

async function run() {
  await connectDb();
  const samples = [
    { name: 'Ashwagandha', batchId: 'DEMO-A1', harvestedAt: new Date(), geoLocation: { type: 'Point', coordinates: [77.59, 12.97] } },
    { name: 'Tulsi', batchId: 'DEMO-T1', harvestedAt: new Date(), geoLocation: { type: 'Point', coordinates: [75.86, 14.15] } }
  ];
  for (const s of samples) {
    await Herb.updateOne({ batchId: s.batchId }, { $set: s }, { upsert: true });
  }
  console.log('Seed complete');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });