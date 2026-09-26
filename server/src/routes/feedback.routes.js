const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getFeedback, triggerFeedback } = require('../controllers/feedback.controller');

router.use(requireAuth);

// GET /api/feedback or GET /api/feedback/:profileId
router.get('/', getFeedback);
router.get('/:profileId', getFeedback);

// POST /api/feedback or POST /api/feedback/:profileId
router.post('/', triggerFeedback);
router.post('/:profileId', triggerFeedback);

module.exports = router;
