const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const paymentModel = require("../models/paymentModel");
const { getOrderById, updateOrderStatus } = require("../models/orderModel");

const ONLINE_METHODS = new Set(["momo", "banking", "card", "installment"]);
const SUCCESS_STATUSES = new Set(["success", "paid", "completed", "succeeded", "ok", "00", "0"]);
const ORDER_SUCCESS_STATUSES = new Set(["processing", "shipping", "completed"]);

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

const normalizeMethod = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "cod";

  if (["bank", "bank_transfer", "transfer", "wire", "mbbank", "mb", "qr"].includes(raw)) {
    return "banking";
  }
  if (["credit", "credit_card", "debit", "visa", "mastercard"].includes(raw)) {
    return "card";
  }
  if (["momo", "vi_momo", "wallet_momo"].includes(raw)) {
    return "momo";
  }
  if (["installment", "tra_gop", "installment_0", "installment0"].includes(raw)) {
    return "installment";
  }

  return raw;
};

const extractOrderId = (raw) => {
  if (raw === null || raw === undefined) return 0;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.trunc(raw);
  }

  const text = String(raw).trim();
  if (!text) return 0;

  const direct = Number(text);
  if (Number.isFinite(direct)) {
    return Math.trunc(direct);
  }

  const matched = text.match(/(\d{1,12})/);
  if (!matched?.[1]) return 0;

  return Number(matched[1]);
};

const normalizePaymentSnapshot = (order, payment) => {
  const method = normalizeMethod(order?.payment_method || payment?.method || "cod");
  const paymentStatus = normalizeStatus(payment?.status || (method === "cod" ? "paid" : "pending"));
  const orderStatus = normalizeStatus(order?.status || "pending");

  const isCod = method === "cod";
  const isPaid = SUCCESS_STATUSES.has(paymentStatus);
  const isOrderConfirmed = ORDER_SUCCESS_STATUSES.has(orderStatus);

  return {
    confirmed: isCod || isPaid || isOrderConfirmed,
    paymentMethod: method,
    paymentStatus,
    orderStatus,
    order: order || null,
    payment: payment || null,
  };
};

/**
 * POST /api/payments
 * Tạo hoặc cập nhật giao dịch thanh toán cho đơn hàng.
 */
const createPayment = asyncHandler(async (req, res) => {
  const { orderId, method } = req.body || {};

  if (!orderId || !method) {
    throw httpError(400, "orderId và method là bắt buộc");
  }

  const normalizedMethod = normalizeMethod(method);
  if (!ONLINE_METHODS.has(normalizedMethod)) {
    throw httpError(400, "Phương thức này không hỗ trợ thanh toán online");
  }

  const scopedUserId = req.user?.role === "admin" ? null : req.user?.id;
  const order = await getOrderById(Number(orderId), scopedUserId);
  if (!order) {
    throw httpError(404, "Không tìm thấy đơn hàng");
  }

  const payment = await paymentModel.upsertPaymentByOrderId({
    orderId: Number(orderId),
    method: normalizedMethod,
    status: "pending",
  });

  res.status(201).json({
    message: "Đã tạo giao dịch thanh toán",
    data: normalizePaymentSnapshot(order, payment),
  });
});

/**
 * GET /api/payments/:id
 * Xem trạng thái giao dịch theo payment id.
 */
const paymentStatus = asyncHandler(async (req, res) => {
  const paymentId = Number(req.params.id);

  if (!Number.isFinite(paymentId)) {
    throw httpError(400, "ID giao dịch không hợp lệ");
  }

  const payment = await paymentModel.getPaymentById(paymentId);
  if (!payment) {
    throw httpError(404, "Không tìm thấy giao dịch");
  }

  res.status(200).json({ data: payment });
});

/**
 * GET /api/payments/order/:orderId
 * Trạng thái thanh toán theo order id (dùng cho FE polling).
 */
const paymentStatusByOrder = asyncHandler(async (req, res) => {
  const orderId = extractOrderId(req.params.orderId);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw httpError(400, "orderId không hợp lệ");
  }

  const scopedUserId = req.user?.role === "admin" ? null : req.user?.id || null;
  let order = await getOrderById(orderId, scopedUserId);

  // Nếu route đang public và chưa có req.user thì vẫn cho phép tra theo mã đơn.
  if (!order && !req.user) {
    order = await getOrderById(orderId, null);
  }

  if (!order) {
    throw httpError(404, "Không tìm thấy đơn hàng");
  }

  const payment = await paymentModel.getLatestPaymentByOrderId(orderId);

  res.status(200).json({
    data: normalizePaymentSnapshot(order, payment),
  });
});

