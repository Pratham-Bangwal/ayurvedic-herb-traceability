const express = require('express');
const router = express.Router();
const controller = require('../controllers/herbsController');

router.get('/', controller.listHerbs);
router.post('/', controller.createHerb); // JSON create
router.post('/upload', controller.uploadHerbWithMedia); // multipart create with photo + geo
router.post('/:batchId/process', controller.addProcessingEvent);
router.get('/:batchId/trace', controller.getTrace);
router.get('/:batchId/trace/view', controller.getTraceHtml); // HTML

router.get('/:batchId/qrcode', controller.getQrCode);
router.post('/:batchId/transfer', controller.transferOwnership);
router.post('/validate/image', controller.validateImage); // expects batchId + photo multipart

module.exports = router;
