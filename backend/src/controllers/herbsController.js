const Herb = require('../models/herbModel');
const { recordHerbOnChain, transferOwnership } = require('../services/blockchainService');
const { addFile, addJSON } = require('../services/ipfsService');
const { validateHerbImage } = require('../services/aiValidationService');

exports.listHerbs = async (req, res) => {
  const items = await Herb.find().lean();
  res.json(items);
};

exports.createHerb = async (req, res) => {
  try {
    const doc = await Herb.create(req.body);
    // store metadata stub
    try {
      const meta = { name: doc.name, batchId: doc.batchId, createdAt: new Date().toISOString() };
      const { cid } = await addJSON(meta);
      doc.metadataIpfsCid = cid; await doc.save();
    } catch {}
    let chain;
    try {
      chain = await recordHerbOnChain(doc);
    } catch (e2) {
      chain = { error: 'blockchain_record_failed', message: e2.message };
    }
    res.status(201).json({ ...doc.toObject(), chain });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

// Multipart upload with photo + geo tagging
exports.uploadHerbWithMedia = async (req, res) => {
  const uploader = req._uploader.single('photo');
  uploader(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const { name, batchId, lat, lng, harvestedAt } = req.body;
      const geoLocation = (lat && lng) ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined;
      const doc = await Herb.create({ name, batchId, harvestedAt, geoLocation });
      let aiValidation;
      if (req.file) {
        try { const { cid } = await addFile(req.file.path); doc.photoIpfsCid = cid; await doc.save(); } catch {}
        try { aiValidation = validateHerbImage(doc.name, req.file.path); doc.aiValidation = aiValidation; await doc.save(); } catch {}
      }
      let chain;
      try { chain = await recordHerbOnChain(doc); } catch (e2) { chain = { error: 'blockchain_record_failed', message: e2.message }; }
      res.status(201).json({ ...doc.toObject(), chain, aiValidation });
    } catch (e2) {
      res.status(400).json({ error: e2.message });
    }
  });
};

exports.validateImage = async (req, res) => {
  const uploader = req._uploader.single('photo');
  uploader(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    try {
      const { batchId } = req.body;
      const doc = await Herb.findOne({ batchId });
      if (!doc) return res.status(404).json({ error: 'not_found' });
      if (!req.file) return res.status(400).json({ error: 'photo required' });
      const result = validateHerbImage(doc.name, req.file.path);
      doc.aiValidation = result; await doc.save();
      res.json(result);
    } catch (e) { res.status(400).json({ error: e.message }); }
  });
};

exports.addProcessingEvent = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { stage, notes, actor } = req.body;
    const doc = await Herb.findOne({ batchId });
    if (!doc) return res.status(404).json({ error: 'not_found' });
    doc.processingEvents.push({ stage, notes, actor });
    await doc.save();
    res.json(doc);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};



exports.getTrace = async (req, res) => {
  try {
    const { batchId } = req.params;
    const doc = await Herb.findOne({ batchId }).lean();
    if (!doc) return res.status(404).json({ error: 'not_found' });
    // Condensed public trace object
    const trace = {
      batchId: doc.batchId,
      name: doc.name,
      harvestedAt: doc.harvestedAt,
      geoLocation: doc.geoLocation,
      processingEvents: doc.processingEvents,
      photoIpfsCid: doc.photoIpfsCid,
      chain: doc.chain
    };
    
  

    res.json(trace);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.getQrCode = async (req, res) => {
  try {
    const { batchId } = req.params;
    const HerbModel = await Herb.findOne({ batchId }).lean();
    if (!HerbModel) return res.status(404).json({ error: 'not_found' });
    const QRCode = require('qrcode');
    const payloadUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:4000'}/api/herbs/${batchId}/trace/view`;
    if (!global.__qrCache) global.__qrCache = new Map();
    let svg = global.__qrCache.get(payloadUrl);
    if (!svg) {
      svg = await QRCode.toString(payloadUrl, { type: 'svg', margin: 1 });
      global.__qrCache.set(payloadUrl, svg);
    }
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.transferOwnership = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { newOwner } = req.body;
    if (!newOwner) return res.status(400).json({ error: 'newOwner required' });
    const doc = await Herb.findOne({ batchId });
    if (!doc) return res.status(404).json({ error: 'not_found' });
    const chain = await transferOwnership(batchId, newOwner);
    doc.chain = { ...doc.chain, ...chain };
    await doc.save();
    res.json({ ...doc.toObject(), chain });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};


exports.getTraceHtml = async (req, res) => {
  try {
    const { batchId } = req.params;
    const doc = await Herb.findOne({ batchId }).lean();
    if (!doc) return res.status(404).send('<h1>Not Found</h1>');

    const trace = {
      batchId: doc.batchId,
      name: doc.name,
      harvestedAt: doc.harvestedAt,
      geoLocation: doc.geoLocation,
      processingEvents: doc.processingEvents,
      photoIpfsCid: doc.photoIpfsCid,
      chain: doc.chain
    };

    let mapImg = '';
if (trace.geoLocation && trace.geoLocation.lat && trace.geoLocation.lng) {
  const { lat, lng } = trace.geoLocation;

  // Yandex Static Maps v1 format
  const params = new URLSearchParams({
    ll: `${lng},${lat}`,         // longitude,latitude
    z: '15',                     // zoom
    size: '450,300',             // width,height
    l: 'map',                    // map type: map, sat, skl
    pt: `${lng},${lat},pm2rdm`   // marker at the location
  });

  const cacheBuster = Date.now();
mapImg = `<img src="https://static-maps.yandex.ru/v1/?${params.toString()}&cb=${cacheBuster}" alt="Map"/>`;
}

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Herb Batch Trace</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f9f9f9; }
            h1 { color: #2c3e50; text-align: center; }
            .card { background: #fff; padding: 15px; margin: 15px auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 500px; }
            .card img { max-width: 100%; border-radius: 6px; margin-top: 10px; }
            pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
            .label { font-weight: bold; color: #333; }
          </style>
        </head>
        <body>
          <h1>Herb Batch Trace</h1>

          <div class="card"><span class="label">Batch ID:</span> ${trace.batchId}</div>
          <div class="card"><span class="label">Name:</span> ${trace.name}</div>
          <div class="card"><span class="label">Harvested At:</span> ${trace.harvestedAt}</div>

          <div class="card">
            <span class="label">Geo Location:</span><br>
            ${mapImg || 'Location not available'}
          </div>

          <div class="card">
            <span class="label">Processing Events:</span>
            <pre>${JSON.stringify(trace.processingEvents, null, 2)}</pre>
          </div>

          <div class="card"><span class="label">Blockchain Network:</span> ${trace.chain}</div>

          ${trace.photoIpfsCid
            ? `<div class="card"><span class="label">Photo:</span><br><img src="https://ipfs.io/ipfs/${trace.photoIpfsCid}" alt="Herb Photo"/></div>`
            : ""}
        </body>
      </html>
    `;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
res.setHeader('Pragma', 'no-cache');
res.setHeader('Expires', '0');
res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('Content-Type', 'text/html');
    res.send(html);


  } catch (e) {
    res.status(400).send(`<h1>Error</h1><p>${e.message}</p>`);
  }
};