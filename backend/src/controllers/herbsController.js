// backend/src/controllers/herbsController.js
const Herb = require('../models/herbModel');
const memoryRepo = require('../models/herbMemoryRepo');
const mongoose = require('mongoose');
// Selects mock or real blockchain based on MOCK_MODE
const { createBatch, transferOwnership: transferOnChain } = require('../services/blockchain');
const { addFileBuffer, addJSON } = require('../services/ipfsService');
const { validateHerbImage } = require('../services/aiValidationService');
const qrcode = require('qrcode');
const { success, error } = require('../utils/response'); // ✅ unified response helpers
const { buildTraceLinks } = require('../utils/trace');
const logger = require('../utils/logger');

// buildTraceLinks moved to utils/trace.js

function useMemory() {
  // readyState 1 = connected
  return mongoose.connection?.readyState !== 1;
}

function repoCreate(data) {
  return useMemory() ? memoryRepo.create(data) : Herb.create(data);
}

async function repoFindAll() {
  if (useMemory()) return memoryRepo.find();
  return Herb.find().lean();
}

async function repoFindOne(batchId) {
  if (useMemory()) return memoryRepo.findOne({ batchId });
  return Herb.findOne({ batchId }).lean
    ? Herb.findOne({ batchId }).lean()
    : Herb.findOne({ batchId });
}

async function repoFindOneMutable(batchId) {
  if (useMemory()) return memoryRepo.findOne({ batchId });
  return Herb.findOne({ batchId });
}

async function repoSave(doc) {
  if (useMemory()) {
    if (doc && doc.batchId) memoryRepo.__store.set(doc.batchId, doc);
  } else if (doc && typeof doc.save === 'function') {
    await doc.save();
  }
  return doc;
}

// List herbs with basic pagination ?page=1&limit=20
exports.listHerbs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const all = await repoFindAll();
    const total = all.length;
    const pages = Math.max(Math.ceil(total / limit), 1);
    const start = (page - 1) * limit;
    const sliced = all.slice(start, start + limit).map((d) => (d.toObject ? d.toObject() : d));
    success(res, {
      items: sliced,
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1,
    });
  } catch (e) {
    error(res, 'server_error', e.message, 500);
  }
};

// Create herb batch (JSON only)
exports.createHerb = async (req, res) => {
  try {
    const doc = await repoCreate(req.body);

    // Upload metadata JSON to IPFS
    try {
      const meta = {
        name: doc.name,
        batchId: doc.batchId,
        createdAt: new Date().toISOString(),
      };
      const { cid } = await addJSON(meta);
      doc.metadataURI = cid;
      await repoSave(doc);
    } catch (e) {
      logger.error({ err: e.message }, 'IPFS metadata upload failed');
    }

    // Record on blockchain
    let chain;
    try {
      chain = await createBatch(doc.batchId, process.env.OWNER_ADDRESS, doc.metadataURI || '');
      doc.chain = chain;
      await repoSave(doc);
    } catch (e2) {
      logger.error({ err: e2.message }, 'Blockchain createBatch failed');
      chain = { error: 'blockchain_record_failed', message: e2.message };
    }

    const { traceUrl, qrDataURL } = await buildTraceLinks(doc.batchId);
    success(res, { ...doc.toObject(), chain, traceUrl, qr: qrDataURL }, 201);
  } catch (e) {
    logger.error({ err: e.message }, 'createHerb failed');
    error(res, 'bad_request', e.message, 400);
  }
};

