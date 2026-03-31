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
router.get("/", getProducts);

// GET /api/products/:id - Lấy chi tiết sản phẩm
router.get("/:id", getProductById);

// POST /api/products - Tạo sản phẩm mới (Admin only)
router.post("/", requireAuth, requireRole("admin"), createProductHandler);

// PUT /api/products/:id - Cập nhật sản phẩm (Admin only)
router.put("/:id", requireAuth, requireRole("admin"), updateProductHandler);

// DELETE /api/products/:id - Xóa sản phẩm (Admin only)
router.delete("/:id", requireAuth, requireRole("admin"), deleteProductHandler);

module.exports = router;
