const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const cartModel = require('../models/cartModel');

/**
 * Lấy danh sách sản phẩm trong giỏ hàng
 * GET /api/cart
 */
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const items = await cartModel.getCartItems(userId);
  const count = await cartModel.getCartCount(userId);
  
  // Tính tổng tiền
  const subtotal = items.reduce((sum, item) => sum + Number(item.line_total), 0);
  
  res.status(200).json({
    data: items,
    summary: {
      itemCount: count,
      subtotal,
    },
  });
});

/**
 * Thêm sản phẩm vào giỏ hàng
 * POST /api/cart/add
 */
const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    throw httpError(400, 'productId là bắt buộc');
  }

  const numericQty = Number(quantity);
  if (!Number.isFinite(numericQty) || numericQty < 1) {
    throw httpError(400, 'Số lượng phải lớn hơn 0');
  }

  const result = await cartModel.addToCart(userId, productId, numericQty);

  res.status(201).json({
    message: result.action === 'created' ? 'Thêm vào giỏ hàng thành công' : 'Cập nhật số lượng thành công',
    data: result,
  });
});

/**
 * Cập nhật số lượng sản phẩm trong giỏ
 * PUT /api/cart/:id
 */
const updateCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cartItemId = Number(req.params.id);
  const { quantity } = req.body;

  if (!Number.isFinite(cartItemId)) {
    throw httpError(400, 'ID không hợp lệ');
  }

  const numericQty = Number(quantity);
  if (!Number.isFinite(numericQty) || numericQty < 1) {
    throw httpError(400, 'Số lượng phải lớn hơn 0');
  }

  const updated = await cartModel.updateCartItem(cartItemId, userId, numericQty);

  if (!updated) {
    throw httpError(404, 'Không tìm thấy sản phẩm trong giỏ');
  }

  res.status(200).json({
    message: 'Cập nhật giỏ hàng thành công',
    data: updated,
  });
});

/**
 * Xóa sản phẩm khỏi giỏ hàng
 * DELETE /api/cart/:id
 */
const deleteCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const cartItemId = Number(req.params.id);

  if (!Number.isFinite(cartItemId)) {
    throw httpError(400, 'ID không hợp lệ');
  }

  const removed = await cartModel.removeCartItem(cartItemId, userId);

  if (!removed) {
    throw httpError(404, 'Không tìm thấy sản phẩm trong giỏ');
  }

  res.status(200).json({
    message: 'Xóa sản phẩm khỏi giỏ hàng thành công',
  });
});

/**
 * Xóa toàn bộ giỏ hàng
 * DELETE /api/cart
 */
const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await cartModel.clearCart(userId);

  res.status(200).json({
    message: 'Xóa toàn bộ giỏ hàng thành công',
  });
});

module.exports = {
  getCart,
  addToCart,
  updateCart,
  deleteCartItem,
  clearCart,
};

