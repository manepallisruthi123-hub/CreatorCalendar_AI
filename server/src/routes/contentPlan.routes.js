const express = require('express');
const router = express.Router();
const contentPlanController = require('../controllers/contentPlan.controller');
const { requireAuth } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.use(requireAuth);

router.get('/', contentPlanController.getContentPlans);
router.post('/generate', aiLimiter, contentPlanController.triggerGeneratePlan);
router.get('/:id', contentPlanController.getContentPlanById);
router.delete('/:id', contentPlanController.deleteContentPlan);

module.exports = router;
