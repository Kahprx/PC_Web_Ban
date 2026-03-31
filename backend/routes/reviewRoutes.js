const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { requireAuth } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/reviews/:productId:
 *   get:
 *     summary: Get reviews for a product
 *     tags: [Reviews]
 */
router.get('/:productId', reviewController.getReviews);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', requireAuth, reviewController.createReview);

/**
 * @swagger
 * /api/reviews/:id:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', requireAuth, reviewController.updateReview);

/**
 * @swagger
 * /api/reviews/:id:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireAuth, reviewController.deleteReview);

/**
 * @swagger
 * /api/reviews/:productId/rating:
 *   get:
 *     summary: Get average rating for a product
 *     tags: [Reviews]
 */
router.get('/:productId/rating', reviewController.getProductRating);

module.exports = router;

