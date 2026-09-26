const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const {
  getAccounts,
  connectPlatform,
  disconnectPlatform,
  getPlatformContent
} = require('../controllers/social.controller');

router.use(requireAuth);

// List all 5 platforms status for current user
router.get('/accounts', getAccounts);
router.get('/status', getAccounts);

// Connect / initiate OAuth / sandbox connect
router.post('/connect/:platform', connectPlatform);

// Disconnect
router.post('/disconnect/:platform', disconnectPlatform);

// Fetch recent content from connected platform
router.get('/content', getPlatformContent);
router.get('/content/:platform', getPlatformContent);

module.exports = router;
