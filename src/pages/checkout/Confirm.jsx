import { Link } from "react-router-dom";
import { formatCurrency, products } from "../../data/storeData";
import "../shared/PageBlocks.css";

const confirmationItems = products.slice(0, 2).map((item) => ({
  ...item,
  qty: 1,
}));

const orderCode = "KAH-20260307-0912";
const total = confirmationItems.reduce((sum, item) => sum + item.price * item.qty, 0);

const progressSteps = [
  {
    id: "received",
    title: "Tiep nhan don",
    text: "He thong da ghi nhan don hang va tao ma don.",
    active: true,
  },
  {
    id: "verify",
    title: "Xac nhan thong tin",
    text: "Nhan vien se goi lai de doi soat dia chi va thoi gian giao.",
    active: true,
  },
  {
    id: "packing",
    title: "Dong goi",
    text: "Kho van dang chuan bi hang va kiem tra phu kien di kem.",
    active: false,
  },
  {
    id: "delivery",
    title: "Giao du kien",
    text: "Noi thanh du kien trong 2 - 4 gio sau khi xac nhan.",
    active: false,
  },
];

export default function Confirm() {
  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Order placed</p>
          <h1 className="page-title">Don hang da duoc tao va cho xac nhan tu cua hang.</h1>
          <p className="page-subtitle">
            UI xac nhan moi tap trung vao ma don, tien trinh xu ly va cac buoc tiep
            theo de nguoi dung khong bi lac huong sau khi dat hang.
          </p>

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

      <section className="page-progress">
        {progressSteps.map((step, index) => (
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
                <p className="page-panel-kicker">Order snapshot</p>
                <h2>Thong tin nhanh</h2>
              </div>
            </div>

            <div className="page-meta-grid" style={{ marginTop: "14px" }}>
              <article className="page-meta-card">
                <p>Ma don</p>
                <strong>{orderCode}</strong>
                <span>Duoc tao luc 09:12 AM, Thu Bay.</span>
              </article>
              <article className="page-meta-card">
                <p>Tong thanh toan</p>
                <strong>{formatCurrency(total)}</strong>
                <span>Chua tinh khuyen mai he thong theo tai khoan.</span>
              </article>
              <article className="page-meta-card">
                <p>Thanh toan</p>
                <strong>COD</strong>
                <span>Thanh toan khi nhan hang.</span>
              </article>
              <article className="page-meta-card">
                <p>Du kien giao</p>
                <strong>Hom nay</strong>
                <span>Khung gio 18:00 - 21:00.</span>
              </article>
            </div>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Items locked</p>
                <h2>San pham trong don</h2>
              </div>
            </div>

            <div className="page-item-list" style={{ marginTop: "14px" }}>
              {confirmationItems.map((item) => (
                <article key={item.id} className="page-item-row">
                  <div className="page-item-thumb">
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.specs.cpu} | {item.specs.ram} | {item.specs.vga}</p>
                  </div>

                  <div className="page-item-side">
                    <strong>{formatCurrency(item.price)}</strong>
                    <span>SL {item.qty}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="page-stack">
          <section className="page-summary-card">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Next steps</p>
                <h2>Ban can lam gi tiep?</h2>
              </div>
            </div>

            <ul className="page-note-list" style={{ marginTop: "14px" }}>
              <li>Giu may bat chuong de nhan cuoc goi xac nhan don hang.</li>
              <li>Nếu cần đổi địa chỉ hoặc giờ nhận, liên hệ CSKH ngay trong 15 phút đầu.</li>
              <li>Chuẩn bị thông tin xuất hóa đơn nếu mua cho công ty hoặc team.</li>
            </ul>
          </section>

          <section className="page-support-card">
            <h2 className="page-title">Can doi don gap?</h2>
            <p className="page-subtitle">
              Cua hang co the chinh lai dia chi, phuong thuc thanh toan va ghi chu giao hang
              trong giai doan chua dong goi.
            </p>

            <div className="page-actions" style={{ marginTop: "14px" }}>
              <button type="button" className="page-btn">
                Goi hotline
              </button>
              <Link to="/profile" className="page-btn-outline">
                Ve tai khoan
              </Link>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
