const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { slugify } = require('../utils/slugify');
const {
  listProducts,
  findProductById,
  findProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../models/productModel');

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const getProducts = asyncHandler(async (req, res) => {
  const {
    search = '',
    categoryId = null,
    status = null,
    page = 1,
    limit = 12,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = req.query;

  const result = await listProducts({
    search: String(search || '').trim(),
    categoryId: categoryId ? Number(categoryId) : null,
    status: status ? String(status) : null,
    page: toPositiveInt(page, 1),
    limit: Math.min(50, toPositiveInt(limit, 12)),
    sortBy: String(sortBy),
    sortOrder: String(sortOrder),
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

const getProductById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    throw httpError(400, 'id không hợp lệ');
  }

  const product = await findProductById(id);

  if (!product) {
    throw httpError(404, 'Không tìm thấy sản phẩm');
  }

  res.status(200).json({ data: product });
});

const createProductHandler = asyncHandler(async (req, res) => {
  const { categoryId, name, slug, description, price, stockQty, imageUrl, status } = req.body || {};

  if (!name || price === undefined || price === null) {
    throw httpError(400, 'name và price là bắt buộc');
  }

  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    throw httpError(400, 'price không hợp lệ');
  }

  const nextSlug = slugify(slug || name);
  if (!nextSlug) {
    throw httpError(400, 'slug không hợp lệ');
  }

  const duplicated = await findProductBySlug(nextSlug);
  if (duplicated) {
    throw httpError(400, 'slug đã tồn tại');
  }

  const product = await createProduct({
    categoryId: categoryId ? Number(categoryId) : null,
    name: String(name).trim(),
    slug: nextSlug,
    description: description ? String(description) : null,
    price: numericPrice,
    stockQty: stockQty !== undefined ? Number(stockQty) : 0,
    imageUrl: imageUrl ? String(imageUrl) : null,
    status: status || 'active',
  });

  res.status(201).json({
    message: 'Tạo sản phẩm thành công',
    data: product,
  });
});

const updateProductHandler = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    throw httpError(400, 'id không hợp lệ');
  }

  const current = await findProductById(id);
  if (!current) {
    throw httpError(404, 'Không tìm thấy sản phẩm');
  }

  const {
    categoryId = current.category_id,
    name = current.name,
    slug = current.slug,
    description = current.description,
    price = current.price,
    stockQty = current.stock_qty,
    imageUrl = current.image_url,
    status = current.status,
  } = req.body || {};

  const nextSlug = slugify(slug || name);
  if (!nextSlug) {
    throw httpError(400, 'slug không hợp lệ');
  }

  const duplicated = await findProductBySlug(nextSlug);
  if (duplicated && Number(duplicated.id) !== id) {
    throw httpError(400, 'slug đã tồn tại');
  }

  const product = await updateProduct(id, {
    categoryId: categoryId ? Number(categoryId) : null,
    name: String(name).trim(),
    slug: nextSlug,
    description: description ? String(description) : null,
    price: Number(price),
    stockQty: Number(stockQty),
    imageUrl: imageUrl ? String(imageUrl) : null,
    status: status || 'active',
  });

  res.status(200).json({
    message: 'Cập nhật sản phẩm thành công',
    data: product,
  });
});

const deleteProductHandler = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    throw httpError(400, 'id không hợp lệ');
  }

  const removed = await deleteProduct(id);

  if (!removed) {
    throw httpError(404, 'Không tìm thấy sản phẩm');
  }

  res.status(200).json({
    message: 'Xóa sản phẩm thành công',
  });
});

module.exports = {
  getProducts,
  getProductById,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
};
