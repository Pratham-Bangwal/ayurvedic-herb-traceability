// Clean single implementation Herbs Controller
const herbModelModule = require('../models/herbModel');
const Herb = herbModelModule.Herb; // may be undefined in test/memory mode
const addHerbBatch = herbModelModule.addHerbBatch || herbModelModule.create || herbModelModule.add || (() => { throw new Error('addHerbBatch not available'); });
const getAllHerbs = herbModelModule.getAllHerbs || (() => []);
const getHerbById = herbModelModule.getHerbById || (() => null);
const qrcode = require('qrcode');

// --- Helpers & Mocks ---
const useMemory = () => !global.mongoConnected;
const mockCreateBatch = async () => ({ txHash: '0x' + Date.now().toString(16), mock: true });
const mockAddFileBuffer = async () => ({ cid: 'Qm' + Date.now().toString(36), mock: true });
const mockValidateImage = () => ({ confidence: 0.85, label: 'herb', mock: true });

// --- Analytics ---
exports.getHerbDistribution = async (req, res) => {
  try {
    const herbs = await getAllHerbs();
    const distribution = herbs.map(h => ({
      name: h.name || h.herbName,
      origin: h.origin || h.farmLocation || 'Unknown',
      batchId: h.batchId || h.id,
    }));
    res.status(200).json({ data: distribution });
  } catch (error) {
    res.status(500).json({ error: { code: 'internal_error', message: 'Error fetching analytics', details: error.message } });
  }
};

// --- Registration (multipart) ---
exports.registerHerb = async (req, res) => {
  try {
    const { name, origin, farmer, harvestDate } = req.body;
    if (!name || !origin || !farmer || !harvestDate) {
      return res.status(400).json({ error: { code: 'invalid_input', message: 'Required' } });
    }
    // Optional explicit fast path only if FAST_REGISTER flag set (not by default in tests to allow spying)
    if (process.env.FAST_REGISTER === 'true') {
      const id = `batch-${Date.now()}`;
      const herbData = { id, batchId: id, name, origin, farmer, harvestDate, verified: false };
      const saveResult = await addHerbBatch(herbData);
      if (!saveResult.success) return res.status(500).json({ error: { code: 'db_error', message: 'Failed to save herb batch (fast-path)' } });
      return res.status(201).json({ data: saveResult.data, fastPath: true });
    }
    let photoInfo = null;
    if (req.file) {
      photoInfo = req.file.path
        ? { path: req.file.path, filename: req.file.originalname }
        : { buffer: req.file.buffer, filename: req.file.originalname };
    }
    const blockchainService = require('../services/blockchainService');
    const result = await blockchainService.registerHerbBatch({ name, origin, farmer, harvestDate, photo: photoInfo });
    if (!result.success) {
      return res.status(400).json({ error: { code: result.error?.code || 'blockchain_error', message: result.error?.message || 'Failed to register on blockchain' } });
    }
    const dbResult = await addHerbBatch(result.data);
    if (!dbResult.success) return res.status(500).json({ error: { code: 'db_error', message: 'Failed to save herb batch' } });
    return res.status(201).json({ data: dbResult.data });
  } catch (error) {
    return res.status(500).json({ error: { code: 'blockchain_error', message: 'Failed to register on blockchain', details: error.message } });
  }
};

// --- Retrieval ---
exports.getHerbDetails = async (req, res) => {
  try {
    const herb = await getHerbById(req.params.id);
    if (!herb) return res.status(404).json({ error: { code: 'not_found', message: 'Herb not found' } });
    res.status(200).json({ data: herb });
  } catch (error) {
    res.status(500).json({ error: { code: 'internal_error', message: 'Error fetching herb', details: error.message } });
  }
};

exports.getHerbBatch = async (req, res) => {
  try {
    const id = req.params.batchId || req.params.id;
    let repoBatch = null;
    try { repoBatch = await getHerbById(id); } catch (_) {}
    if (repoBatch) {
      const batchData = repoBatch.data ? repoBatch.data : repoBatch;
      return res.status(200).json({ data: batchData });
    }
    const blockchainService = require('../services/blockchainService');
    const chainResult = await blockchainService.getHerbBatchData(id);
    if (!chainResult.success) return res.status(404).json({ error: { code: chainResult.error?.code || 'not_found', message: chainResult.error?.message || 'Batch not found' } });
    return res.status(200).json({ data: chainResult.data });
  } catch (error) {
    return res.status(500).json({ error: { code: 'internal_error', message: 'Error fetching batch', details: error.message } });
  }
};

