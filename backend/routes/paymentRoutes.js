const express = require("express");
const paymentController = require("../controllers/paymentController");
const { requireAuth } = require("../middlewares/authMiddleware");

const router = express.Router();

// Webhook callback từ ngân hàng/momo (public endpoint)
router.post("/webhook/bank", paymentController.bankWebhook);

// Payment status theo order id cho FE polling (public, dùng cho trang xác nhận)
router.get("/order/:orderId", paymentController.paymentStatusByOrder);

// Endpoint demo để giả lập callback bank/momo trong môi trường local dev
router.post("/order/:orderId/confirm-demo", requireAuth, paymentController.confirmPaymentDemo);

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Tạo giao dịch thanh toán online cho đơn hàng
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", requireAuth, paymentController.createPayment);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Lấy trạng thái thanh toán theo payment id
 *     tags: [Payments]
 */
router.get("/:id", paymentController.paymentStatus);

module.exports = router;
