const express = require('express');
const router = express.Router();
const ideaController = require('../controllers/idea.controller');
const { requireAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(requireAuth);

router.get('/:id/ideas', ideaController.getIdeas);
router.post('/:id/ideas', aiLimiter, ideaController.triggerGenerateIdeas);
router.delete('/:id', ideaController.deleteIdea);

module.exports = router;
