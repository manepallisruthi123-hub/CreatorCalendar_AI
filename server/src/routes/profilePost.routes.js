const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.patch('/:id', profileController.updateProfilePost);
router.delete('/:id', profileController.deleteProfilePost);

module.exports = router;
