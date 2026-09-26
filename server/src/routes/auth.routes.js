const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getCurrentUser);
router.get('/google', authController.googleAuthInit);
router.get('/google/callback', authController.googleAuthCallback);

module.exports = router;
