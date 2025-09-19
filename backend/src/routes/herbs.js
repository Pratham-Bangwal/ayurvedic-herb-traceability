// backend/src/routes/herbs.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/herbsController');
const {
  validate,
  createHerbSchema,
  uploadHerbSchema,
  processingEventSchema,
  transferSchema,
} = require('../middleware/validation');
const { authRequired, requireRole } = require('../middleware/auth');

// Multer config for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// === Listing (public by default; can require admin via env) ===
const listMiddlewares = [];
if (process.env.REQUIRE_ADMIN_FOR_LIST === 'true') {
  listMiddlewares.push(authRequired, requireRole('admin'));
}
router.get('/', ...listMiddlewares, controller.listHerbs);

// === Admin utilities (guarded)
router.post('/admin/wipe', authRequired, requireRole('admin'), controller.adminWipe);

// === Creation (canonical + legacy) ===
router.post('/', authRequired, validate(createHerbSchema), controller.createHerb);
// Legacy create path with deprecation headers
router.post(
  '/create',
  authRequired,
  (req, res, next) => {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Warning', '299 - "Deprecated endpoint, use /api/herbs"');
    res.setHeader('Link', '</api/herbs>; rel="successor-version"');
    next();
  },
  validate(createHerbSchema),
  controller.createHerb
);

// Multipart creation with media
router.post(
  '/upload',
  authRequired,
  upload.single('photo'),
  validate(uploadHerbSchema),
  controller.uploadHerbWithMedia
);

// AI validation
router.post('/validate/image', upload.single('photo'), controller.validateImage); // legacy
router.post('/validate-image', upload.single('photo'), controller.validateImage); // preferred

// Processing events (canonical + legacy /events)
// NOTE: leading slashes were missing previously causing 404s (e.g. /api/herbs/B1/process)
router.post(
  '/:batchId/process',
  authRequired,
  validate(processingEventSchema),
  controller.addProcessingEvent
);
router.post(
  '/:batchId/events',
  authRequired,
  (req, res, next) => {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Warning', '299 - "Deprecated endpoint, use /api/herbs/:batchId/process"');
    res.setHeader('Link', '</api/herbs/:batchId/process>; rel="successor-version"');
    next();
  },
  validate(processingEventSchema),
  controller.addProcessingEvent
); // deprecated legacy path

// Trace aliases
router.get('/trace/:batchId', controller.getTrace); // alias form /api/herbs/trace/:batchId
router.get('/:batchId/trace', controller.getTrace); // primary form /api/herbs/:batchId/trace

// QR code
router.get('/:batchId/qrcode', controller.getQrCode);

// Ownership transfer
router.post(
  '/:batchId/transfer',
  authRequired,
  validate(transferSchema),
  controller.transferOwnership
);

module.exports = router;
