const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');

/**
 * @swagger
 * /api/promotions:
 *   get:
 *     summary: Lấy danh sách mã khuyến mãi
 *     tags: [Promotions]
 */
router.get('/', promotionController.getPromotions);

module.exports = router;
