const { query } = require('../utils/db');

/**
 * Lấy danh sách yêu thích của user
 */
const getWishlistItems = async (userId) => {
  const result = await query(
    `SELECT 
      w.id,
      w.product_id,
      w.created_at,
      p.name AS product_name,
      p.price,
      p.image_url,
      p.stock_qty,
      p.slug
    FROM wishlist w
    JOIN products p ON p.id = w.product_id
    WHERE w.user_id = $1
    ORDER BY w.created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Kiểm tra sản phẩm đã có trong wishlist chưa
 */
const isInWishlist = async (userId, productId) => {
  const result = await query(
    'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );
  return result.rows.length > 0;
};

/**
 * Thêm sản phẩm vào wishlist
 */
const addToWishlist = async (userId, productId) => {
  // Kiểm tra đã tồn tại chưa
  const existing = await query(
    'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );

  if (existing.rows.length > 0) {
    return { id: existing.rows[0].id, action: 'exists' };
  }

  const result = await query(
    'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) RETURNING *',
    [userId, productId]
  );
  return { ...result.rows[0], action: 'created' };
};

/**
 * Xóa sản phẩm khỏi wishlist
 */
const removeFromWishlist = async (wishlistId, userId) => {
  const result = await query(
    'DELETE FROM wishlist WHERE id = $1 AND user_id = $2 RETURNING id',
    [wishlistId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Xóa sản phẩm khỏi wishlist theo product_id
 */
const removeByProductId = async (userId, productId) => {
  const result = await query(
    'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING id',
    [userId, productId]
  );
  return result.rows[0] || null;
};

/**
 * Lấy số lượng wishlist của user
 */
const getWishlistCount = async (userId) => {
  const result = await query(
    'SELECT COUNT(*)::int AS total FROM wishlist WHERE user_id = $1',
    [userId]
  );
  return Number(result.rows[0].total);
};

module.exports = {
  getWishlistItems,
  isInWishlist,
  addToWishlist,
  removeFromWishlist,
  removeByProductId,
  getWishlistCount,
};

