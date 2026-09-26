const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// Profiles
router.get('/', profileController.getProfiles);
router.post('/', profileController.createProfile);
router.get('/:id', profileController.getProfileById);
router.patch('/:id', profileController.updateProfile);
router.delete('/:id', profileController.deleteProfile);

// Profile Posts
router.get('/:id/posts', profileController.getProfilePosts);
router.post('/:id/posts', profileController.createProfilePost);
router.post('/:id/posts/batch', profileController.batchImportPosts);
router.post('/:id/seed-sample-posts', profileController.seedSamplePosts);

module.exports = router;
