const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', campaignController.getCampaigns);
router.post('/', campaignController.createCampaign);
router.get('/:id', campaignController.getCampaignById);
router.patch('/:id', campaignController.updateCampaign);
router.delete('/:id', campaignController.deleteCampaign);

module.exports = router;
