export const PAYMENT_METHOD_OPTIONS = [
  { value: "cod", label: "Thanh toán khi nhận hàng (COD)" },
  { value: "banking", label: "Chuyển khoản ngân hàng" },
  { value: "card", label: "Thẻ tín dụng / ghi nợ" },
  { value: "momo", label: "Ví MoMo" },
  { value: "installment", label: "Trả góp 0%" },
];

export const PAYMENT_METHOD_VALUES = PAYMENT_METHOD_OPTIONS.map((item) => item.value);

const PAYMENT_METHOD_LABEL_MAP = PAYMENT_METHOD_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export const toPaymentMethodLabel = (value) => {
  const key = String(value || "").trim().toLowerCase();
  return PAYMENT_METHOD_LABEL_MAP[key] || String(value || "cod").toUpperCase();
};
