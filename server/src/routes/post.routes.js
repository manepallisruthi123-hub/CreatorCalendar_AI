const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', postController.getPosts);
router.post('/', postController.createPost);
router.get('/:id', postController.getPostById);
router.patch('/:id', postController.updatePost);
router.delete('/:id', postController.deletePost);
router.patch('/:id/status', postController.updatePostStatus);

module.exports = router;
