const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { query } = require("../utils/db");
const { slugify } = require("../utils/slugify");
const {
  listUsers,
  findUserById,
  createUser,
  findUserByEmail,
  updateUserRole,
  updateUserActive,
} = require("../models/userModel");
const {
  listOrdersForAdmin,
  getOrderById,
  updateOrderStatus,
} = require("../models/orderModel");
const {
  listProducts,
  findProductById,
  findProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../models/productModel");
const { getOrderStatistics } = require("../models/orderModel");
const bcrypt = require("bcrypt");

const ALLOWED_ORDER_STATUS = new Set(["pending", "processing", "shipping", "completed", "cancelled"]);
const ALLOWED_USER_ROLES = new Set(["admin", "user"]);

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const normalizeBoolQuery = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return null;
};

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const normalizeProductPayload = async (payload, current = null) => {
  const categoryId = payload.categoryId ?? current?.category_id ?? null;
  const name = String(payload.name ?? current?.name ?? "").trim();
  const description = payload.description ?? current?.description ?? null;
  const status = String(payload.status ?? current?.status ?? "active").toLowerCase();
  const imageUrl = payload.imageUrl ?? current?.image_url ?? null;
  const stockQty = Number(payload.stockQty ?? current?.stock_qty ?? 0);
  const price = Number(payload.price ?? current?.price);
  const rawSlug = payload.slug ?? name ?? current?.slug ?? "";
  const slug = slugify(rawSlug);

  if (!name) throw httpError(400, "name là bắt buộc");
  if (!slug) throw httpError(400, "slug không hợp lệ");
  if (!Number.isFinite(price) || price < 0) throw httpError(400, "price không hợp lệ");
  if (!Number.isFinite(stockQty) || stockQty < 0) throw httpError(400, "stockQty không hợp lệ");
  if (!["active", "inactive"].includes(status)) throw httpError(400, "status không hợp lệ");

  const duplicated = await findProductBySlug(slug);
  if (duplicated && (!current || Number(duplicated.id) !== Number(current.id))) {
    throw httpError(400, "slug đã tồn tại");
  }

  return {
    categoryId: categoryId ? Number(categoryId) : null,
    name,
    slug,
    description: description ? String(description) : null,
    price,
    stockQty,
    imageUrl: imageUrl ? String(imageUrl) : null,
    status,
  };
};

const getAdminOverview = asyncHandler(async (_req, res) => {
  const [orderStats, userStatsResult, productStatsResult, recentOrdersResult] = await Promise.all([
    getOrderStatistics(),
    query(
      `SELECT
        COUNT(*)::int AS total_users,
        COUNT(*) FILTER (WHERE role = 'admin')::int AS total_admins,
        COUNT(*) FILTER (WHERE is_active = TRUE)::int AS active_users
       FROM users`
    ),
    query(
      `SELECT
        COUNT(*)::int AS total_products,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_products,
        COUNT(*) FILTER (WHERE stock_qty <= 0)::int AS out_of_stock_products
       FROM products`
    ),
    query(
      `SELECT
        o.id,
        o.user_id,
        u.full_name,
        u.email,
        o.total_amount,
        o.status,
        o.created_at
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC
       LIMIT 5`
    ),
  ]);

  res.status(200).json({
    data: {
      orders: orderStats,
      users: userStatsResult.rows[0],
      products: productStatsResult.rows[0],
      recentOrders: recentOrdersResult.rows,
    },
  });
});

const getAdminUsers = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(100, toPositiveInt(req.query.limit, 20));
  const search = String(req.query.search || "").trim();
  const role = req.query.role ? String(req.query.role) : null;
  const isActive = normalizeBoolQuery(req.query.isActive);

  if (role && !ALLOWED_USER_ROLES.has(role)) {
    throw httpError(400, "role không hợp lệ");
  }

  const result = await listUsers({ page, limit, search, role, isActive });

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

const createAdminUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, role = "user" } = req.body || {};

  if (!fullName || !email || !password) {
    throw httpError(400, "fullName, email, password là bắt buộc");
  }

  if (!isValidEmail(String(email))) {
    throw httpError(400, "Email không hợp lệ");
  }

  if (!ALLOWED_USER_ROLES.has(String(role))) {
    throw httpError(400, "role không hợp lệ");
  }

  if (String(password).length < 6) {
    throw httpError(400, "Mật khẩu tối thiểu 6 ký tự");
  }

  const existed = await findUserByEmail(String(email).toLowerCase().trim());
  if (existed) {
    throw httpError(400, "Email đã tồn tại");
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(String(password), rounds);

  const user = await createUser({
    fullName: String(fullName).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    role: String(role),
  });

  res.status(201).json({
    message: "Tạo user thành công",
    data: user,
  });
});

const patchAdminUserRole = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const role = String(req.body?.role || "").toLowerCase();

  if (!Number.isFinite(userId)) throw httpError(400, "id không hợp lệ");
  if (!ALLOWED_USER_ROLES.has(role)) throw httpError(400, "role không hợp lệ");

  const user = await updateUserRole(userId, role);
  if (!user) throw httpError(404, "Không tìm thấy user");

  res.status(200).json({
    message: "Cập nhật role thành công",
    data: user,
  });
});

const patchAdminUserActive = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);
  const isActive = req.body?.isActive;

  if (!Number.isFinite(userId)) throw httpError(400, "id không hợp lệ");
  if (typeof isActive !== "boolean") throw httpError(400, "isActive phải là boolean");

  const user = await updateUserActive(userId, isActive);
  if (!user) throw httpError(404, "Không tìm thấy user");

  res.status(200).json({
    message: "Cập nhật trạng thái user thành công",
    data: user,
  });
});

const getAdminOrders = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(100, toPositiveInt(req.query.limit, 20));
  const search = String(req.query.search || "").trim();
  const status = req.query.status ? String(req.query.status) : null;

  if (status && !ALLOWED_ORDER_STATUS.has(status)) {
    throw httpError(400, "status không hợp lệ");
  }

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

const getAdminOrderDetail = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  if (!Number.isFinite(orderId)) throw httpError(400, "id không hợp lệ");

  const order = await getOrderById(orderId, null);
  if (!order) throw httpError(404, "Không tìm thấy đơn hàng");

  res.status(200).json({ data: order });
});

const patchAdminOrderStatus = asyncHandler(async (req, res) => {
  const orderId = Number(req.params.id);
  const status = String(req.body?.status || "").toLowerCase();

  if (!Number.isFinite(orderId)) throw httpError(400, "id không hợp lệ");
  if (!ALLOWED_ORDER_STATUS.has(status)) throw httpError(400, "status không hợp lệ");

  const current = await getOrderById(orderId, null);
  if (!current) throw httpError(404, "Không tìm thấy đơn hàng");

  const updated = await updateOrderStatus(orderId, status);

  res.status(200).json({
    message: "Cập nhật trạng thái đơn hàng thành công",
    data: updated,
  });
});

const getAdminProducts = asyncHandler(async (req, res) => {
  const page = toPositiveInt(req.query.page, 1);
  const limit = Math.min(100, toPositiveInt(req.query.limit, 20));
  const search = String(req.query.search || "").trim();
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
  const status = req.query.status ? String(req.query.status) : null;
  const sortBy = String(req.query.sortBy || "created_at");
  const sortOrder = String(req.query.sortOrder || "desc");

  const result = await listProducts({ page, limit, search, categoryId, status, sortBy, sortOrder });

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

const createAdminProduct = asyncHandler(async (req, res) => {
  const payload = await normalizeProductPayload(req.body || {});
  const product = await createProduct(payload);

  res.status(201).json({
    message: "Tạo sản phẩm thành công",
    data: product,
  });
});

const updateAdminProduct = asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isFinite(productId)) throw httpError(400, "id không hợp lệ");

  const current = await findProductById(productId);
  if (!current) throw httpError(404, "Không tìm thấy sản phẩm");

  const payload = await normalizeProductPayload(req.body || {}, current);
  const product = await updateProduct(productId, payload);

  res.status(200).json({
    message: "Cập nhật sản phẩm thành công",
    data: product,
  });
});

const removeAdminProduct = asyncHandler(async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isFinite(productId)) throw httpError(400, "id không hợp lệ");

  const removed = await deleteProduct(productId);
  if (!removed) throw httpError(404, "Không tìm thấy sản phẩm");

  res.status(200).json({ message: "Xóa sản phẩm thành công" });
});

module.exports = {
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
};
