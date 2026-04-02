const express = require('express');
const { createOrder, getMyOrders, getAllOrdersForAdmin } = require('../controllers/orderController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order with transaction
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, createOrder);

/**
 * @swagger
 * /api/orders/my:
 *   get:
 *     summary: Get current user orders
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User orders
 */
router.get('/my', requireAuth, getMyOrders);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders for admin
 *     tags: [Orders]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin orders
 *       401:
 *         description: Unauthorized
 */
router.get('/', requireAuth, requireRole('admin'), getAllOrdersForAdmin);

module.exports = router;
