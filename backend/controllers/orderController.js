const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { getClient } = require('../utils/db');
const {
  listOrders,
  getOrderById,
  getProductForOrder,
  createOrderRecord,
  createOrderItemRecord,
  decreaseProductStock,
} = require('../models/orderModel');

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod = 'cod' } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'items phải là mảng và không rỗng');
  }

  if (!shippingAddress) {
    throw httpError(400, 'shippingAddress là bắt buộc');
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    const normalizedItems = [];

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity || 1);

      if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
        throw httpError(400, 'item không hợp lệ');
      }

      const product = await getProductForOrder(client, productId);

      if (!product) {
        throw httpError(404, `Không tìm thấy sản phẩm id=${productId}`);
      }

      if (Number(product.stock_qty) < quantity) {
        throw httpError(400, `Sản phẩm ${product.name} không đủ tồn kho`);
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * quantity;
      totalAmount += lineTotal;

      normalizedItems.push({
        productId,
        quantity,
        unitPrice,
        lineTotal,
      });
    }

    const order = await createOrderRecord(client, {
      userId: req.user.id,
      totalAmount,
      shippingAddress: String(shippingAddress),
      paymentMethod: String(paymentMethod),
    });

    for (const item of normalizedItems) {
      await createOrderItemRecord(client, {
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      });

      await decreaseProductStock(client, {
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    await client.query('COMMIT');

    const orderWithItems = await getOrderById(order.id, req.user.role === 'admin' ? null : req.user.id);

    res.status(201).json({
      message: 'Tạo đơn hàng thành công',
      data: orderWithItems,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(50, toPositiveInt(req.query.limit, 10));

  const result = await listOrders({
    userId: req.user.id,
    page,
    limit,
  });

  res.status(200).json({
    data: result.items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    },
  });
});

const getAllOrdersForAdmin = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(50, toPositiveInt(req.query.limit, 10));

  const result = await listOrders({ page, limit });

  res.status(200).json({
    data: result.items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrdersForAdmin,
};
