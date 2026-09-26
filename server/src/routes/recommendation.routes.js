const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.patch('/:id', analysisController.updateRecommendationStatus);

module.exports = router;
