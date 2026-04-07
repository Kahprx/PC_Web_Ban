const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const reviewModel = require('../models/reviewModel');

/**
 * Lấy danh sách đánh giá theo sản phẩm
 * GET /api/reviews/:productId
 */
const getReviews = asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId);
  const { page = 1, limit = 10 } = req.query;

  if (!Number.isFinite(productId)) {
    throw httpError(400, 'productId không hợp lệ');
  }

  const result = await reviewModel.getReviewsByProduct(
    productId,
    Math.max(1, Number(page)),
    Math.min(50, Number(limit) || 10)
  );

  // Lấy đánh giá trung bình
  const avgRating = await reviewModel.getAverageRating(productId);

  res.status(200).json({
    data: result.items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
    rating: avgRating,
  });
});

/**
 * Tạo đánh giá mới
 * POST /api/reviews
 */
const createReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId, rating, comment } = req.body;

  if (!productId || rating === undefined) {
    throw httpError(400, 'productId và rating là bắt buộc');
  }

  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    throw httpError(400, 'Rating phải từ 1 đến 5');
  }

  // Kiểm tra user đã đánh giá chưa
  const existing = await reviewModel.getUserReviewForProduct(userId, productId);
  if (existing) {
    throw httpError(400, 'Bạn đã đánh giá sản phẩm này rồi');
  }

  const review = await reviewModel.createReview(userId, productId, numericRating, comment);

  res.status(201).json({
    message: 'Đánh giá thành công',
    data: review,
  });
});

/**
 * Cập nhật đánh giá
 * PUT /api/reviews/:id
 */
const updateReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const reviewId = Number(req.params.id);
  const { rating, comment } = req.body;

  if (!Number.isFinite(reviewId)) {
    throw httpError(400, 'ID không hợp lệ');
  }

  if (rating !== undefined) {
    const numericRating = Number(rating);
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      throw httpError(400, 'Rating phải từ 1 đến 5');
    }
  }

  const updated = await reviewModel.updateReview(
    reviewId,
    userId,
    rating ? Number(rating) : undefined,
    comment
  );

  if (!updated) {
    throw httpError(404, 'Không tìm thấy đánh giá');
  }

  res.status(200).json({
    message: 'Cập nhật đánh giá thành công',
    data: updated,
  });
});

/**
 * Xóa đánh giá
 * DELETE /api/reviews/:id
 */
const deleteReview = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const reviewId = Number(req.params.id);

  if (!Number.isFinite(reviewId)) {
    throw httpError(400, 'ID không hợp lệ');
  }

  const removed = await reviewModel.deleteReview(reviewId, userId);

  if (!removed) {
    throw httpError(404, 'Không tìm thấy đánh giá');
  }

  res.status(200).json({
    message: 'Xóa đánh giá thành công',
  });
});

/**
 * Lấy đánh giá trung bình của sản phẩm
 * GET /api/reviews/:productId/rating
 */
const getProductRating = asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId);

  if (!Number.isFinite(productId)) {
    throw httpError(400, 'productId không hợp lệ');
  }

  const avgRating = await reviewModel.getAverageRating(productId);

  res.status(200).json(avgRating);
});

module.exports = {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  getProductRating,
};

