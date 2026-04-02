import { Link, useLocation } from "react-router-dom";
import { formatVnd } from "../../utils/currency";
import "../shared/PageBlocks.css";

export default function Confirm() {
  const location = useLocation();
  const order = location.state?.order || null;

  const orderCode = order ? `ORDER-${order.id}` : "ORDER-N/A";
  const items = order?.items || [];
  const total = Number(order?.total_amount || 0);

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Order placed</p>
          <h1 className="page-title">Don hang da duoc tao thanh cong.</h1>
          <p className="page-subtitle">Ban co the theo doi trang thai don hang tai trang lich su don hang.</p>

          <div className="page-hero-actions">
            <span className="page-inline-code">{orderCode}</span>
            <Link to="/orders" className="page-btn">
              Xem lich su don hang
            </Link>
            <Link to="/products" className="page-btn-outline">
              Tiep tuc mua hang
            </Link>
          </div>
        </div>
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Order snapshot</p>
                <h2>Thong tin don hang</h2>
              </div>
            </div>

            <div className="page-meta-grid" style={{ marginTop: "14px" }}>
              <article className="page-meta-card">
                <p>Ma don</p>
                <strong>{orderCode}</strong>
              </article>
              <article className="page-meta-card">
                <p>Tong thanh toan</p>
                <strong>{formatVnd(total)}</strong>
              </article>
              <article className="page-meta-card">
                <p>Thanh toan</p>
                <strong>{order?.payment_method || "cod"}</strong>
              </article>
              <article className="page-meta-card">
                <p>Trang thai</p>
                <strong>{order?.status || "pending"}</strong>
              </article>
            </div>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Items</p>
                <h2>San pham trong don</h2>
              </div>
            </div>

            <div className="page-item-list" style={{ marginTop: "14px" }}>
              {items.length === 0 ? <p>Khong co item de hien thi.</p> : null}

              {items.map((item) => (
                <article key={item.id} className="page-item-row">
                  <div>
                    <h3>{item.product_name}</h3>
                    <p>So luong: {item.quantity}</p>
                  </div>

                  <div className="page-item-side">
                    <strong>{formatVnd(Number(item.line_total || 0))}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