/**
 * POST /api/payments/webhook/bank
 * Webhook callback từ ngân hàng/ví điện tử.
 */
const bankWebhook = asyncHandler(async (req, res) => {
  const webhookApiKey = String(process.env.BANK_WEBHOOK_API_KEY || "").trim();
  const requestApiKey = String(req.headers["x-bank-api-key"] || "").trim();

  if (webhookApiKey && requestApiKey !== webhookApiKey) {
    throw httpError(401, "Sai x-bank-api-key");
  }

  const payload = req.body || {};
  const orderId = extractOrderId(
    payload.orderId ||
      payload.order_id ||
      payload.orderCode ||
      payload.order_code ||
      payload.orderRef ||
      payload.order_ref ||
      payload.invoice ||
      payload.reference
  );

  const amount = toSafeNumber(payload.amount ?? payload.transferAmount ?? payload.totalAmount, 0);
  const method = normalizeMethod(payload.method || payload.paymentMethod || payload.channel || "banking");
  const rawStatus = normalizeStatus(
    payload.status ?? payload.paymentStatus ?? payload.payment_status ?? payload.result ?? payload.resultCode
  );

  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw httpError(400, "orderId không hợp lệ");
  }

  if (!ONLINE_METHODS.has(method)) {
    throw httpError(400, "method không hợp lệ cho webhook thanh toán");
  }

  const order = await getOrderById(orderId, null);
  if (!order) {
    throw httpError(404, "Không tìm thấy đơn hàng");
  }

  const orderAmount = toSafeNumber(order.total_amount, 0);
  if (amount > 0 && Math.abs(Math.round(amount) - Math.round(orderAmount)) > 1000) {
    throw httpError(400, "Số tiền callback không khớp với tổng đơn hàng");
  }

  const paid = SUCCESS_STATUSES.has(rawStatus || "success");
  const payment = await paymentModel.updatePaymentStatusByOrderId({
    orderId,
    method,
    status: paid ? "paid" : "failed",
  });

  const currentOrderStatus = normalizeStatus(order.status);
  const nextOrderStatus = paid
    ? currentOrderStatus === "completed"
      ? "completed"
      : currentOrderStatus === "shipping"
      ? "shipping"
      : "processing"
    : currentOrderStatus === "completed"
    ? "completed"
    : "pending";

  const updatedOrder = await updateOrderStatus(orderId, nextOrderStatus);

  res.status(200).json({
    message: paid ? "Ngân hàng đã xác nhận thanh toán thành công" : "Thanh toán thất bại hoặc bị từ chối",
    data: normalizePaymentSnapshot(updatedOrder || order, payment),
  });
});

/**
 * POST /api/payments/order/:orderId/confirm-demo
 * Mô phỏng callback từ ngân hàng/ví trong môi trường local để test FE.
 */
const confirmPaymentDemo = asyncHandler(async (req, res) => {
  const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";
  if (isProduction) {
    throw httpError(403, "Endpoint test chỉ dùng ở môi trường local/dev");
  }

  const orderId = extractOrderId(req.params.orderId || req.body?.orderId);
  const method = normalizeMethod(req.body?.method || "banking");

  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw httpError(400, "orderId không hợp lệ");
  }

  if (!ONLINE_METHODS.has(method)) {
    throw httpError(400, "Phương thức không hợp lệ");
  }

  const scopedUserId = req.user?.role === "admin" ? null : req.user?.id || null;
  const order = await getOrderById(orderId, scopedUserId);
  if (!order) {
    throw httpError(404, "Không tìm thấy đơn hàng");
  }

  const payment = await paymentModel.updatePaymentStatusByOrderId({
    orderId,
    method,
    status: "paid",
  });

  const currentOrderStatus = normalizeStatus(order.status);
  const nextOrderStatus =
    currentOrderStatus === "completed"
      ? "completed"
      : currentOrderStatus === "shipping"
      ? "shipping"
      : "processing";

  const updatedOrder = await updateOrderStatus(orderId, nextOrderStatus);

  res.status(200).json({
    message: "Đã xác nhận thanh toán demo thành công",
    data: normalizePaymentSnapshot(updatedOrder || order, payment),
  });
});

module.exports = {
  createPayment,
  paymentStatus,
  paymentStatusByOrder,
  bankWebhook,
  confirmPaymentDemo,
};
