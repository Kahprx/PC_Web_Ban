const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { requireAuth } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', requireAuth, wishlistController.getWishlist);

/**
 * @swagger
 * /api/wishlist/add:
 *   post:
 *     summary: Add item to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.post('/add', requireAuth, wishlistController.addWishlist);

/**
 * @swagger
 * /api/wishlist/:id:
 *   delete:
 *     summary: Remove item from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireAuth, wishlistController.deleteWishlist);

/**
 * @swagger
 * /api/wishlist/product/:productId:
 *   delete:
 *     summary: Remove item from wishlist by product ID
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/product/:productId', requireAuth, wishlistController.deleteByProductId);

module.exports = router;

