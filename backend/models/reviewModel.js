const { query } = require('../utils/db');

/**
 * Lấy danh sách đánh giá theo sản phẩm
 */
const getReviewsByProduct = async (productId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const countResult = await query(
    'SELECT COUNT(*)::int AS total FROM reviews WHERE product_id = $1',
    [productId]
  );

  const result = await query(
    `SELECT 
      r.id,
      r.user_id,
      r.product_id,
      r.rating,
      r.comment,
      r.created_at,
      r.updated_at,
      u.full_name AS user_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    WHERE r.product_id = $1
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3`,
    [productId, limit, offset]
  );

  return {
    items: result.rows,
    total: countResult.rows[0].total,
    page,
    limit,
    totalPages: Math.ceil(countResult.rows[0].total / limit),
  };
};

/**
 * Lấy đánh giá theo ID
 */
const getReviewById = async (reviewId) => {
  const result = await query(
    `SELECT r.*, u.full_name AS user_name 
     FROM reviews r 
     JOIN users u ON u.id = r.user_id 
     WHERE r.id = $1`,
    [reviewId]
  );
  return result.rows[0] || null;
};

/**
 * Tạo đánh giá mới
 */
const createReview = async (userId, productId, rating, comment) => {
  const result = await query(
    `INSERT INTO reviews (user_id, product_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, productId, rating, comment || null]
  );
  return result.rows[0];
};

/**
 * Cập nhật đánh giá
 */
const updateReview = async (reviewId, userId, rating, comment) => {
  const result = await query(
    `UPDATE reviews 
     SET rating = $1, comment = $2, updated_at = NOW()
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [rating, comment || null, reviewId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Xóa đánh giá
 */
const deleteReview = async (reviewId, userId) => {
  const result = await query(
    'DELETE FROM reviews WHERE id = $1 AND user_id = $2 RETURNING id',
    [reviewId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Lấy đánh giá của user cho sản phẩm
 */
const getUserReviewForProduct = async (userId, productId) => {
  const result = await query(
    'SELECT * FROM reviews WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
  return result.rows[0] || null;
};

/**
 * Lấy đánh giá trung bình của sản phẩm
 */
const getAverageRating = async (productId) => {
  const result = await query(
    `SELECT 
      COUNT(*)::int AS total_reviews,
      COALESCE(AVG(rating), 0)::numeric(2,1) AS avg_rating
     FROM reviews 
     WHERE product_id = $1`,
    [productId]
  );
  return {
    totalReviews: Number(result.rows[0].total_reviews),
    avgRating: Number(result.rows[0].avg_rating),
  };
};

/**
 * Lấy tất cả đánh giá (admin)
 */
const getAllReviews = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const countResult = await query('SELECT COUNT(*)::int AS total FROM reviews');

  const result = await query(
    `SELECT 
      r.id,
      r.user_id,
      r.product_id,
      r.rating,
      r.comment,
      r.created_at,
      u.full_name AS user_name,
      p.name AS product_name
    FROM reviews r
    JOIN users u ON u.id = r.user_id
    JOIN products p ON p.id = r.product_id
    ORDER BY r.created_at DESC
    LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    items: result.rows,
    total: countResult.rows[0].total,
    page,
    limit,
    totalPages: Math.ceil(countResult.rows[0].total / limit),
  };
};

module.exports = {
  getReviewsByProduct,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getUserReviewForProduct,
  getAverageRating,
  getAllReviews,
};

