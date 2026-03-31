const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Tạo giao dịch thanh toán
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireAuth, paymentController.createPayment);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Lấy trạng thái thanh toán
 *     tags: [Payments]
 */
router.get('/:id', paymentController.paymentStatus);

module.exports = router;
