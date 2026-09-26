const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { requireAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(requireAuth);

router.post('/analyze-profile', aiLimiter, aiController.handleAnalyzeProfile);
router.post('/generate-ideas', aiLimiter, aiController.handleGenerateIdeas);
router.post('/generate-calendar', aiLimiter, aiController.handleGenerateCalendar);
router.post('/regenerate-post', aiLimiter, aiController.handleRegeneratePost);
router.post('/apply-regenerated-post', aiController.handleApplyRegeneratedPost);

module.exports = router;
