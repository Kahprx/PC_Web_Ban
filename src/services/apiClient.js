import axios from 'axios';

const resolveApiBaseUrl = () => {
  const envUrl = String(import.meta.env.VITE_API_URL || '').trim();
  if (envUrl) return envUrl;
  return '';
};

const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  constructor(message, statusCode, payload = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.payload = payload;
  }
}

const extractToken = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem('pc_store_session');
    if (!raw) return null;

    const session = JSON.parse(raw);
    return session?.token || null;
  } catch {
    return null;
  }
};

const axiosClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 15000,
});

const toApiMessage = (statusCode, payload, fallbackMessage) => {
  const payloadMessage = typeof payload?.message === 'string' ? payload.message.trim() : '';
  if (payloadMessage) return payloadMessage;

  if (statusCode === 500) {
    return 'Backend dang loi hoac chua chay. Vui long mo backend (port 4000) roi thu lai.';
  }

  if (statusCode === 404) {
    return 'Khong tim thay API endpoint. Vui long kiem tra route backend.';
  }

  if (statusCode === 401) {
    return 'Ban chua dang nhap hoac token het han.';
  }

  return fallbackMessage || `HTTP ${statusCode}`;
};

axiosClient.interceptors.request.use((config) => {
  const token = extractToken();

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasHttpResponse = Boolean(error?.response);
    const statusCode = hasHttpResponse ? error.response.status : 0;
    const payload = error?.response?.data || null;
    const message = hasHttpResponse
      ? toApiMessage(statusCode, payload, error?.message)
      : 'Khong ket noi duoc may chu API. Vui long kiem tra backend va cau hinh VITE_API_URL.';

    return Promise.reject(new ApiError(message, statusCode, payload));
  }
);

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    token,
  } = options;

  const finalHeaders = { ...headers };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    url: path,
    method,
    headers: finalHeaders,
  };

  if (body !== undefined) {
    config.data = body;
  }

  const response = await axiosClient.request(config);
  return response.data;
}

export { API_BASE_URL, axiosClient };
