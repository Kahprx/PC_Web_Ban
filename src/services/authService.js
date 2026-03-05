import { apiRequest } from './apiClient';

export async function loginApi({ email, password }) {
  const result = await apiRequest('/api/users/login', {
    method: 'POST',
    body: { email, password },
  });

  return result?.data || null;
}

export async function registerApi({ fullName, email, password }) {
  const result = await apiRequest('/api/users/register', {
    method: 'POST',
    body: { fullName, email, password },
  });

  return result?.data || null;
}

export async function profileApi(token) {
  const result = await apiRequest('/api/users/me', {
    method: 'GET',
    token,
  });

  return result?.data || null;
}
