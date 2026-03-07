import { Link, useParams } from "react-router-dom";
import { formatCurrency, products } from "../../data/storeData";
import "../shared/PageBlocks.css";

const orderEntries = [
  {
    id: "100901",
    badge: "warning",
    status: "Dang xu ly",
    createdAt: "2026-03-07 09:12",
    payment: "COD",
    paymentStatus: "Cho thu khi giao",
    customer: "Nguyen Van A",
    phone: "0901 234 567",
    address: "12 Dang Van Ngu, Phu Nhuan, TP.HCM",
    notes: "Goi truoc khi giao 15 phut.",
    items: products.slice(0, 3).map((product, index) => ({
      ...product,
      qty: index === 0 ? 1 : 1,
    })),
    steps: [
      { id: "received", title: "Tiep nhan don", text: "Da tao ma don va giu hang.", active: true },
      { id: "call", title: "Goi xac nhan", text: "Dang doi cua hang xac nhan.", active: true },
      { id: "pack", title: "Dong goi", text: "Se bat dau sau khi chot thong tin.", active: false },
      { id: "ship", title: "Giao hang", text: "Du kien trong khung 18h - 21h.", active: false },
    ],
  },
  {
    id: "100845",
    badge: "info",
    status: "Dang giao",
    createdAt: "2026-03-04 14:40",
    payment: "Chuyen khoan",
    paymentStatus: "Da thanh toan",
    customer: "Tran Van B",
    phone: "0908 987 654",
    address: "22 Vo Thi Sau, Quan 3, TP.HCM",
    notes: "Nhan hang tai sanh van phong.",
    items: products.slice(2, 4).map((product) => ({
      ...product,
      qty: 1,
    })),
    steps: [
      { id: "received", title: "Tiep nhan don", text: "Da tao ma don.", active: true },
      { id: "call", title: "Xac nhan", text: "Da doi soat thong tin.", active: true },
      { id: "pack", title: "Dong goi", text: "Da xuat kho thanh cong.", active: true },
      { id: "ship", title: "Giao hang", text: "Shipper dang giao trong ngay.", active: true },
    ],
  },
];

export default function OrderDetail() {
  const { id } = useParams();
  const order = orderEntries.find((entry) => entry.id === id) ?? orderEntries[0];
  const total = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Order detail</p>
          <h1 className="page-title">Chi tiet don #{order.id} duoc chia thanh tung khoi de de quet.</h1>
          <p className="page-subtitle">
            Thay vi mot bang va mot vai dong text, trang nay gom tien trinh xu ly,
            danh sach san pham, thong tin giao nhan va huong dan xu ly thay doi don.
          </p>

          <div className="page-hero-actions">
            <span className={`page-badge ${order.badge}`}>{order.status}</span>
            <Link to="/orders" className="page-btn-outline">
              Quay lai lich su
            </Link>
          </div>
        </div>
      </section>

      <section className="page-progress">
        {order.steps.map((step, index) => (
          <article
            key={step.id}
            className={`page-progress-step ${step.active ? "is-active" : ""}`}
          >
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
                <h2>San pham trong don</h2>
              </div>
            </div>

            <div className="page-item-list" style={{ marginTop: "14px" }}>
              {order.items.map((item) => (
                <article key={item.id} className="page-item-row">
                  <div className="page-item-thumb">
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.specs.cpu} | {item.specs.ram} | {item.specs.vga}</p>
                  </div>

                  <div className="page-item-side">
                    <strong>{formatCurrency(item.price * item.qty)}</strong>
                    <span>SL {item.qty}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Payment summary</p>
                <h2>Tam tinh don hang</h2>
              </div>
            </div>

            <div className="page-summary-list" style={{ marginTop: "14px" }}>
              <div className="page-summary-line">
                <p>Gia tri san pham</p>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="page-summary-line">
                <p>Van chuyen</p>
                <span>Mien phi</span>
              </div>
              <div className="page-summary-line">
                <p>Trang thai thanh toan</p>
                <span>{order.paymentStatus}</span>
              </div>
            </div>

            <div className="page-summary-total">
              <p>Tong gia tri don</p>
              <strong>{formatCurrency(total)}</strong>
              <span>Gia tri hiển thị theo UI demo, chua bao gom uu dai sau login.</span>
            </div>
          </section>
        </div>

        <aside className="page-stack">
          <section className="page-summary-card">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Delivery info</p>
                <h2>Thong tin giao nhan</h2>
              </div>
            </div>

            <div className="page-checklist" style={{ marginTop: "14px" }}>
              <div className="page-checklist-row">
                <p>Khach hang</p>
                <span>{order.customer}</span>
              </div>
              <div className="page-checklist-row">
                <p>So dien thoai</p>
                <span>{order.phone}</span>
              </div>
              <div className="page-checklist-row">
                <p>Ngay tao</p>
                <span>{order.createdAt}</span>
              </div>
              <div className="page-checklist-row">
                <p>Thanh toan</p>
                <span>{order.payment}</span>
              </div>
            </div>

            <div className="page-summary-total" style={{ marginTop: "14px" }}>
              <p>Dia chi</p>
              <span>{order.address}</span>
            </div>

            <div className="page-summary-total" style={{ marginTop: "10px" }}>
              <p>Ghi chu</p>
              <span>{order.notes}</span>
            </div>
          </section>

          <section className="page-support-card">
            <h2 className="page-title">Can doi thong tin?</h2>
            <p className="page-subtitle">
              Neu don chua dong goi, ban van co the yeu cau doi dia chi, doi khung
              gio giao hoac them ghi chu cho bo phan van hanh.
            </p>

            <div className="page-actions" style={{ marginTop: "14px" }}>
              <button type="button" className="page-btn">
                Goi hotline
              </button>
              <Link to="/profile" className="page-btn-outline">
                Cap nhat tai khoan
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