// Multipart upload with photo + geo tagging
exports.uploadHerbWithMedia = async (req, res) => {
  try {
    const { name, batchId, lat, lng, harvestedAt } = req.body;
    const geo =
      lat && lng ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined;

    const doc = await repoCreate({ name, batchId, harvestedAt, geo });

    let aiValidation;
    if (req.file && req.file.buffer) {
      try {
        const { cid } = await addFileBuffer(req.file.buffer);
  logger.info({ cid }, 'Uploaded to IPFS');
        doc.ipfsHash = cid;
        doc.photoIpfsCid = cid;
        await repoSave(doc);
      } catch (e) {
        logger.error({ err: e.message }, 'IPFS upload failed');
      }

      try {
        aiValidation = {
          ...validateHerbImage(doc.name, req.file.buffer),
          validatedAt: new Date().toISOString(),
        };
        doc.aiValidation = aiValidation;
        await repoSave(doc);
      } catch (e) {
        logger.error({ err: e.message }, 'AI validation failed');
      }
    }

    let chain;
    try {
      chain = await createBatch(doc.batchId, process.env.OWNER_ADDRESS, doc.ipfsHash || '');
      doc.chain = chain;
      await repoSave(doc);
    } catch (e2) {
      chain = { error: 'blockchain_record_failed', message: e2.message };
    }

    const { traceUrl, qrDataURL } = await buildTraceLinks(doc.batchId);

    success(res, { ...doc.toObject(), chain, aiValidation, traceUrl, qr: qrDataURL }, 201);
  } catch (e2) {
  logger.error({ err: e2.message }, 'uploadHerbWithMedia failed');
    error(res, 'bad_request', e2.message, 400);
  }
};

// Validate herb image
exports.validateImage = async (req, res) => {
  try {
    const { batchId } = req.body;
    const doc = await repoFindOneMutable(batchId);
    if (!doc) return error(res, 'not_found', 'Herb not found', 404);
    if (!req.file || !req.file.buffer) return error(res, 'photo_required', 'Photo required', 400);

    const result = {
      ...validateHerbImage(doc.name, req.file.buffer),
      validatedAt: new Date().toISOString(),
    };
    doc.aiValidation = result;
    await repoSave(doc);

    success(res, result);
  } catch (e) {
    error(res, 'bad_request', e.message, 400);
  }
};

// Add processing event
exports.addProcessingEvent = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { actor, data } = req.body;
    const doc = await repoFindOneMutable(batchId);
    let target = doc;
    if (!target) {
      // Upsert only in memory mode
      if (useMemory()) {
        target = await repoCreate({ batchId, name: batchId });
      } else {
        return error(res, 'not_found', 'Herb not found', 404);
      }
    }

  const effectiveActor = req.user?.role ? `${req.user.role}:${actor}` : actor;
  const event = { actor: effectiveActor, data, timestamp: new Date() };
    if (!Array.isArray(target.processingEvents)) target.processingEvents = [];
    target.processingEvents.push(event);
    await repoSave(target);
    success(res, target.toObject ? target.toObject() : target);
  } catch (e) {
    error(res, 'bad_request', e.message, 400);
  }
};

// Public trace (JSON)
exports.getTrace = async (req, res) => {
  try {
    const { batchId } = req.params;
    const doc = await repoFindOne(batchId);
    if (!doc) return error(res, 'not_found', 'Herb not found', 404);

    const { traceUrl, qrDataURL } = await buildTraceLinks(batchId);

    const trace = {
      batchId: doc.batchId,
      farmerName: doc.farmerName || 'N/A',
      createdAt: doc.createdAt,
      geo: doc.geo,
      processingEvents: doc.processingEvents || [],
      ownershipTransfers: doc.ownershipTransfers || [],
      photoIpfsCid: doc.photoIpfsCid || doc.ipfsHash,
      chain: doc.chain || { mock: true },
      traceUrl,
      qr: qrDataURL,
    };

    success(res, trace);
  } catch (e) {
    error(res, 'bad_request', e.message, 400);
  }
};

