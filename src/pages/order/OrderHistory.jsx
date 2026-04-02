import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchMyOrders } from "../../services/orderService";
import { notifyError } from "../../utils/notify";
import { formatVnd } from "../../utils/currency";
import "../shared/PageBlocks.css";

const badgeByStatus = (status = "") => {
  if (status === "completed") return "success";
  if (status === "pending") return "warning";
  return "info";
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
        notifyError(error, "Khong tai duoc lich su don hang");
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
    () => orders.filter((order) => String(order.status || "") !== "completed").length,
    [orders]
  );

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Order center</p>
          <h1 className="page-title">Theo doi don hang theo du lieu API.</h1>
          <p className="page-subtitle">Trang lich su don hang da ket noi backend va role user.</p>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
          <p>Tong so don</p>
          <strong>{orders.length}</strong>
        </article>
        <article className="page-highlight-card">
          <p>Don dang mo</p>
          <strong>{activeOrders}</strong>
        </article>
        <article className="page-highlight-card">
          <p>Tong chi tieu</p>
          <strong>{formatVnd(totalSpent)}</strong>
        </article>
      </section>

      {loading ? <section className="page-panel"><p>Dang tai du lieu...</p></section> : null}

      <section className="page-order-grid">
        {!loading && orders.length === 0 ? <p>Chua co don hang nao.</p> : null}

        {orders.map((order) => (
          <article key={order.id} className="page-order-card">
            <div className="page-order-head">
              <div>
                <h3>Don hang #{order.id}</h3>
                <p>{order.shipping_address}</p>
              </div>
              <span className={`page-badge ${badgeByStatus(order.status)}`}>{order.status}</span>
            </div>

            <div className="page-meta-grid" style={{ marginTop: "14px" }}>
              <article className="page-meta-card">
                <p>Ngay tao</p>
                <strong>{new Date(order.created_at).toLocaleDateString("vi-VN")}</strong>
              </article>
              <article className="page-meta-card">
                <p>Tong tien</p>
                <strong>{formatVnd(order.total_amount)}</strong>
              </article>
              <article className="page-meta-card">
                <p>Thanh toan</p>
                <strong>{order.payment_method}</strong>
              </article>
              <article className="page-meta-card">
                <p>Trang thai</p>
                <strong>{order.status}</strong>
              </article>
            </div>

            <div className="page-actions" style={{ marginTop: "14px" }}>
              <Link to={`/orders/${order.id}`} className="page-btn">
                Xem chi tiet
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
