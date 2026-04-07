import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchMyOrderById } from "../../services/orderService";
import { toAbsoluteImageUrl } from "../../services/productService";
import { formatVnd } from "../../utils/currency";
import { notifyError } from "../../utils/notify";
import { toPaymentMethodLabel } from "../../utils/payment";
import "../shared/PageBlocks.css";

const DEFAULT_PRODUCT_IMAGE = "/vite.svg";
const SUCCESS_PAYMENT_STATUS = new Set(["paid", "success", "completed", "succeeded", "cod_confirmed"]);
const SUCCESS_ORDER_STATUS = new Set(["confirmed", "shipping", "completed"]);

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const parseShippingAddress = (rawAddress = "") => {
  const raw = String(rawAddress || "").trim();
  if (!raw) {
    return { fullName: "-", phone: "-", address: "-" };
  }

  const parts = raw.split(" - ").map((item) => item.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return {
      fullName: parts[0],
      phone: parts[1],
      address: parts.slice(2).join(" - "),
    };
  }

  return {
    fullName: "-",
    phone: "-",
    address: raw,
  };
};

const buildSteps = ({ orderStatus, paymentDone }) => {
  const isPacked = ["confirmed", "shipping", "completed"].includes(orderStatus);
  const isShipping = ["shipping", "completed"].includes(orderStatus);
  const isCompleted = orderStatus === "completed";

  return [
    {
      id: "received",
      title: "Tiếp nhận đơn",
      text: "Đơn hàng đã được tạo trên hệ thống.",
      active: true,
    },
    {
      id: "payment",
      title: "Xác nhận thanh toán",
      text: paymentDone ? "Thanh toán đã được xác nhận." : "Đang chờ xác nhận từ hệ thống thanh toán.",
      active: paymentDone,
    },
    {
      id: "pack",
      title: "Đóng gói",
      text: isPacked ? "Kho đang chuẩn bị đơn hàng." : "Sẽ đóng gói ngay sau khi thanh toán xác nhận.",
      active: isPacked,
    },
    {
      id: "ship",
      title: "Giao hàng",
      text: isCompleted ? "Đơn đã giao thành công." : isShipping ? "Đơn đang trên đường giao." : "Chưa bàn giao cho đơn vị vận chuyển.",
      active: isShipping || isCompleted,
    },
  ];
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function OrderDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrderDetail = async () => {
      if (!token) {
        setError("Bạn cần đăng nhập để xem chi tiết đơn hàng.");
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await fetchMyOrderById(id, token);
        setOrder(result?.data || null);
      } catch (apiError) {
        const message = apiError?.message || "Không tải được chi tiết đơn hàng.";
        setError(message);
        notifyError(apiError, "Không tải được chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetail();
  }, [id, token]);

  const orderStatus = normalizeText(order?.status || "pending");
  const paymentMethod = normalizeText(order?.payment_method || "cod");
  const paymentStatus = normalizeText(order?.payment_status || (paymentMethod === "cod" ? "cod_confirmed" : "pending"));

  const paymentDone =
    paymentMethod === "cod" || SUCCESS_PAYMENT_STATUS.has(paymentStatus) || SUCCESS_ORDER_STATUS.has(orderStatus);

  const shippingInfo = useMemo(() => parseShippingAddress(order?.shipping_address), [order?.shipping_address]);
  const createdAtText = useMemo(() => {
    const raw = order?.created_at ? new Date(order.created_at) : null;
    if (!raw || Number.isNaN(raw.getTime())) return "-";
    return raw.toLocaleString("vi-VN");
  }, [order?.created_at]);

  const items = useMemo(
    () =>
      (Array.isArray(order?.items) ? order.items : []).map((item, index) => {
        const quantity = Math.max(1, toSafeNumber(item?.quantity, 1));
        const unitPrice = toSafeNumber(item?.unit_price, 0);
        const lineTotalRaw = toSafeNumber(item?.line_total, NaN);
        const lineTotal = Number.isFinite(lineTotalRaw) ? lineTotalRaw : unitPrice * quantity;
        const image = toAbsoluteImageUrl(item?.image_url || "") || DEFAULT_PRODUCT_IMAGE;
        return {
          id: item?.id ?? `order-item-${index + 1}`,
          name: item?.product_name || `Sản phẩm #${index + 1}`,
          quantity,
          unitPrice,
          lineTotal,
          image,
        };
      }),
    [order?.items]
  );

  const total = toSafeNumber(order?.total_amount, 0);
  const shippingFee = total >= 30_000_000 ? 0 : items.length > 0 ? 45_000 : 0;
  const grandTotal = total + shippingFee;
  const steps = buildSteps({ orderStatus, paymentDone });

  if (loading) {
    return (
      <div className="page-shell">
        <section className="page-panel">
          <p>Đang tải chi tiết đơn hàng...</p>
        </section>
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="page-shell">
        <section className="page-panel">
          <h2 style={{ marginTop: 0 }}>Không lấy được dữ liệu đơn hàng</h2>
          <p style={{ marginBottom: 0 }}>{error || "Đơn hàng không tồn tại hoặc bạn không có quyền truy cập."}</p>

          <div className="page-actions" style={{ marginTop: "14px" }}>
            <Link to="/orders" className="page-btn-outline">
              Quay lại lịch sử đơn hàng
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Order detail</p>
          <h1 className="page-title">Chi tiết đơn #{order.id} theo dữ liệu backend.</h1>
          <p className="page-subtitle">Trạng thái, thanh toán, giao nhận và sản phẩm đều lấy trực tiếp từ API.</p>

          <div className="page-hero-actions">
            <span className={`page-badge ${paymentDone ? "success" : "warning"}`}>
              {paymentDone ? "Đã xác nhận" : "Chờ xác nhận"}
            </span>
            <Link to="/orders" className="page-btn-outline">
              Quay lại lịch sử
            </Link>
          </div>
        </div>
      </section>

      <section className="page-progress">
        {steps.map((step, index) => (
          <article key={step.id} className={`page-progress-step ${step.active ? "is-active" : ""}`}>
            <strong>{index + 1}</strong>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Items</p>
                <h2>Sản phẩm trong đơn</h2>
              </div>
            </div>

            <div className="page-item-list" style={{ marginTop: "14px" }}>
              {items.map((item) => (
                <article key={item.id} className="page-item-row">
                  <div className="page-item-thumb">
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                  </div>

                  <div>
                    <h3>{item.name}</h3>
                    <p>Số lượng: {item.quantity}</p>
                    <p>Đơn giá: {formatVnd(item.unitPrice)}</p>
                  </div>

                  <div className="page-item-side">
                    <strong>{formatVnd(item.lineTotal)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Payment summary</p>
                <h2>Tổng kết thanh toán</h2>
              </div>
            </div>

            <div className="page-summary-list" style={{ marginTop: "14px" }}>
              <div className="page-summary-line">
                <p>Tạm tính sản phẩm</p>
                <span>{formatVnd(total)}</span>
              </div>
              <div className="page-summary-line">
                <p>Vận chuyển</p>
                <span>{shippingFee === 0 ? "Miễn phí" : formatVnd(shippingFee)}</span>
              </div>
              <div className="page-summary-line">
                <p>Phương thức thanh toán</p>
                <span>{toPaymentMethodLabel(paymentMethod)}</span>
              </div>
              <div className="page-summary-line">
                <p>Trạng thái thanh toán</p>
                <span>{paymentDone ? "Đã xác nhận" : "Chờ xác nhận"}</span>
              </div>
            </div>

            <div className="page-summary-total">
              <p>Tổng cộng</p>
              <strong>{formatVnd(grandTotal)}</strong>
              <span>Trạng thái đơn hàng: {order.status || "pending"}</span>
            </div>
          </section>
        </div>

        <aside className="page-stack">
          <section className="page-summary-card">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Delivery info</p>
                <h2>Thông tin giao nhận</h2>
              </div>
            </div>

            <div className="page-checklist" style={{ marginTop: "14px" }}>
              <div className="page-checklist-row">
                <p>Mã đơn</p>
                <span>#{order.id}</span>
              </div>
              <div className="page-checklist-row">
                <p>Người nhận</p>
                <span>{shippingInfo.fullName}</span>
              </div>
              <div className="page-checklist-row">
                <p>Số điện thoại</p>
                <span>{shippingInfo.phone}</span>
              </div>
              <div className="page-checklist-row">
                <p>Ngày tạo</p>
                <span>{createdAtText}</span>
              </div>
              <div className="page-checklist-row">
                <p>Địa chỉ giao</p>
                <span>{shippingInfo.address}</span>
              </div>
            </div>
          </section>

          <section className="page-support-card">
            <h2 className="page-title">Cần hỗ trợ thêm?</h2>
            <p className="page-subtitle">
              Nếu đơn chưa giao, bạn có thể liên hệ hotline để cập nhật ghi chú hoặc thông tin nhận hàng.
            </p>

            <div className="page-actions" style={{ marginTop: "14px" }}>
              <Link to="/profile" className="page-btn-outline">
                Cập nhật thông tin nhận hàng
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
