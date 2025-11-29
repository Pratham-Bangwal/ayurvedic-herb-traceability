const express = require('express');
const router = express.Router();
const controller = require('../controllers/herbsController');

// Analytics endpoint for E2E test
router.get('/herb-distribution', controller.getHerbDistribution);

module.exports = router;
