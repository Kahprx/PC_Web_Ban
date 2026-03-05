const express = require('express');
const {
  getProducts,
  getProductById,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Product list with search/pagination/sort
 *     tags: [Products]
 */
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', requireAuth, requireRole('admin'), createProductHandler);
router.put('/:id', requireAuth, requireRole('admin'), updateProductHandler);
router.delete('/:id', requireAuth, requireRole('admin'), deleteProductHandler);

module.exports = router;
