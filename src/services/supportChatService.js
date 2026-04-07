import { apiRequest } from "./apiClient";

export async function createSupportChatSessionApi(sessionId = "") {
  return apiRequest("/api/support-chat/session", {
    method: "POST",
    body: { sessionId },
  });
}

export async function fetchSupportChatMessagesApi(sessionId) {
  return apiRequest(`/api/support-chat/messages/${encodeURIComponent(String(sessionId || "").trim())}`, {
    method: "GET",
  });
}

export async function sendSupportChatMessageApi({ sessionId, message, name, email }) {
  return apiRequest("/api/support-chat/messages", {
    method: "POST",
    body: {
      sessionId,
      message,
      name,
      email,
    },
  });
}

const toQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
};

export async function fetchAdminSupportSessionsApi(token, params = {}) {
  return apiRequest(`/api/support-chat/admin/sessions${toQuery(params)}`, {
    method: "GET",
    token,
  });
}

export async function fetchAdminSupportMessagesApi(sessionId, token) {
  return apiRequest(`/api/support-chat/admin/messages/${encodeURIComponent(String(sessionId || "").trim())}`, {
    method: "GET",
    token,
  });
}

export async function sendAdminSupportMessageApi({ sessionId, message }, token) {
  return apiRequest("/api/support-chat/admin/messages", {
    method: "POST",
    token,
    body: { sessionId, message },
  });
}