// --- Verification ---
exports.verifyHerb = async (req, res) => {
  try {
    let file = req.file;
    if (!file && req.files && req.files.length > 0) file = req.files[0];
    if (!file) return res.status(400).json({ error: { code: 'missing_file', message: 'No herb image provided' } });
    const batchId = req.body.batchId;
    if (!batchId) return res.status(400).json({ error: { code: 'invalid_herb', message: 'Could not verify herb image' } });
    const imageInput = file.path ? file.path : (file.originalname || 'herb.jpg');
    const result = await require('../services/aiValidationService').validateHerbImage(imageInput, batchId);
    if (!result.success || !result.data?.verified) {
      return res.status(400).json({ error: { code: 'invalid_herb', message: 'Could not verify herb image' } });
    }
    return res.status(200).json({ data: result.data });
  } catch (error) {
    return res.status(500).json({ error: { code: 'verification_error', message: 'Error during herb verification' } });
  }
};

// --- Listing & Creation ---
exports.listHerbs = async (req, res) => {
  try {
    const herbs = await getAllHerbs();
    res.status(200).json({ data: { items: Array.isArray(herbs) ? herbs : [], page: 1, total: Array.isArray(herbs) ? herbs.length : 0 } });
  } catch (error) {
    res.status(500).json({ error: { code: 'internal_error', message: 'Error fetching herbs', details: error.message } });
  }
};

exports.createHerb = async (req, res) => {
  try {
    const { batchId, name, herbName, lat, lng, origin, farmer, farmerName, harvestDate } = req.body;
    const herbData = { batchId, name: herbName || name, herbName, geo: (lat && lng) ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined };
    // When using real Mongo model, ensure required fields exist
    if (!useMemory()) {
      herbData.id = batchId; // align id and batchId for simplicity
      herbData.origin = origin || 'DemoOrigin';
      herbData.farmer = farmer || farmerName || 'Demo Farmer';
      herbData.harvestDate = harvestDate || new Date().toISOString().slice(0,10);
      if (!herbData.quantity) herbData.quantity = 1;
      if (!herbData.unit) herbData.unit = 'kg';
    }
    Object.keys(herbData).forEach(k => herbData[k] === undefined && delete herbData[k]);
    // Persist using model abstraction (handles memory vs mongo)
    let herb;
    if (useMemory()) {
      herb = { ...herbData, _id: Date.now(), createdAt: new Date() };
    } else {
      const repo = require('../models/herbModel');
      const saveResult = await repo.addHerbBatch(herbData);
      if (!saveResult.success) {
        return res.status(500).json({ error: { code: 'db_error', message: 'Failed to save herb', details: saveResult.error?.message } });
      }
      herb = saveResult.data.toObject ? saveResult.data.toObject() : saveResult.data;
    }
    const frontBaseRaw = process.env.FRONTEND_BASE_URL || req.headers['x-forwarded-origin'] || req.headers.origin || 'http://localhost:5173';
    const frontBase = (frontBaseRaw || '').replace(/\/$/, '');
    const traceUrl = `${frontBase}/trace/${batchId}`;
    const qrDataURL = await qrcode.toDataURL(traceUrl);
    return res.status(201).json({ data: { ...herb, traceUrl, qr: qrDataURL, chain: await mockCreateBatch() } });
  } catch (error) {
    return res.status(400).json({ error: { message: error.message } });
  }
};

exports.uploadHerbWithMedia = async (req, res) => {
  try {
    const { batchId, name, lat, lng } = req.body;
    const fileResult = req.file ? await mockAddFileBuffer() : undefined;
    const herbData = { batchId, name, farmerName: name, geo: (lat && lng) ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined, photoIpfsCid: fileResult ? fileResult.cid : undefined };
    const herb = useMemory() ? { ...herbData, _id: Date.now(), createdAt: new Date() } : await Herb.create(herbData);
    const frontBaseRaw = process.env.FRONTEND_BASE_URL || req.headers['x-forwarded-origin'] || req.headers.origin || 'http://localhost:5173';
    const frontBase = (frontBaseRaw || '').replace(/\/$/, '');
    const traceUrl = `${frontBase}/trace/${batchId}`;
    const qrDataURL = await qrcode.toDataURL(traceUrl);
    return res.status(201).json({ data: { ...herb, traceUrl, qr: qrDataURL, chain: await mockCreateBatch() } });
  } catch (error) {
    return res.status(400).json({ error: { message: error.message } });
  }
};

