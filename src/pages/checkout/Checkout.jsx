import { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { clearCartApi, fetchCart } from "../../services/cartService";
import { createOrder } from "../../services/orderService";
import { createOrderPayment } from "../../services/paymentService";
import { updateProfileApi } from "../../services/authService";
import { toAbsoluteImageUrl } from "../../services/productService";
import { formatVnd } from "../../utils/currency";
import { notifyError, notifySuccess } from "../../utils/notify";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_METHOD_VALUES } from "../../utils/payment";
import "../shared/PageBlocks.css";

const DEFAULT_PRODUCT_IMAGE = "/vite.svg";
const ONLINE_PAYMENT_METHODS = new Set(["momo", "banking", "card", "installment"]);

const toSafeImage = (value) => {
  const raw = String(value || "").trim();
  return toAbsoluteImageUrl(raw) || DEFAULT_PRODUCT_IMAGE;
};

const CheckoutSchema = Yup.object({
  fullName: Yup.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự").required("Vui lòng nhập họ tên"),
  phone: Yup.string()
    .trim()
    .matches(/^(0|\+84)[0-9]{9,10}$/, "Số điện thoại không hợp lệ")
    .required("Vui lòng nhập số điện thoại"),
  email: Yup.string().trim().email("Email không hợp lệ").required("Vui lòng nhập email"),
  shippingAddress: Yup.string()
    .trim()
    .min(10, "Địa chỉ nhận hàng cần ít nhất 10 ký tự")
    .required("Vui lòng nhập địa chỉ nhận hàng"),
  paymentMethod: Yup.string().oneOf(PAYMENT_METHOD_VALUES).required("Vui lòng chọn phương thức thanh toán"),
});

const mapApiCartItems = (items = []) =>
  items.map((item) => ({
    id: item.id ?? item.cart_item_id ?? item.product_id,
    productId: item.product_id ?? item.productId ?? item.id,
    name: item.product_name ?? item.name ?? `Sản phẩm #${item.product_id || ""}`,
    image: toSafeImage(item.image_url || item.image || ""),
    price: Number(item.price ?? item.unit_price ?? 0),
    qty: Number(item.quantity ?? item.qty ?? 1),
  }));

