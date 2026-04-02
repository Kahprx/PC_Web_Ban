const express = require("express");
const {
  getAdminOverview,
  getAdminUsers,
  createAdminUser,
  patchAdminUserRole,
  patchAdminUserActive,
  getAdminOrders,
  getAdminOrderDetail,
  patchAdminOrderStatus,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  removeAdminProduct,
} = require("../controllers/adminController");
const { requireAuth, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/overview", getAdminOverview);

router.get("/users", getAdminUsers);
router.post("/users", createAdminUser);
router.patch("/users/:id/role", patchAdminUserRole);
router.patch("/users/:id/active", patchAdminUserActive);

router.get("/orders", getAdminOrders);
router.get("/orders/:id", getAdminOrderDetail);
router.patch("/orders/:id/status", patchAdminOrderStatus);

router.get("/products", getAdminProducts);
router.post("/products", createAdminProduct);
router.put("/products/:id", updateAdminProduct);
router.delete("/products/:id", removeAdminProduct);

module.exports = router;
