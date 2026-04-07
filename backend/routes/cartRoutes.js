const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { requireAuth } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, cartController.getCart);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.post('/add', requireAuth, cartController.addToCart);

/**
 * @swagger
 * /api/cart/:id:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requireAuth, cartController.updateCart);

/**
 * @swagger
 * /api/cart/:id:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireAuth, cartController.deleteCartItem);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/', requireAuth, cartController.clearCart);

module.exports = router;

