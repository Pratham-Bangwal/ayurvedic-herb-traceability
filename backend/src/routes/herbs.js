// backend/src/routes/herbs.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/herbsController');
const { validate, createHerbSchema, uploadHerbSchema, processingEventSchema, transferSchema } = require('../middleware/validation');
const { authOptional, authRequired, requireRole } = require('../middleware/auth');

// Multer config for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// === Listing (admin only)
router.get('/', authRequired, requireRole('admin'), controller.listHerbs);

// === Admin utilities (guarded)
router.post('/admin/wipe', authRequired, requireRole('admin'), controller.adminWipe);

// === Creation (canonical + legacy) ===
router.post('/', validate(createHerbSchema), controller.createHerb);

// Multipart creation with media
router.post(
  '/upload',
  upload.single('photo'),
  validate(uploadHerbSchema),
  controller.uploadHerbWithMedia
);

// AI validation
router.post('/validate/image', upload.single('photo'), controller.validateImage);

// Processing events (canonical + legacy /events)
// NOTE: leading slashes were missing previously causing 404s (e.g. /api/herbs/B1/process)
router.post(
  '/:batchId/process',
  validate(processingEventSchema),
  controller.addProcessingEvent
);
router.post(
  '/:batchId/events',
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
  validate(transferSchema),
  controller.transferOwnership
);

module.exports = router;
