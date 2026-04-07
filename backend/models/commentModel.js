const { query } = require('../utils/db');

/**
 * Lấy danh sách bình luận theo sản phẩm
 */
const getCommentsByProduct = async (productId) => {
  const result = await query(
    `SELECT 
       c.id,
       c.user_id,
       c.product_id,
       c.content,
       c.created_at,
       u.full_name AS user_name,
       u.email AS user_email
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.product_id = $1
     ORDER BY c.created_at DESC`,
    [productId]
  );

  return result.rows;
};

/**
 * Tạo bình luận mới
 */
const createComment = async (userId, productId, content) => {
  const result = await query(
    `INSERT INTO comments (user_id, product_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, productId, content]
  );

  return result.rows[0];
};

/**
 * Cập nhật nội dung bình luận (chỉ chính chủ)
 */
const updateComment = async (commentId, userId, content) => {
  const result = await query(
    `UPDATE comments
     SET content = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [content, commentId, userId]
  );

  return result.rows[0] || null;
};

/**
 * Xóa bình luận (chỉ chính chủ)
 */
const deleteComment = async (commentId, userId) => {
  const result = await query(
    `DELETE FROM comments
     WHERE id = $1 AND user_id = $2
     RETURNING id`,
    [commentId, userId]
  );

  return result.rows[0] || null;
};

module.exports = {
  getCommentsByProduct,
  createComment,
  updateComment,
  deleteComment,
};
