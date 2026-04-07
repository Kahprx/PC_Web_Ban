const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const wishlistModel = require('../models/wishlistModel');

/**
 * Lấy danh sách yêu thích của user
 * GET /api/wishlist
 */
const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const items = await wishlistModel.getWishlistItems(userId);
  const count = await wishlistModel.getWishlistCount(userId);
  
  res.status(200).json({
    data: items,
    total: count,
  });
});

/**
 * Thêm sản phẩm vào wishlist
 * POST /api/wishlist/add
 */
const addWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.body;

  if (!productId) {
    throw httpError(400, 'productId là bắt buộc');
  }

  const result = await wishlistModel.addToWishlist(userId, productId);

  res.status(201).json({
    message: result.action === 'created' ? 'Thêm vào wishlist thành công' : 'Sản phẩm đã có trong wishlist',
    data: result,
  });
});

/**
 * Xóa sản phẩm khỏi wishlist
 * DELETE /api/wishlist/:id
 */
const deleteWishlist = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const wishlistId = Number(req.params.id);

  if (!Number.isFinite(wishlistId)) {
    throw httpError(400, 'ID không hợp lệ');
  }

  const removed = await wishlistModel.removeFromWishlist(wishlistId, userId);

  if (!removed) {
    throw httpError(404, 'Không tìm thấy sản phẩm trong wishlist');
  }

  res.status(200).json({
    message: 'Xóa khỏi wishlist thành công',
  });
});

/**
 * Xóa sản phẩm khỏi wishlist theo productId
 * DELETE /api/wishlist/product/:productId
 */
const deleteByProductId = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const productId = Number(req.params.productId);

  if (!Number.isFinite(productId)) {
    throw httpError(400, 'productId không hợp lệ');
  }

  const removed = await wishlistModel.removeByProductId(userId, productId);

  if (!removed) {
    throw httpError(404, 'Không tìm thấy sản phẩm trong wishlist');
  }

  res.status(200).json({
    message: 'Xóa khỏi wishlist thành công',
  });
});

module.exports = {
  getWishlist,
  addWishlist,
  deleteWishlist,
  deleteByProductId,
};

