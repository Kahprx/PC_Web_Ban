const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const commentModel = require('../models/commentModel');

/**
 * GET /api/comments/:productId
 * Lấy danh sách bình luận của một sản phẩm
 */
const getComments = asyncHandler(async (req, res) => {
  const productId = Number(req.params.productId);
  if (!Number.isFinite(productId)) {
    throw httpError(400, 'productId không hợp lệ');
  }

  const comments = await commentModel.getCommentsByProduct(productId);
  res.status(200).json({ data: comments });
});

/**
 * POST /api/comments
 * Tạo bình luận mới
 */
const createComment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId, content } = req.body || {};

  if (!productId || !content) {
    throw httpError(400, 'productId và content là bắt buộc');
  }

  const comment = await commentModel.createComment(userId, Number(productId), String(content));

  res.status(201).json({
    message: 'Tạo bình luận thành công',
    data: comment,
  });
});

/**
 * PUT /api/comments/:id
 * Cập nhật bình luận (chỉ chính chủ)
 */
const updateComment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const commentId = Number(req.params.id);
  const { content } = req.body || {};

  if (!Number.isFinite(commentId)) {
    throw httpError(400, 'ID không hợp lệ');
  }

  if (!content) {
    throw httpError(400, 'content là bắt buộc');
  }

  const updated = await commentModel.updateComment(commentId, userId, String(content));
  if (!updated) {
    throw httpError(404, 'Không tìm thấy bình luận');
  }

  res.status(200).json({
    message: 'Cập nhật bình luận thành công',
    data: updated,
  });
});

/**
 * DELETE /api/comments/:id
 * Xóa bình luận (chỉ chính chủ)
 */
const deleteComment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const commentId = Number(req.params.id);

  if (!Number.isFinite(commentId)) {
    throw httpError(400, 'ID không hợp lệ');
  }

  const removed = await commentModel.deleteComment(commentId, userId);
  if (!removed) {
    throw httpError(404, 'Không tìm thấy bình luận');
  }

  res.status(200).json({ message: 'Xóa bình luận thành công' });
});

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};
