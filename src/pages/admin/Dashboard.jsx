import { Link } from "react-router-dom";
import { formatCurrency } from "../../data/storeData";
import "./AdminPages.css";

const overviewCards = [
  {
    label: "Don cho xu ly",
    value: "24",
    note: "Can goi lai xac nhan trong khung sang nay.",
  },
  {
    label: "Doanh thu tam tinh",
    value: formatCurrency(146_500_000),
    note: "Tong hop tu don website, showroom va sale tu van.",
  },
  {
    label: "Khach moi",
    value: "12",
    note: "Tai khoan dang ky moi trong 24 gio qua.",
  },
  {
    label: "SKU can canh bao",
    value: "8",
    note: "Can xem lai ton kho, gia va lich nhap hang.",
  },
];

const performanceRows = [
  { label: "PC gaming", value: "68%", detail: "Kenh website chot nhanh nhat trong ngay." },
  { label: "Monitor", value: "51%", detail: "Ty le upsell cao khi di kem bo may." },
  { label: "Gear / accessories", value: "39%", detail: "Can day them bundle va combo." },
  { label: "Build custom", value: "73%", detail: "Khach de convert khi co tu van cau hinh." },
];

const stockAlerts = [
  {
    title: "RTX 5070 / 5080 dang tang view",
    text: "Nen day len block banner va uu tien team sale callback.",
  },
  {
    title: "Nhom ban phim HE ton kho mong",
    text: "Can check lai toc do quay kho truoc cuoi tuan.",
  },
  {
    title: "Monitor 2K 240Hz dang rat tot",
    text: "Co the dua them vao combo build PC de tang AOV.",
  },
];

const recentOrders = [
  {
    id: "100901",
    customer: "Nguyen Van A",
    status: "pending",
    total: 39_990_000,
    note: "Khach mua bo may + chuot, dang doi xac nhan gio giao.",
  },
  {
    id: "100898",
    customer: "Tran Minh K",
    status: "shipping",
    total: 17_490_000,
    note: "Monitor da xuat kho, shipper giao trong khung 14h - 18h.",
  },
  {
    id: "100889",
    customer: "Le Quoc P",
    status: "done",
    total: 58_700_000,
    note: "Don workstation da giao xong va CSKH dang xin feedback.",
  },
];

export default function Dashboard() {
  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-header">
          <div>
            <p className="admin-kicker">Admin overview</p>
            <h1>Dashboard duoc doi sang dang operations board de doc nhanh hon.</h1>
            <p>
              Trang tong quan moi nhan vao KPI, order flow va canh bao kho thay vi
              chi dung mot bang placeholder. Muc tieu la de nguoi quan tri vao la
              biet ngay hom nay can xu ly gi.
            </p>
          </div>

          <div className="admin-hero-actions">
            <Link to="/admin/orders" className="admin-link-button">
              Mo quan ly don hang
            </Link>
            <Link to="/admin/products" className="admin-link-button-outline">
              Xem ton kho / san pham
            </Link>
          </div>
        </div>
      </section>

      <section className="admin-overview-grid">
        {overviewCards.map((card) => (
          <article key={card.label} className="admin-overview-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.note}</span>
          </article>
        ))}
      </section>

      <section className="admin-insight-grid">
        <article className="admin-surface">
          <div className="admin-surface-head">
            <div>
              <p className="admin-kicker">Performance</p>
              <h2>Ty trong quan tam theo nhom hang</h2>
            </div>
            <span className="admin-chip is-active">Live snapshot</span>
          </div>

          <div className="admin-bar-list" style={{ marginTop: "14px" }}>
            {performanceRows.map((row) => (
              <div key={row.label} className="admin-bar-row">
                <strong>{row.label}</strong>
                <span>{row.detail}</span>
                <div className="admin-bar-track">
                  <div className="admin-bar-fill" style={{ width: row.value }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-surface">
          <div className="admin-surface-head">
            <div>
              <p className="admin-kicker">Alerts</p>
              <h2>Canh bao can chu y</h2>
            </div>
          </div>

          <div className="admin-alert-list" style={{ marginTop: "14px" }}>
            {stockAlerts.map((alert) => (
              <article key={alert.title} className="admin-alert-item">
                <strong>{alert.title}</strong>
                <p>{alert.text}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-surface">
        <div className="admin-surface-head">
          <div>
            <p className="admin-kicker">Recent orders</p>
            <h2>Don moi nhat can theo doi</h2>
          </div>
          <Link to="/admin/orders" className="admin-link-button-outline">
            Xem tat ca
          </Link>
        </div>

        <div className="admin-recent-grid" style={{ marginTop: "14px" }}>
          {recentOrders.map((order) => (
            <article key={order.id} className="admin-recent-card">
              <div className="admin-recent-head">
                <div>
                  <h3>Don #{order.id}</h3>
                  <p>{order.note}</p>
                </div>
                <span className={`admin-status ${order.status}`}>
                  {order.status === "pending" && "Chờ xử lý"}
                  {order.status === "shipping" && "Đang giao"}
                  {order.status === "done" && "Hoàn tất"}
                </span>
              </div>

              <div className="admin-meta-grid" style={{ marginTop: "12px" }}>
                <article className="admin-meta-card">
                  <p>Khach hang</p>
                  <strong>{order.customer}</strong>
                  <span>Khach tu website.</span>
                </article>
                <article className="admin-meta-card">
                  <p>Tong tien</p>
                  <strong>{formatCurrency(order.total)}</strong>
                  <span>Gia tri tam tinh cua don.</span>
                </article>
                <article className="admin-meta-card">
                  <p>Trang thai</p>
                  <strong>
                    {order.status === "pending"
                      ? "Dang doi xac nhan"
                      : order.status === "shipping"
                        ? "Dang giao"
                        : "Da hoan tat"}
                  </strong>
                  <span>Can tiep tuc theo doi neu chua giao xong.</span>
                </article>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
