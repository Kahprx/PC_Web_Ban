const { query } = require('../utils/db');

/**
 * Lấy danh sách sản phẩm trong giỏ hàng của user
 */
const getCartItems = async (userId) => {
  const result = await query(
    `SELECT 
      ci.id,
      ci.product_id,
      ci.quantity,
      p.name AS product_name,
      p.price,
      p.image_url,
      p.stock_qty,
      (p.price * ci.quantity) AS line_total
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.user_id = $1
    ORDER BY ci.created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Thêm sản phẩm vào giỏ hàng
 */
const addToCart = async (userId, productId, quantity = 1) => {
  // Kiểm tra xem sản phẩm đã có trong giỏ chưa
  const existing = await query(
    'SELECT id, quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
    [userId, productId]
  );

  if (existing.rows.length > 0) {
    // Cập nhật số lượng nếu đã tồn tại
    const newQty = existing.rows[0].quantity + quantity;
    await query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2',
      [newQty, existing.rows[0].id]
    );
    return { id: existing.rows[0].id, quantity: newQty, action: 'updated' };
  }

  // Thêm mới nếu chưa tồn tại
  const result = await query(
    'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
    [userId, productId, quantity]
  );
  return { ...result.rows[0], action: 'created' };
};

/**
 * Cập nhật số lượng sản phẩm trong giỏ
 */
const updateCartItem = async (cartItemId, userId, quantity) => {
  const result = await query(
    'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [quantity, cartItemId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Xóa sản phẩm khỏi giỏ hàng
 */
const removeCartItem = async (cartItemId, userId) => {
  const result = await query(
    'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING id',
    [cartItemId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Xóa toàn bộ giỏ hàng của user
 */
const clearCart = async (userId) => {
  await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  return true;
};

/**
 * Lấy tổng số sản phẩm trong giỏ
 */
const getCartCount = async (userId) => {
  const result = await query(
    'SELECT COALESCE(SUM(quantity), 0) AS total FROM cart_items WHERE user_id = $1',
    [userId]
  );
  return Number(result.rows[0].total);
};

module.exports = {
  getCartItems,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  getCartCount,
};

