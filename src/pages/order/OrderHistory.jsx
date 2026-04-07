import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchMyOrders } from "../../services/orderService";
import { notifyError } from "../../utils/notify";
import { formatVnd } from "../../utils/currency";
import { toPaymentMethodLabel } from "../../utils/payment";
import "../shared/PageBlocks.css";

const ORDER_STATUS_ALIAS = {
  confirmed: "processing",
};

const ORDER_STATUS_LABEL = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const ORDER_TRACK_STEPS = [
  {
    key: "pending",
    title: "Đã đặt",
    text: "Đơn đã được tạo.",
  },
  {
    key: "processing",
    title: "Đang xử lý",
    text: "Shop đang chuẩn bị hàng.",
  },
  {
    key: "shipping",
    title: "Đang giao",
    text: "Đơn đang vận chuyển.",
  },
  {
    key: "completed",
    title: "Hoàn tất",
    text: "Đơn giao thành công.",
  },
];

const normalizeStatus = (value = "") => {
  const raw = String(value || "").trim().toLowerCase();
  return ORDER_STATUS_ALIAS[raw] || raw;
};

const toOrderStatusLabel = (status = "") => ORDER_STATUS_LABEL[normalizeStatus(status)] || String(status || "pending");

const badgeByStatus = (status = "") => {
  const normalized = normalizeStatus(status);
  if (normalized === "completed") return "success";
  if (normalized === "pending") return "warning";
  if (normalized === "cancelled") return "danger";
  return "info";
};

const buildTracking = (status = "") => {
  const normalized = normalizeStatus(status);
  const isCancelled = normalized === "cancelled";
  const index = ORDER_TRACK_STEPS.findIndex((step) => step.key === normalized);
  const activeIndex = index >= 0 ? index : 0;

  const steps = ORDER_TRACK_STEPS.map((step, stepIndex) => {
    const isDone = !isCancelled && stepIndex < activeIndex;
    const isCurrent = !isCancelled && stepIndex === activeIndex;

    return {
      ...step,
      isDone,
      isCurrent,
    };
  });

  return {
    isCancelled,
    steps,
    note: isCancelled
      ? "Đơn hàng đã bị hủy. Nếu cần hỗ trợ, vui lòng liên hệ bộ phận chăm sóc khách hàng."
      : `Trạng thái hiện tại: ${toOrderStatusLabel(normalized)}`,
  };
};

export default function OrderHistory() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const result = await fetchMyOrders(token, { page: 1, limit: 20 });
        setOrders(result?.data || []);
      } catch (error) {
        notifyError(error, "Không tải được lịch sử đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [token]);

  const totalSpent = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
    [orders]
  );

  const activeOrders = useMemo(
    () =>
      orders.filter((order) => {
        const normalized = normalizeStatus(order.status);
        return normalized !== "completed" && normalized !== "cancelled";
      }).length,
    [orders]
  );

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Order center</p>
          <h1 className="page-title">Theo dõi đơn hàng theo dữ liệu API.</h1>
          <p className="page-subtitle">Lịch sử đơn hàng đã kết nối backend theo đúng tài khoản người dùng.</p>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
          <p>Tổng số đơn</p>
          <strong>{orders.length}</strong>
        </article>
        <article className="page-highlight-card">
          <p>Đơn đang mở</p>
          <strong>{activeOrders}</strong>
        </article>
        <article className="page-highlight-card">
          <p>Tổng chi tiêu</p>
          <strong>{formatVnd(totalSpent)}</strong>
        </article>
      </section>

      {loading ? (
        <section className="page-panel">
          <p>Đang tải dữ liệu...</p>
        </section>
      ) : null}

      <section className="page-order-grid">
        {!loading && orders.length === 0 ? <p>Chưa có đơn hàng nào.</p> : null}

        {orders.map((order) => {
          const tracking = buildTracking(order.status);

          return (
            <article key={order.id} className="page-order-card">
              <div className="page-order-head">
                <div>
                  <h3>Đơn hàng #{order.id}</h3>
                  <p>{order.shipping_address}</p>
                </div>
                <span className={`page-badge ${badgeByStatus(order.status)}`}>{toOrderStatusLabel(order.status)}</span>
              </div>

              <div className="page-meta-grid" style={{ marginTop: "14px" }}>
                <article className="page-meta-card">
                  <p>Ngày tạo</p>
                  <strong>{new Date(order.created_at).toLocaleDateString("vi-VN")}</strong>
                </article>
                <article className="page-meta-card">
                  <p>Tổng tiền</p>
                  <strong>{formatVnd(order.total_amount)}</strong>
                </article>
                <article className="page-meta-card">
                  <p>Thanh toán</p>
                  <strong>{toPaymentMethodLabel(order.payment_method)}</strong>
                </article>
                <article className="page-meta-card">
                  <p>Trạng thái</p>
                  <strong>{toOrderStatusLabel(order.status)}</strong>
                </article>
              </div>

              <section className="page-tracking">
                <div className="page-tracking-head">
                  <p>Theo dõi đơn hàng</p>
                  <span className={`page-badge ${tracking.isCancelled ? "danger" : "info"}`}>
                    {tracking.isCancelled ? "Đã hủy" : toOrderStatusLabel(order.status)}
                  </span>
                </div>

                <div className="page-tracking-flow">
                  {tracking.steps.map((step) => (
                    <article
                      key={`${order.id}-${step.key}`}
                      className={`page-track-node ${step.isDone ? "is-done" : ""} ${step.isCurrent ? "is-current" : ""}`}
                    >
                      <div className="page-track-dot" />
                      <div className="page-track-copy">
                        <strong>{step.title}</strong>
                        <span>{step.text}</span>
                      </div>
                    </article>
                  ))}
                </div>

                <p className="page-track-note">{tracking.note}</p>
              </section>

              <div className="page-actions" style={{ marginTop: "14px" }}>
                <Link to={`/orders/${order.id}`} className="page-btn">
                  Xem chi tiết
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
