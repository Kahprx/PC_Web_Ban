import { apiRequest } from './apiClient';

/**
 * Lấy danh sách đánh giá theo sản phẩm
 * GET /api/reviews/:productId
 */
export async function fetchReviews(productId, params = {}) {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page);
  if (params.limit) searchParams.append('limit', params.limit);
  
  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  
  const result = await apiRequest(`/api/reviews/${productId}${query}`, {
    method: 'GET',
  });
  
  return {
    data: result?.data || [],
    pagination: result?.pagination || {},
    rating: result?.rating || { avgRating: 0, totalReviews: 0 },
  };
}

/**
 * Tạo đánh giá mới
 * POST /api/reviews
 */
export async function createReviewApi({ productId, rating, comment }, token) {
  const result = await apiRequest('/api/reviews', {
    method: 'POST',
    token,
    body: { productId, rating, comment },
  });
  return result?.data || null;
}

/**
 * Cập nhật đánh giá
 * PUT /api/reviews/:id
 */
export async function updateReviewApi({ reviewId, rating, comment }, token) {
  const result = await apiRequest(`/api/reviews/${reviewId}`, {
    method: 'PUT',
    token,
    body: { rating, comment },
  });
  return result?.data || null;
}

/**
 * Xóa đánh giá
 * DELETE /api/reviews/:id
 */
export async function deleteReviewApi(reviewId, token) {
  const result = await apiRequest(`/api/reviews/${reviewId}`, {
    method: 'DELETE',
    token,
  });
  return result || null;
}

/**
 * Lấy đánh giá trung bình của sản phẩm
 * GET /api/reviews/:productId/rating
 */
export async function fetchProductRating(productId) {
  const result = await apiRequest(`/api/reviews/${productId}/rating`, {
    method: 'GET',
  });
  return result || { avgRating: 0, totalReviews: 0 };
}

