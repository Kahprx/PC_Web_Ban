const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const paymentModel = require('../models/paymentModel');

/**
 * POST /api/payments
 * Tạo giao dịch thanh toán
 */
const createPayment = asyncHandler(async (req, res) => {
  const { orderId, method } = req.body || {};

  if (!orderId || !method) {
    throw httpError(400, 'orderId và method là bắt buộc');
  }

  const payment = await paymentModel.createPayment({
    orderId: Number(orderId),
    method: String(method),
  });

  res.status(201).json({
    message: 'Tạo giao dịch thành công',
    data: payment,
  });
});

/**
 * GET /api/payments/:id
 * Xem trạng thái giao dịch
 */
const paymentStatus = asyncHandler(async (req, res) => {
  const paymentId = Number(req.params.id);

  if (!Number.isFinite(paymentId)) {
    throw httpError(400, 'ID không hợp lệ');
  }

  const payment = await paymentModel.getPaymentById(paymentId);
  if (!payment) {
    throw httpError(404, 'Không tìm thấy giao dịch');
  }

  res.status(200).json({ data: payment });
});

module.exports = {
  createPayment,
  paymentStatus,
};
