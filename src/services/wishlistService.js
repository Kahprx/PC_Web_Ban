import { apiRequest } from './apiClient';

/**
 * Lấy danh sách yêu thích của user
 * GET /api/wishlist
 */
export async function fetchWishlist(token) {
  const result = await apiRequest('/api/wishlist', {
    method: 'GET',
    token,
  });
  return result?.data || [];
}

/**
 * Thêm sản phẩm vào wishlist
 * POST /api/wishlist/add
 */
export async function addToWishlistApi(productId, token) {
  const result = await apiRequest('/api/wishlist/add', {
    method: 'POST',
    token,
    body: { productId },
  });
  return result?.data || null;
}

/**
 * Xóa sản phẩm khỏi wishlist
 * DELETE /api/wishlist/:id
 */
export async function removeFromWishlistApi(wishlistId, token) {
  const result = await apiRequest(`/api/wishlist/${wishlistId}`, {
    method: 'DELETE',
    token,
  });
  return result || null;
}

/**
 * Xóa sản phẩm khỏi wishlist theo productId
 * DELETE /api/wishlist/product/:productId
 */
export async function removeFromWishlistByProductApi(productId, token) {
  const result = await apiRequest(`/api/wishlist/product/${productId}`, {
    method: 'DELETE',
    token,
  });
  return result || null;
}

