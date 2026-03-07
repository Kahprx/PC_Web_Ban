import { Link } from "react-router-dom";
import { formatCurrency } from "../../data/storeData";
import "../shared/PageBlocks.css";

const orders = [
  {
    id: "100901",
    date: "2026-03-07",
    total: 39_990_000,
    payment: "COD",
    items: 3,
    status: "Dang xu ly",
    badge: "warning",
    note: "Don dang doi CSKH goi xac nhan va chot khung gio giao.",
  },
  {
    id: "100845",
    date: "2026-03-04",
    total: 22_490_000,
    payment: "Chuyen khoan",
    items: 2,
    status: "Dang giao",
    badge: "info",
    note: "Don da roi kho va dang duoc shipper giao trong ngay.",
  },
  {
    id: "100732",
    date: "2026-02-28",
    total: 58_700_000,
    payment: "COD",
    items: 4,
    status: "Hoan tat",
    badge: "success",
    note: "Da giao thanh cong. Co the danh gia lai trai nghiem mua hang.",
  },
];

export default function OrderHistory() {
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const activeOrders = orders.filter((order) => order.badge !== "success").length;

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Order center</p>
          <h1 className="page-title">Theo doi don hang theo dang card thay vi chi co mot bang khong.</h1>
          <p className="page-subtitle">
            Trang lich su don duoc doi sang bo cuc co tong quan nhanh, card trang thai
            va CTA ro rang de ban xem lai tung don ma khong bi nho chi tiet.
          </p>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
          <p>Tong so don</p>
          <strong>{orders.length}</strong>
          <span>Da bao gom don dang xu ly, dang giao va da hoan tat.</span>
        </article>
        <article className="page-highlight-card">
          <p>Don dang mo</p>
          <strong>{activeOrders}</strong>
          <span>Can theo doi thong tin goi xac nhan va giao van.</span>
        </article>
        <article className="page-highlight-card">
          <p>Tong chi tieu</p>
          <strong>{formatCurrency(totalSpent)}</strong>
          <span>Gia tri tam tinh tu cac don dang hien trong lich su demo.</span>
        </article>
      </section>

      <section className="page-order-grid">
        {orders.map((order) => (
          <article key={order.id} className="page-order-card">
            <div className="page-order-head">
              <div>
                <h3>Don hang #{order.id}</h3>
                <p>{order.note}</p>
              </div>
              <span className={`page-badge ${order.badge}`}>{order.status}</span>
            </div>

            <div className="page-meta-grid" style={{ marginTop: "14px" }}>
              <article className="page-meta-card">
                <p>Ngay tao</p>
                <strong>{order.date}</strong>
                <span>Tao tu kenh website.</span>
              </article>
              <article className="page-meta-card">
                <p>Tong tien</p>
                <strong>{formatCurrency(order.total)}</strong>
                <span>Gia tri don hang hien tai.</span>
              </article>
              <article className="page-meta-card">
                <p>Thanh toan</p>
                <strong>{order.payment}</strong>
                <span>Cap nhat theo trang thai doi soat.</span>
              </article>
              <article className="page-meta-card">
                <p>So mon</p>
                <strong>{order.items}</strong>
                <span>San pham / phu kien trong don.</span>
              </article>
            </div>

            <div className="page-actions" style={{ marginTop: "14px" }}>
              <Link to={`/orders/${order.id}`} className="page-btn">
                Xem chi tiet
              </Link>
              <button type="button" className="page-btn-outline">
                Lien he CSKH
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
