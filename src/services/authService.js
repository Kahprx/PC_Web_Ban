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

export async function updateProfileApi(payload, token) {
  const result = await apiRequest('/api/users/me', {
    method: 'PUT',
    token,
    body: payload,
  });

  return result?.data || null;
}

export async function changePasswordApi(payload, token) {
  return apiRequest('/api/users/change-password', {
    method: 'PUT',
    token,
    body: payload,
  });
}

export async function forgotPasswordApi({ email }) {
  return apiRequest('/api/users/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function verifyResetPasswordTokenApi(token) {
  return apiRequest(`/api/users/reset-password/${token}`, {
    method: 'GET',
  });
}

export async function resetPasswordApi({ token, password }) {
  return apiRequest('/api/users/reset-password', {
    method: 'POST',
    body: { token, password },
  });
}
