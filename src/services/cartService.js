import { apiRequest } from './apiClient';

/**
 * Lấy danh sách sản phẩm trong giỏ hàng
 * GET /api/cart
 */
export async function fetchCart(token) {
  const result = await apiRequest('/api/cart', {
    method: 'GET',
    token,
  });
  return result?.data || [];
}

/**
 * Thêm sản phẩm vào giỏ hàng
 * POST /api/cart/add
 */
export async function addToCartApi({ productId, quantity = 1 }, token) {
  const result = await apiRequest('/api/cart/add', {
    method: 'POST',
    token,
    body: { productId, quantity },
  });
  return result?.data || null;
}

/**
 * Cập nhật số lượng sản phẩm trong giỏ
 * PUT /api/cart/:id
 */
export async function updateCartItemApi({ cartItemId, quantity }, token) {
  const result = await apiRequest(`/api/cart/${cartItemId}`, {
    method: 'PUT',
    token,
    body: { quantity },
  });
  return result?.data || null;
}

/**
 * Xóa sản phẩm khỏi giỏ hàng
 * DELETE /api/cart/:id
 */
export async function removeCartItemApi(cartItemId, token) {
  const result = await apiRequest(`/api/cart/${cartItemId}`, {
    method: 'DELETE',
    token,
  });
  return result || null;
}

/**
 * Xóa toàn bộ giỏ hàng
 * DELETE /api/cart
 */
export async function clearCartApi(token) {
  const result = await apiRequest('/api/cart', {
    method: 'DELETE',
    token,
  });
  return result || null;
}

