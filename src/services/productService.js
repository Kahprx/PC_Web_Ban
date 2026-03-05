import { apiRequest, API_BASE_URL } from './apiClient';

const toQuery = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });

  const query = search.toString();
  return query ? `?${query}` : '';
};

export async function fetchProducts(params = {}) {
  return apiRequest(`/api/products${toQuery(params)}`);
}

export async function fetchProductById(id) {
  const result = await apiRequest(`/api/products/${id}`);
  return result?.data || null;
}

export async function createProduct(payload, token) {
  return apiRequest('/api/products', {
    method: 'POST',
    token,
    body: payload,
  });
}

export async function updateProduct(id, payload, token) {
  return apiRequest(`/api/products/${id}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export async function deleteProduct(id, token) {
  return apiRequest(`/api/products/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function fetchCategories() {
  const result = await apiRequest('/api/categories');
  return result?.data || [];
}

export async function uploadProductImage(file, token) {
  const formData = new FormData();
  formData.append('image', file);

  const result = await apiRequest('/api/upload/image', {
    method: 'POST',
    token,
    body: formData,
  });

  return result?.data || null;
}

export const toAbsoluteImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