// --- Events & Ownership ---
exports.addProcessingEvent = async (req, res) => {
  try {
    const { batchId } = req.params;
    // Accept either actor/data or legacy type/notes
    const actor = req.body.actor || req.body.type;
    const data = req.body.data || req.body.notes || req.body.description;
    if (!actor || !data) {
      return res.status(400).json({ error: { code: 'invalid_input', message: 'actor/data (or type/notes) required' } });
    }
    const rolePrefix = req.user?.role ? `${req.user.role}:` : '';
    if (useMemory()) {
      return res.json({ data: { batchId, processingEvents: [{ actor: rolePrefix + actor, data, timestamp: new Date(), chain: await mockCreateBatch() }] } });
    }
    const herb = await Herb.findOne({ batchId });
    if (!herb) return res.status(404).json({ error: { message: 'Herb not found' } });
    const event = { actor: rolePrefix + actor, data, timestamp: new Date(), chain: await mockCreateBatch() };
    herb.processingEvents.push(event);
    await herb.save();
    return res.json({ data: herb });
  } catch (error) {
    return res.status(400).json({ error: { message: error.message } });
  }
};

exports.transferOwnership = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { newOwner } = req.body;
    if (useMemory()) {
      return res.json({ data: { batchId, ownershipTransfers: [{ to: newOwner, timestamp: new Date(), chain: await mockCreateBatch() }] } });
    }
    const herb = await Herb.findOne({ batchId });
    if (!herb) return res.status(404).json({ error: { message: 'Herb not found' } });
    const transfer = { to: newOwner, timestamp: new Date(), chain: await mockCreateBatch() };
    herb.ownershipTransfers.push(transfer);
    await herb.save();
    return res.json({ data: herb });
  } catch (error) {
    return res.status(400).json({ error: { message: error.message } });
  }
};

exports.adminWipe = async (req, res) => {
  try {
    if (process.env.MOCK_MODE !== 'true') return res.status(403).json({ error: { message: 'Wipe not allowed in this environment' } });
    if (!useMemory()) await Herb.deleteMany({});
    return res.json({ data: { ok: true } });
  } catch (error) {
    return res.status(400).json({ error: { message: error.message } });
  }
};

// --- Trace & QR ---
exports.getTrace = async (req, res) => {
  try {
    const { batchId } = req.params;
    if (useMemory()) {
      return res.json({ data: { batchId, name: 'Mock Herb', farmerName: 'Mock Farmer', processingEvents: [], ownershipTransfers: [], createdAt: new Date(), geo: { type: 'Point', coordinates: [77.23, 28.61] }, chain: { mock: true } } });
    }
    const herb = await Herb.findOne({ batchId });
    if (!herb) return res.status(404).json({ error: { message: 'Herb not found' } });
    const trace = { batchId: herb.batchId, name: herb.name, farmerName: herb.farmerName || 'N/A', createdAt: herb.createdAt, geo: herb.geo, processingEvents: herb.processingEvents || [], ownershipTransfers: herb.ownershipTransfers || [], photoIpfsCid: herb.photoIpfsCid, chain: herb.chain || { mock: true } };
    return res.json({ data: trace });
  } catch (error) {
    return res.status(400).json({ error: { message: error.message } });
  }
};

exports.getQrCode = async (req, res) => {
  try {
    const { batchId } = req.params;
    const frontBaseRaw = process.env.FRONTEND_BASE_URL || req.headers['x-forwarded-origin'] || req.headers.origin || 'http://localhost:5173';
    const frontBase = (frontBaseRaw || '').replace(/\/$/, '');
    const traceUrl = `${frontBase}/trace/${batchId}`;
    const svg = await qrcode.toString(traceUrl, { type: 'svg' });
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(svg);
  } catch (error) {
    return res.status(400).json({ error: { message: error.message } });
  }
};

// --- Validation ---
exports.validateImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: { message: 'Photo required' } });
    return res.json({ data: mockValidateImage() });
  } catch (error) {
    return res.status(400).json({ error: { message: error.message } });
  }
};