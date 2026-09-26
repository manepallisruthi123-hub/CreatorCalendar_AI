const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');
const { requireAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(requireAuth);

router.post('/:id/analyze', aiLimiter, analysisController.triggerAnalysis);
router.get('/:id/analysis', analysisController.getLatestAnalysis);
router.get('/:id/recommendations', analysisController.getProfileRecommendations);

module.exports = router;