// Generate QR code (always frontend link)
exports.getQrCode = async (req, res) => {
  try {
    const { batchId } = req.params;
    const doc = await repoFindOne(batchId);
    if (!doc) return error(res, 'not_found', 'Herb not found', 404);

    const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const payloadUrl = `${frontendBase}/trace/${batchId}`;

    if (!global.__qrCache) global.__qrCache = new Map();
    let svg = global.__qrCache.get(payloadUrl);
    if (!svg) {
      svg = await qrcode.toString(payloadUrl, { type: 'svg', margin: 1 });
      global.__qrCache.set(payloadUrl, svg);
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (e) {
    logger.error({ err: e.message }, 'getQrCode failed');
    error(res, 'bad_request', e.message, 400);
  }
};

// Transfer ownership
exports.transferOwnership = async (req, res) => {
  try {
    const { batchId } = req.params;
  const { newOwner } = req.body;
    if (!newOwner) return error(res, 'new_owner_required', 'newOwner required', 400);

    const doc = await repoFindOneMutable(batchId);
    let target = doc;
    if (!target) {
      if (useMemory()) {
        target = await repoCreate({ batchId, name: batchId });
      } else {
        return error(res, 'not_found', 'Herb not found', 404);
      }
    }

    let chain;
    try {
      chain = await transferOnChain(batchId, newOwner);
      target.chain = { ...target.chain, ...chain };
    } catch (bcErr) {
      // Graceful degrade when real blockchain not configured
      chain = { error: 'blockchain_transfer_failed', message: bcErr.message };
      if (!target.chain) target.chain = {};
      target.chain.lastTransferError = chain;
    }

    if (!target.ownershipTransfers) target.ownershipTransfers = [];
  const performedBy = req.user?.role || 'unknown';
  target.ownershipTransfers.push({ to: newOwner, by: performedBy, timestamp: new Date() });

    await repoSave(target);
    const out = target.toObject ? target.toObject() : target;
    success(res, { ...out, chain });
  } catch (e) {
    error(res, 'bad_request', e.message, 400);
  }
};

/**
 * Deprecated: Backend HTML trace view
 * -----------------------------------
 * Frontend React at /trace/:batchId is now the official trace UI.
 * Keeping this here commented out for fallback/debug use.
 */

// exports.getTraceHtml = async (req, res) => {
//   try {
//     const { batchId } = req.params;
//     const doc = await Herb.findOne({ batchId }).lean();
//     if (!doc) return res.status(404).send('<h1>Not Found</h1>');

//     const trace = {
//       batchId: doc.batchId,
//       farmerName: doc.farmerName || "N/A",
//       createdAt: doc.createdAt,
//       geo: doc.geo,
//       processingEvents: doc.processingEvents || [],
//       photoIpfsCid: doc.photoIpfsCid || doc.ipfsHash,
//       chain: doc.chain || { mock: true }
//     };

//     let mapImg = '';
//     if (trace.geo && trace.geo.coordinates && trace.geo.coordinates.length === 2) {
//       const [lng, lat] = trace.geo.coordinates;
//       const params = new URLSearchParams({
//         ll: `${lng},${lat}`,
//         z: '15',
//         size: '450,300',
//         l: 'map',
//         pt: `${lng},${lat},pm2rdm`
//       });
//       mapImg = `<img src="https://static-maps.yandex.ru/1.x/?${params.toString()}" alt="Map"/>`;
//     }

//     const html = `
//       <!DOCTYPE html>
//       <html>
//         <head><meta charset="utf-8"><title>Herb Batch Trace</title></head>
//         <body>
//           <h1>Herb Batch Trace</h1>
//           <p>Batch ID: ${trace.batchId}</p>
//           <p>Farmer: ${trace.farmerName}</p>
//           <p>Created At: ${trace.createdAt}</p>
//           ${mapImg || 'Location not available'}
//           <pre>${JSON.stringify(trace.processingEvents, null, 2)}</pre>
//           <p>Blockchain: ${JSON.stringify(trace.chain)}</p>
//           ${trace.photoIpfsCid ? `<img src="https://ipfs.io/ipfs/${trace.photoIpfsCid}" />` : ""}
//         </body>
//       </html>
//     `;
//     res.setHeader('Content-Type', 'text/html');
//     res.send(html);
//   } catch (e) {
//     res.status(400).send(`<h1>Error</h1><p>${e.message}</p>`);
//   }
// };
