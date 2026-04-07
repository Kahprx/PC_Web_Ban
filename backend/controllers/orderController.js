const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { getClient } = require('../utils/db');
const paymentModel = require('../models/paymentModel');
const {
  listOrders,
  listOrdersForAdmin,
  getOrderById,
  getProductForOrder,
  createOrderRecord,
  createOrderItemRecord,
  decreaseProductStock,
  getRecentPurchasedItems,
} = require('../models/orderModel');
const { findUserById } = require('../models/userModel');

const ONLINE_PAYMENT_METHODS = new Set(['momo', 'banking', 'card', 'installment']);
const WARRANTY_RULES = [
  {
    months: 36,
    keywords: ['cpu', 'mainboard', 'motherboard', 'vga', 'gpu', 'card màn hình', 'card man hinh'],
  },
  {
    months: 24,
    keywords: ['ram', 'ssd', 'hdd', 'psu', 'nguồn', 'nguon', 'case', 'tản nhiệt', 'tan nhiet', 'màn hình', 'man hinh', 'monitor'],
  },
  {
    months: 12,
    keywords: ['chuột', 'chuot', 'bàn phím', 'ban phim', 'tai nghe', 'gear', 'pad', 'ghế', 'ghe', 'bàn gaming', 'ban gaming'],
  },
];

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const resolveWarrantyMonths = (name = '') => {
  const normalized = normalizeText(name);
  for (const rule of WARRANTY_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return rule.months;
    }
  }
  return 24;
};

const addMonths = (baseDate, months) => {
  const date = new Date(baseDate);
  if (Number.isNaN(date.getTime())) return null;
  date.setMonth(date.getMonth() + months);
  return date;
};

const parseOrderCodeToId = (rawCode = '') => {
  const safe = String(rawCode || '').trim();
  if (!safe) return 0;

  const direct = Number(safe);
  if (Number.isFinite(direct) && direct > 0) return Math.trunc(direct);

  const matched = safe.match(/(\d{1,12})/);
  return matched?.[1] ? Number(matched[1]) : 0;
};

const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod = 'cod' } = req.body || {};
  const normalizedPaymentMethod = String(paymentMethod || 'cod').trim().toLowerCase();

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
      paymentMethod: normalizedPaymentMethod,
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

    if (ONLINE_PAYMENT_METHODS.has(normalizedPaymentMethod)) {
      await paymentModel.createPayment(
        {
          orderId: order.id,
          method: normalizedPaymentMethod,
          status: 'pending',
        },
        client
      );
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
  const search = String(req.query.search || '').trim();
  const status = req.query.status ? String(req.query.status) : null;

  const result = await listOrdersForAdmin({ page, limit, search, status });

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

const getMyPurchasedItems = asyncHandler(async (req, res) => {
  const limit = Math.min(50, toPositiveInt(req.query.limit, 12));

  const items = await getRecentPurchasedItems({
    userId: req.user.id,
    limit,
  });

  res.status(200).json({
    data: items,
  });
});

const getMyOrderDetail = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.orderId);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw httpError(400, 'orderId không hợp lệ');
  }

  const scopedUserId = req.user.role === 'admin' ? null : req.user.id;
  const order = await getOrderById(orderId, scopedUserId);
  if (!order) {
    throw httpError(404, 'Không tìm thấy đơn hàng');
  }

  res.status(200).json({
    data: order,
  });
});

const getWarrantyByOrderCode = asyncHandler(async (req, res) => {
  const orderId = parseOrderCodeToId(req.params.orderCode);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw httpError(400, 'Mã đơn hàng không hợp lệ');
  }

  const order = await getOrderById(orderId, null);
  if (!order) {
    throw httpError(404, 'Không tìm thấy đơn hàng');
  }

  const user = await findUserById(order.user_id);
  const orderedAt = new Date(order.created_at);
  const now = Date.now();

  const warrantyItems = (order.items || []).map((item) => {
    const months = resolveWarrantyMonths(item.product_name);
    const expiredAt = addMonths(orderedAt, months);
    const expiredAtTs = expiredAt ? expiredAt.getTime() : 0;
    const inWarranty = expiredAtTs > now;
    const remainDays = inWarranty ? Math.ceil((expiredAtTs - now) / (1000 * 60 * 60 * 24)) : 0;

    return {
      orderItemId: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      warrantyMonths: months,
      warrantyUntil: expiredAt ? expiredAt.toISOString() : null,
      inWarranty,
      remainingDays: remainDays,
    };
  });

  const activeCount = warrantyItems.filter((item) => item.inWarranty).length;

  res.status(200).json({
    data: {
      orderId: order.id,
      orderCode: `ORDER-${order.id}`,
      orderStatus: order.status,
      orderedAt: order.created_at,
      customer: user
        ? {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
          }
        : null,
      items: warrantyItems,
      summary: {
        totalItems: warrantyItems.length,
        activeWarrantyItems: activeCount,
        expiredWarrantyItems: Math.max(0, warrantyItems.length - activeCount),
      },
    },
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrdersForAdmin,
  getMyPurchasedItems,
  getMyOrderDetail,
  getWarrantyByOrderCode,
};
