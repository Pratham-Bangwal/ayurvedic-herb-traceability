require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const herbsRouter = require('./routes/herbs');

const app = express();

// Simple disk storage for demo (images) before IPFS integration
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, max: 300 }));
app.use('/uploads', express.static(uploadsDir));

// Attach uploader to request for controllers (demo pattern)
app.use((req, res, next) => { req._uploader = upload; next(); });

app.use('/api/herbs', herbsRouter);
// Health endpoint
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
app.get('/api/trace/:batchId', async (req, res) => {
  const Herb = require('./models/herbModel');
  const doc = await Herb.findOne({ batchId: req.params.batchId }).lean();
  if (!doc) return res.status(404).json({ error: 'not_found' });
  res.json({ batchId: doc.batchId, name: doc.name, processingEvents: doc.processingEvents, photoIpfsCid: doc.photoIpfsCid, chain: doc.chain });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'herb-traceability-backend' });
});

async function connectDb() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/herb_traceability';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, { autoIndex: true });
    console.log('[db] connected');
  }
}

function validateEnv() {
  const required = ['PORT','MONGODB_URI'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) console.warn('[env] missing vars:', missing.join(', '));
}

function loadContractAbi() {
  try {
    const abiPath = path.join(__dirname, 'abi', 'HerbRegistry.json');
    if (fs.existsSync(abiPath)) {
      const abi = JSON.parse(fs.readFileSync(abiPath,'utf8'));
      global.__herbRegistryAbi = abi;
      console.log('[abi] HerbRegistry ABI loaded');
    }
  } catch (e) {
    console.warn('[abi] failed to load', e.message);
  }
}

const port = process.env.PORT || 4000;
if (require.main === module) {
  validateEnv();
  loadContractAbi();
  connectDb().then(() => {
    app.listen(port, () => console.log(`Backend listening on :${port}`));
  }).catch(e => {
    console.error('Failed to start server', e);
    process.exit(1);
  });
}

module.exports = { app, connectDb };
