import { apiRequest } from './apiClient';

const toQuery = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      search.append(k, String(v));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
};

export async function createOrder(payload, token) {
  return apiRequest('/api/orders', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function fetchMyOrders(token, params = {}) {
  return apiRequest(`/api/orders/my${toQuery(params)}`, {
    method: 'GET',
    token,
  });
}

export async function fetchAdminOrders(token, params = {}) {
  return apiRequest(`/api/orders${toQuery(params)}`, {
    method: 'GET',
    token,
  });
}
