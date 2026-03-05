import { apiRequest } from './apiClient';

export async function createOrder(payload, token) {
  return apiRequest('/api/orders', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function fetchMyOrders(token, params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      search.append(k, String(v));
    }
  });

  const query = search.toString() ? `?${search.toString()}` : '';

  return apiRequest(`/api/orders/my${query}`, {
    method: 'GET',
    token,
  });
}
