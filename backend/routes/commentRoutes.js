const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { requireAuth } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/comments/{productId}:
 *   get:
 *     summary: Lấy danh sách bình luận theo sản phẩm
 *     tags: [Comments]
 */
router.get('/:productId', commentController.getComments);

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Tạo bình luận mới
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireAuth, commentController.createComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Cập nhật bình luận
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requireAuth, commentController.updateComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Xóa bình luận
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireAuth, commentController.deleteComment);

module.exports = router;
