const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} = require("../controllers/productController");
const { requireAuth, requireRole } = require("../middlewares/authMiddleware");

// GET /api/products - Lấy danh sách sản phẩm với filters, pagination, sort
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get products with search/filter/sort/pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: categoryGroup
 *         schema:
 *           type: string
 *         description: category group alias (e.g. gaming-gear)
 *       - in: query
 *         name: focusFilter
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product list
 */
router.get("/", getProducts);

// GET /api/products/:id - Lấy chi tiết sản phẩm
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product detail
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product detail
 *       404:
 *         description: Product not found
 */
router.get("/:id", getProductById);

// POST /api/products - Tạo sản phẩm mới (Admin only)
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create product (admin)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 *       401:
 *         description: Unauthorized
 */
router.post("/", requireAuth, requireRole("admin"), createProductHandler);

// PUT /api/products/:id - Cập nhật sản phẩm (Admin only)
/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product (admin)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Product not found
 */
router.put("/:id", requireAuth, requireRole("admin"), updateProductHandler);

// DELETE /api/products/:id - Xóa sản phẩm (Admin only)
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product (admin)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Product not found
 */
router.delete("/:id", requireAuth, requireRole("admin"), deleteProductHandler);

module.exports = router;
