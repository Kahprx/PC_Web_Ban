import { apiRequest } from "./apiClient";

export async function submitContactApi(payload) {
  return apiRequest("/api/contact", {
    method: "POST",
    body: payload,
  });
}