export default function Checkout() {
  const navigate = useNavigate();
  const { token, session, refreshProfile } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const isGuest = !token;

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const data = await fetchCart(token);
        setItems(mapApiCartItems(data));
      } catch (error) {
        notifyError(error, "Không thể tải giỏ hàng");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [token]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0),
    [items]
  );
  const shippingFee = subtotal >= 30_000_000 ? 0 : items.length > 0 ? 45_000 : 0;
  const total = subtotal + shippingFee;

  const orderItems = items.map((item) => ({
    productId: item.productId,
    quantity: item.qty,
  }));

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Checkout Workspace</p>
          <h1 className="page-title">Xác nhận thông tin và đặt hàng.</h1>
          <p className="page-subtitle">
            {isGuest
              ? "Bạn đang checkout ở chế độ khách. Với thanh toán online, vui lòng đăng nhập để hệ thống nhận callback ngân hàng chính xác."
              : "Đơn hàng sẽ đồng bộ qua backend API và cập nhật trạng thái thanh toán theo thời gian thực."}
          </p>

          <div className="page-hero-actions">
            <span className="page-inline-code">{isGuest ? "Guest checkout" : "Checkout API"}</span>
            <Link to="/cart" className="page-btn-outline">
              Quay lại giỏ hàng
            </Link>
          </div>
        </div>
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Shipping Profile</p>
                <h2>Thông tin nhận hàng</h2>
              </div>
            </div>

            <Formik
              initialValues={{
                fullName: session?.name || "",
                phone: session?.phone || "",
                email: session?.email || "",
                shippingAddress: session?.defaultShippingAddress || "",
                paymentMethod: "cod",
              }}
              validationSchema={CheckoutSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  if (orderItems.length === 0) {
                    throw new Error("Giỏ hàng đang trống");
                  }

                  const shippingAddress = `${values.fullName} - ${values.phone} - ${values.shippingAddress}`;
                  const paymentMethod = String(values.paymentMethod || "cod").toLowerCase();
                  const isOnlinePayment = ONLINE_PAYMENT_METHODS.has(paymentMethod);

                  if (!token && isOnlinePayment) {
                    throw new Error("Thanh toán online cần đăng nhập để hệ thống xác nhận giao dịch từ ngân hàng.");
                  }

                  if (!token) {
                    const localOrder = {
                      id: `GUEST-${Date.now()}`,
                      total_amount: total,
                      payment_method: paymentMethod,
                      payment_status: "cod_confirmed",
                      status: "processing",
                      shipping_address: shippingAddress,
                      items: items.map((item, index) => ({
                        id: `guest-item-${index + 1}`,
                        product_id: item.productId,
                        product_name: item.name,
                        image_url: item.image,
                        quantity: item.qty,
                        unit_price: Number(item.price || 0),
                        line_total: Number(item.price || 0) * Number(item.qty || 0),
                      })),
                    };

                    await clearCartApi();
                    setItems([]);
                    notifySuccess("Đặt hàng thành công (khách)");
                    navigate(`/confirm?orderId=${encodeURIComponent(localOrder.id)}`, {
                      replace: true,
                      state: { order: localOrder },
                    });
                    return;
                  }

                  try {
                    await updateProfileApi(
                      {
                        fullName: values.fullName,
                        email: values.email,
                        phone: values.phone,
                        defaultShippingAddress: values.shippingAddress,
                      },
                      token
                    );
                    await refreshProfile();
                  } catch (profileError) {
                    notifyError(profileError, "Không thể lưu hồ sơ, hệ thống vẫn tiếp tục tạo đơn");
                  }

                  const result = await createOrder(
                    {
                      items: orderItems,
                      shippingAddress,
                      paymentMethod,
                    },
                    token
                  );

                  const orderFromApi = result?.data || null;

                  if (orderFromApi?.id && isOnlinePayment) {
                    try {
                      await createOrderPayment(
                        {
                          orderId: orderFromApi.id,
                          method: paymentMethod,
                        },
                        token
                      );
                    } catch {
                      // Bỏ qua lỗi tạo payment pending nếu đã tồn tại.
                    }
                  }

                  await clearCartApi(token);
                  setItems([]);
                  notifySuccess("Đã tạo đơn hàng thành công");
                  navigate(`/confirm?orderId=${encodeURIComponent(orderFromApi?.id || "")}`, {
                    replace: true,
                    state: {
                      order: orderFromApi,
                    },
                  });
                } catch (error) {
                  notifyError(error, "Đặt hàng thất bại");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting, values, setFieldValue }) => (
                <Form className="page-form">
                  <div className="page-form-grid">
                    <div className="page-field">
                      <label>Họ và tên</label>
                      <Field name="fullName" type="text" placeholder="Nguyễn Văn A" />
                      <ErrorMessage name="fullName" component="div" className="auth-note is-error" />
                    </div>

                    <div className="page-field">
                      <label>Số điện thoại</label>
                      <Field name="phone" type="text" placeholder="09xxxxxxxx" />
                      <ErrorMessage name="phone" component="div" className="auth-note is-error" />
                    </div>

                    <div className="page-field">
                      <label>Email liên hệ</label>
                      <Field name="email" type="email" placeholder="you@example.com" />
                      <ErrorMessage name="email" component="div" className="auth-note is-error" />
                    </div>

                    <div className="page-field full">
                      <label>Thanh toán</label>
                      <div className="page-payment-grid">
                        {PAYMENT_METHOD_OPTIONS.map((method) => {
                          const disabledForGuest = isGuest && method.value !== "cod";
                          return (
                            <label
                              key={method.value}
                              className={`page-payment-option ${values.paymentMethod === method.value ? "is-active" : ""}`}
                              style={disabledForGuest ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                            >
                              <input
                                type="radio"
                                name="paymentMethod"
                                value={method.value}
                                checked={values.paymentMethod === method.value}
                                onChange={() => {
                                  if (!disabledForGuest) {
                                    setFieldValue("paymentMethod", method.value);
                                  }
                                }}
                                disabled={disabledForGuest}
                              />
                              <span>{method.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      {isGuest ? (
                        <p style={{ margin: 0, fontSize: "12px", color: "#8a5b12" }}>
                          Thanh toán online chỉ mở cho tài khoản đăng nhập để nhận callback ngân hàng tự động.
                        </p>
                      ) : null}
                      <ErrorMessage name="paymentMethod" component="div" className="auth-note is-error" />
                    </div>

                    <div className="page-field full">
                      <label>Địa chỉ nhận hàng</label>
                      <Field as="textarea" rows={3} name="shippingAddress" placeholder="Số nhà, quận/huyện, tỉnh/thành" />
                      <ErrorMessage name="shippingAddress" component="div" className="auth-note is-error" />
                    </div>
                  </div>

                  <div className="page-actions" style={{ marginTop: "14px" }}>
                    <button type="submit" className="page-btn" disabled={isSubmitting || loading || items.length === 0}>
                      {isSubmitting ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </section>
        </div>

        <aside className="page-stack">
          <section className="page-summary-card">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Order Summary</p>
                <h2>Đơn hàng</h2>
              </div>
            </div>

            {loading ? <p>Đang tải giỏ hàng...</p> : null}

            <div className="page-item-list" style={{ marginTop: "14px" }}>
              {items.map((item) => (
                <article key={item.id} className="page-item-row">
                  <div className="page-item-thumb">
                    <img
                      src={item.image || DEFAULT_PRODUCT_IMAGE}
                      alt={item.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                  </div>

                  <div className="page-item-main">
                    <h3>{item.name}</h3>
                    <p>Số lượng: {item.qty}</p>
                  </div>

                  <div className="page-item-side">
                    <strong>{formatVnd(item.price * item.qty)}</strong>
                  </div>
                </article>
              ))}
            </div>

            <div className="page-summary-list" style={{ marginTop: "14px" }}>
              <div className="page-summary-line">
                <p>Tạm tính</p>
                <span>{formatVnd(subtotal)}</span>
              </div>
              <div className="page-summary-line">
                <p>Vận chuyển</p>
                <span>{shippingFee === 0 ? "Miễn phí" : formatVnd(shippingFee)}</span>
              </div>
            </div>

            <div className="page-summary-total">
              <p>Tổng thanh toán</p>
              <strong>{formatVnd(total)}</strong>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
