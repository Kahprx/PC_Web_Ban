import { formatCurrency } from "../../data/storeData";
import "./AdminPages.css";

const summaryCards = [
  {
    label: "Don can xu ly ngay",
    value: "9",
    note: "Can chia theo CSKH, kho va giao van.",
  },
  {
    label: "Dang giao",
    value: "14",
    note: "Can theo doi cac moc giao trong 2h / trong ngay.",
  },
  {
    label: "Da hoan tat",
    value: "42",
    note: "Co the day tiep review, upsell va CSKH sau ban.",
  },
];

const orders = [
  {
    id: "100901",
    customer: "Nguyen Van A",
    total: 39_990_000,
    status: "pending",
    note: "Bo PC gaming + chuot. Khach doi giao sau 18h.",
    steps: [
      { id: "received", title: "Tiep nhan", text: "Da tao don.", active: true },
      { id: "verify", title: "Xac nhan", text: "Dang doi goi lai.", active: true },
      { id: "pack", title: "Dong goi", text: "Chua bat dau.", active: false },
      { id: "ship", title: "Giao hang", text: "Cho lich ship.", active: false },
    ],
  },
  {
    id: "100898",
    customer: "Tran Minh K",
    total: 17_490_000,
    status: "shipping",
    note: "Monitor da xuat kho. Don co yeu cau goi truoc khi giao.",
    steps: [
      { id: "received", title: "Tiep nhan", text: "Da tao don.", active: true },
      { id: "verify", title: "Xac nhan", text: "Da xong.", active: true },
      { id: "pack", title: "Dong goi", text: "Da xuat kho.", active: true },
      { id: "ship", title: "Giao hang", text: "Shipper dang giao.", active: true },
    ],
  },
  {
    id: "100889",
    customer: "Le Quoc P",
    total: 58_700_000,
    status: "done",
    note: "Don workstation da giao xong, cho CSKH xin feedback.",
    steps: [
      { id: "received", title: "Tiep nhan", text: "Da tao don.", active: true },
      { id: "verify", title: "Xac nhan", text: "Da xong.", active: true },
      { id: "pack", title: "Dong goi", text: "Da xong.", active: true },
      { id: "ship", title: "Giao hang", text: "Da hoan tat.", active: true },
    ],
  },
];

export default function OrderManager() {
  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-header">
          <div>
            <p className="admin-kicker">Order operations</p>
            <h1>Quan ly don hang theo dang board de de uu tien xu ly.</h1>
            <p>
              Trang nay da duoc doi tu table placeholder sang bo cuc co KPI, chip
              loc va tung order card co progress rieng, de admin nhin la thay ngay
              don nao can cham truoc.
            </p>
          </div>

          <div className="admin-chip-row">
            <span className="admin-chip is-active">Tat ca</span>
            <span className="admin-chip">Cho xu ly</span>
            <span className="admin-chip">Dang giao</span>
            <span className="admin-chip">Da hoan tat</span>
          </div>
        </div>
      </section>

      <section className="admin-overview-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="admin-overview-card">
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.note}</span>
          </article>
        ))}
      </section>

      <section className="admin-manager-grid">
        {orders.map((order) => (
          <article key={order.id} className="admin-order-card">
            <div className="admin-order-head">
              <div>
                <h3>Don #{order.id}</h3>
                <p>{order.customer} - {order.note}</p>
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
                <span>Can kiem tra lai thong tin giao nhan neu don dang mo.</span>
              </article>
              <article className="admin-meta-card">
                <p>Tong tien</p>
                <strong>{formatCurrency(order.total)}</strong>
                <span>Gia tri tam tinh tren don.</span>
              </article>
              <article className="admin-meta-card">
                <p>Hanh dong</p>
                <strong>
                  {order.status === "pending"
                    ? "Goi xac nhan"
                    : order.status === "shipping"
                      ? "Theo doi giao hang"
                      : "Xin feedback"}
                </strong>
                <span>Buoc uu tien de xu ly tiep theo.</span>
              </article>
            </div>

            <div className="admin-order-progress" style={{ marginTop: "12px" }}>
              {order.steps.map((step, index) => (
                <article
                  key={`${order.id}-${step.id}`}
                  className={`admin-order-step ${step.active ? "is-active" : ""}`}
                >
                  <strong>{index + 1}</strong>
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>

            <div className="admin-order-actions" style={{ marginTop: "12px" }}>
              <button type="button" className="admin-link-button">
                Mo chi tiet don
              </button>
              <button type="button" className="admin-link-button-outline">
                Cap nhat trang thai
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
