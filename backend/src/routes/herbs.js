// backend/src/routes/herbs.js
const express = require('express');
const router = express.Router();
const herbsController = require('../controllers/herbsController');
const multer = require('multer');
const { validate, createHerbSchema, processingEventSchema, transferSchema, uploadHerbSchema } = require('../middleware/validation');
const { authOptional, authRequired } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// Memory storage for direct buffer access (IPFS uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// === Listing ===
router.get('/', herbsController.listHerbs);
// Dev helper to mint JWT quickly (only if JWT_SECRET & AUTH_DEV_MODE=1)
router.get('/dev/token', (req, res) => {
  if (process.env.AUTH_DEV_MODE !== '1' || !process.env.JWT_SECRET) {
    return res.status(404).json({ error: { code: 'not_found', message: 'Disabled' } });
  }
  const role = req.query.role || 'farmer';
  const token = jwt.sign({ sub: 'dev-user', role }, process.env.JWT_SECRET, { expiresIn: '2h' });
  res.json({ data: { token, role } });
});

// Simple deprecation wrapper
function deprecatedRoute(canonicalPath) {
  return function (req, res, next) {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', `<${canonicalPath}>; rel="successor-version"`);
    res.setHeader('Warning', '299 - "Deprecated endpoint; switch to canonical path"');
    next();
  };
}

// === Creation (canonical + legacy) ===
router.post('/', authRequired, validate(createHerbSchema), herbsController.createHerb); // canonical per OpenAPI
router.post('/create', deprecatedRoute('/api/herbs'), authRequired, validate(createHerbSchema), herbsController.createHerb); // deprecated legacy path

// Multipart creation with media
router.post('/upload', authRequired, validate(uploadHerbSchema), upload.single('photo'), herbsController.uploadHerbWithMedia);

// AI validation
router.post('/validate-image', upload.single('photo'), herbsController.validateImage);

// Processing events (canonical + legacy /events)
// NOTE: leading slashes were missing previously causing 404s (e.g. /api/herbs/B1/process)
router.post('/:batchId/process', authRequired, express.json(), validate(processingEventSchema), herbsController.addProcessingEvent);
router.post(
  '/:batchId/events',
  deprecatedRoute('/api/herbs/:batchId/process'),
  authRequired,
  express.json(),
  validate(processingEventSchema),
  herbsController.addProcessingEvent
); // deprecated legacy path

// Trace aliases
router.get('/trace/:batchId', herbsController.getTrace); // alias form /api/herbs/trace/:batchId
router.get('/:batchId/trace', herbsController.getTrace); // primary form /api/herbs/:batchId/trace

// QR code
router.get('/:batchId/qrcode', herbsController.getQrCode);

// Ownership transfer
router.post('/:batchId/transfer', authRequired, express.json(), validate(transferSchema), herbsController.transferOwnership);

module.exports = router;
