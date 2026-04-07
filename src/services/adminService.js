import { apiRequest } from "./apiClient";

const toQuery = (params = {}) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      search.append(k, String(v));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
};

export async function fetchAdminUsersApi(token, params = {}) {
  return apiRequest(`/api/admin/users${toQuery(params)}`, {
    method: "GET",
    token,
  });
}

export async function createAdminUserApi(payload, token) {
  return apiRequest("/api/admin/users", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function updateAdminUserRoleApi(userId, role, token) {
  return apiRequest(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    token,
    body: { role },
  });
}

export async function updateAdminUserActiveApi(userId, isActive, token) {
  return apiRequest(`/api/admin/users/${userId}/active`, {
    method: "PATCH",
    token,
    body: { isActive },
  });
}
