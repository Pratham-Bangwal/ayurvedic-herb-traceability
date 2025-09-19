// backend/src/controllers/herbsController.js
const Herb = require('../models/herbModel');
const qrcode = require('qrcode');

// Mock services (replace with real implementations)
const mockCreateBatch = async () => ({ txHash: '0x' + Date.now().toString(16), mock: true });
const mockAddFileBuffer = async () => ({ cid: 'Qm' + Date.now().toString(36), mock: true });
const mockValidateImage = () => ({ confidence: 0.85, label: 'herb', mock: true });

function useMemory() {
  return !global.mongoConnected;
}

// List all herbs
exports.listHerbs = async (req, res) => {
  try {
    const herbs = useMemory() ? [] : await Herb.find().limit(50);
    res.json({ data: herbs });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

// Create herb (JSON-based)
exports.createHerb = async (req, res) => {
  try {
    const { 
      batchId, 
      name, 
      herbName, 
      farmerName, 
      plantingDate, 
      harvestDate, 
      quantity, 
      unit, 
      farmLocation, 
      lat, 
      lng, 
      organicCertified, 
      notes 
    } = req.body;
    
    const herbData = {
      batchId,
      name: herbName || name, // Use herbName if provided, fallback to name for compatibility
      herbName,
      farmerName,
      plantingDate: plantingDate ? new Date(plantingDate) : undefined,
      harvestDate: harvestDate ? new Date(harvestDate) : undefined,
      quantity: quantity ? parseFloat(quantity) : undefined,
      unit,
      farmLocation,
      organicCertified: Boolean(organicCertified),
      notes,
      geo: lat && lng ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined
    };

    // Remove undefined fields
    Object.keys(herbData).forEach(key => herbData[key] === undefined && delete herbData[key]);

    const herb = useMemory() 
      ? { ...herbData, _id: Date.now(), createdAt: new Date() }
      : await Herb.create(herbData);

  // Generate QR code using configured frontend base (fallback to request origin or localhost)
  const frontBaseRaw = process.env.FRONTEND_BASE_URL || req.headers['x-forwarded-origin'] || req.headers.origin || 'http://localhost:5173';
  const frontBase = (frontBaseRaw || '').replace(/\/$/, '');
  const traceUrl = `${frontBase}/trace/${batchId}`;
    const qrDataURL = await qrcode.toDataURL(traceUrl);

    res.status(201).json({ 
      data: { 
        ...herb, 
        traceUrl, 
        qr: qrDataURL,
        chain: await mockCreateBatch()
      } 
    });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Upload herb with media
exports.uploadHerbWithMedia = async (req, res) => {
  try {
    const { batchId, name, lat, lng } = req.body;
    // Simulate storing file on IPFS (mock) and ensure we save only the CID string
    const fileResult = req.file ? await mockAddFileBuffer() : undefined;

    const herbData = {
      batchId,
      name,
      farmerName: name, // use name as farmer name if not provided
      geo: lat && lng ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined,
      photoIpfsCid: fileResult ? fileResult.cid : undefined
    };

    const herb = useMemory() 
      ? { ...herbData, _id: Date.now(), createdAt: new Date() }
      : await Herb.create(herbData);

  // Generate QR code using configured frontend base (fallback to request origin or localhost)
  const frontBaseRaw = process.env.FRONTEND_BASE_URL || req.headers['x-forwarded-origin'] || req.headers.origin || 'http://localhost:5173';
  const frontBase = (frontBaseRaw || '').replace(/\/$/, '');
  const traceUrl = `${frontBase}/trace/${batchId}`;
    const qrDataURL = await qrcode.toDataURL(traceUrl);

    res.status(201).json({ 
      data: { 
        ...herb, 
        traceUrl, 
        qr: qrDataURL,
        chain: await mockCreateBatch()
      } 
    });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Add processing event
exports.addProcessingEvent = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { actor, data } = req.body;

    if (useMemory()) {
      // Mock response for memory mode
      return res.json({ 
        data: { 
          batchId, 
          processingEvents: [{ actor, data, timestamp: new Date(), chain: await mockCreateBatch() }] 
        } 
      });
    }

    const herb = await Herb.findOne({ batchId });
    if (!herb) return res.status(404).json({ error: { message: 'Herb not found' } });

    const event = {
      actor,
      data,
      timestamp: new Date(),
      chain: await mockCreateBatch()
    };

    herb.processingEvents.push(event);
    await herb.save();

    res.json({ data: herb });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Transfer ownership
exports.transferOwnership = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { newOwner } = req.body;

    if (useMemory()) {
      // Mock response for memory mode
      return res.json({ 
        data: { 
          batchId, 
          ownershipTransfers: [{ to: newOwner, timestamp: new Date(), chain: await mockCreateBatch() }] 
        } 
      });
    }

    const herb = await Herb.findOne({ batchId });
    if (!herb) return res.status(404).json({ error: { message: 'Herb not found' } });

    const transfer = {
      to: newOwner,
      timestamp: new Date(),
      chain: await mockCreateBatch()
    };

    herb.ownershipTransfers.push(transfer);
    await herb.save();

    res.json({ data: herb });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Admin: wipe all data (MOCK_MODE only)
exports.adminWipe = async (req, res) => {
  try {
    if (process.env.MOCK_MODE !== 'true') {
      return res.status(403).json({ error: { message: 'Wipe not allowed in this environment' } });
    }
    if (!useMemory()) {
      await Herb.deleteMany({});
    }
    return res.json({ data: { ok: true } });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Get trace - FIXED VERSION
exports.getTrace = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (useMemory()) {
      const mockTrace = {
        batchId,
        name: 'Mock Herb',
        farmerName: 'Mock Farmer',
        processingEvents: [],
        ownershipTransfers: [],
        createdAt: new Date(),
        geo: { type: 'Point', coordinates: [77.23, 28.61] },
        chain: { mock: true }
      };
      return res.json({ data: mockTrace });
    }

    const herb = await Herb.findOne({ batchId });
    if (!herb) return res.status(404).json({ error: { message: 'Herb not found' } });

    // Ensure all arrays exist
    const trace = {
      batchId: herb.batchId,
      name: herb.name,
      farmerName: herb.farmerName || 'N/A',
      createdAt: herb.createdAt,
      geo: herb.geo,
      processingEvents: herb.processingEvents || [],
      ownershipTransfers: herb.ownershipTransfers || [],
      photoIpfsCid: herb.photoIpfsCid,
      chain: herb.chain || { mock: true }
    };

    res.json({ data: trace });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Get QR code
exports.getQrCode = async (req, res) => {
  try {
    const { batchId } = req.params;
    const frontBaseRaw = process.env.FRONTEND_BASE_URL || req.headers['x-forwarded-origin'] || req.headers.origin || 'http://localhost:5173';
    const frontBase = (frontBaseRaw || '').replace(/\/$/, '');
    const traceUrl = `${frontBase}/trace/${batchId}`;
    const svg = await qrcode.toString(traceUrl, { type: 'svg' });
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};

// Validate image
exports.validateImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: { message: 'Photo required' } });
    
    const result = mockValidateImage();
    res.json({ data: result });
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
};
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
