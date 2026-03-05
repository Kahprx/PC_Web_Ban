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
 */
router.post('/', requireAuth, createOrder);
router.get('/my', requireAuth, getMyOrders);
router.get('/', requireAuth, requireRole('admin'), getAllOrdersForAdmin);

module.exports = router;
