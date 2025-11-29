// ...existing code...
// Analytics endpoint for E2E test (must be after router and controller are defined)
// Place this after all require statements and router initialization
/**
 * Enhanced Herbs Routes
 * API endpoints for herb management and verification
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { limiters } = require('../middleware/rateLimiter');
const { authRequired, requireRole } = require('../middleware/auth');
const { validate, 
  createHerbSchema,
  uploadHerbSchema,
  processingEventSchema,
  transferSchema
} = require('../middleware/validation');
const controller = require('../controllers/herbsController');
const herbModel = require('../models/herbModel');
const { success, error } = require('../utils/response');

// Configure multer for file uploads
// Store files on disk with unique names
let upload;
if (process.env.NODE_ENV === 'test') {
  // Use default multer in test environment to avoid issues with mocks
  upload = multer();
} else {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../../uploads');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'herb-' + uniqueSuffix + ext);
    }
  });
  upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
      // Accept images only
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  });
}

// === Creation (canonical + legacy) - NO AUTH REQUIRED ===
router.post('/', validate(createHerbSchema), controller.createHerb);
// Legacy create path with deprecation headers
router.post(
  '/create',
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
router.post('/register', upload.single('photo'), controller.registerHerb);
// POST /api/herbs/upload for media test compatibility
router.post('/upload', upload.single('photo'), controller.uploadHerbWithMedia);

// Verify herb image
router.post('/verify', upload.any(), controller.verifyHerb);

// GET all herbs - Basic rate limiting
router.get('/', limiters.api, controller.listHerbs);

// GET herb by ID
router.get('/:id', controller.getHerbDetails);

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

// Get batch information
router.get('/batch/:batchId', controller.getHerbBatch);

// Ownership transfer
router.post(
  '/:batchId/transfer',
  authRequired,
  validate(transferSchema),
  controller.transferOwnership
);

// Admin wipe (testing only)
router.post('/admin/wipe', authRequired, requireRole('admin'), controller.adminWipe);

// Add this at the end, after all other routes
router.get('/analytics/herb-distribution', controller.getHerbDistribution);

module.exports = router;
