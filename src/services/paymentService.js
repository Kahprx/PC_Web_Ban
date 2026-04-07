import { apiRequest } from "./apiClient";

export async function createOrderPayment(payload, token) {
  return apiRequest("/api/payments", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function fetchOrderPaymentStatus(orderId, token) {
  return apiRequest(`/api/payments/order/${orderId}`, {
    method: "GET",
    token,
  });
}

export async function confirmOrderPaymentDemo(orderId, method, token) {
  return apiRequest(`/api/payments/order/${orderId}/confirm-demo`, {
    method: "POST",
    token,
    body: {
      orderId,
      method,
    },
  });
}
