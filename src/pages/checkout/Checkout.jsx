import { Link } from "react-router-dom";
import { formatCurrency, products } from "../../data/storeData";
import "../shared/PageBlocks.css";

const selectedItems = products.slice(0, 3).map((item, index) => ({
  ...item,
  qty: index === 0 ? 1 : 1,
}));

const deliveryOptions = [
  {
    id: "express",
    title: "Giao nhanh noi thanh",
    fee: 0,
    note: "Du kien 2 - 4 gio, uu tien cho don hang da xac nhan.",
    active: true,
  },
  {
    id: "standard",
    title: "Giao tieu chuan",
    fee: 35_000,
    note: "Nhan hang trong 1 - 3 ngay, phu hop don lien tinh.",
    active: false,
  },
];

const paymentOptions = [
  {
    id: "cod",
    title: "Thanh toan khi nhan hang",
    note: "Nhan vien se xac nhan lai truoc khi giao.",
    active: true,
  },
  {
    id: "banking",
    title: "Chuyen khoan ngan hang",
    note: "Gui bien lai de doi CSKH giu hang som hon.",
    active: false,
  },
  {
    id: "installment",
    title: "Tra gop / the tin dung",
    note: "Can doi soat them thong tin va ngan hang ho tro.",
    active: false,
  },
];

export default function Checkout() {
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingFee = deliveryOptions[0].fee;
  const total = subtotal + shippingFee;

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Checkout workspace</p>
          <h1 className="page-title">Chot don hang tren mot man hinh de theo doi.</h1>
          <p className="page-subtitle">
            Trang thanh toan da duoc doi sang bo cuc ro tung khoi: thong tin nhan
            hang, lua chon giao nhan, phuong thuc thanh toan va tong don o cot ben
            phai de de ra quyet dinh hon.
          </p>

          <div className="page-hero-actions">
            <span className="page-inline-code">Checkout demo</span>
            <Link to="/cart" className="page-btn-outline">
              Quay lai gio hang
            </Link>
          </div>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
          <p>Don hien tai</p>
          <strong>{selectedItems.length} san pham</strong>
          <span>Da gom cac mon chinh trong cau hinh va gear phu tro.</span>
        </article>

        <article className="page-highlight-card">
          <p>Van chuyen</p>
          <strong>{shippingFee === 0 ? "Free ship" : formatCurrency(shippingFee)}</strong>
          <span>Uu tien giao nhanh cho don hang noi thanh da xac nhan.</span>
        </article>

        <article className="page-highlight-card">
          <p>Tong can thanh toan</p>
          <strong>{formatCurrency(total)}</strong>
          <span>Gia hien thi theo UI demo, chua tinh khuyen mai he thong.</span>
        </article>
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Shipping profile</p>
                <h2>Thong tin nhan hang</h2>
              </div>
              <span className="page-inline-code">Buoc 1</span>
            </div>

            <form className="page-form" onSubmit={(event) => event.preventDefault()}>
              <div className="page-form-grid">
                <div className="page-field">
                  <label>Họ và tên</label>
                  <input type="text" placeholder="Nguyễn Văn A" defaultValue="Nguyễn Văn A" />
                </div>

                <div className="page-field">
                  <label>Số điện thoại</label>
                  <input type="text" placeholder="09xxxxxxxx" defaultValue="0901 234 567" />
                </div>

                <div className="page-field">
                  <label>Email liên hệ</label>
                  <input type="email" placeholder="you@example.com" defaultValue="you@example.com" />
                </div>

                <div className="page-field">
                  <label>Khung giờ nhận hàng</label>
                  <select defaultValue="18-21">
                    <option value="9-12">09:00 - 12:00</option>
                    <option value="14-18">14:00 - 18:00</option>
                    <option value="18-21">18:00 - 21:00</option>
                  </select>
                </div>

                <div className="page-field full">
                  <label>Địa chỉ nhận hàng</label>
                  <textarea
                    rows={3}
                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                    defaultValue="12 Đặng Văn Ngữ, Phường 10, Quận Phú Nhuận, TP.HCM"
                  />
                </div>

                <div className="page-field full">
                  <label>Ghi chú cho cửa hàng</label>
                  <textarea
                    rows={3}
                    placeholder="Ví dụ: gọi trước khi giao, xuất hóa đơn, kiểm tra máy..."
                    defaultValue="Gọi trước khi giao 15 phút. Ưu tiên giao sau 18h."
                  />
                </div>
              </div>
            </form>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Delivery</p>
                <h2>Lua chon giao nhan</h2>
              </div>
              <span className="page-inline-code">Buoc 2</span>
            </div>

            <div className="page-option-grid">
              {deliveryOptions.map((option) => (
                <article
                  key={option.id}
                  className={`page-option-card ${option.active ? "is-active" : ""}`}
                >
                  <p>{option.title}</p>
                  <strong>{option.fee === 0 ? "Free" : formatCurrency(option.fee)}</strong>
                  <span>{option.note}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Payment</p>
                <h2>Phuong thuc thanh toan</h2>
              </div>
              <span className="page-inline-code">Buoc 3</span>
            </div>

            <div className="page-stack">
              {paymentOptions.map((option) => (
                <article
                  key={option.id}
                  className={`page-option-card ${option.active ? "is-active" : ""}`}
                >
                  <p>{option.title}</p>
                  <span>{option.note}</span>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="page-stack">
          <section className="page-summary-card">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Order summary</p>
                <h2>Don hang</h2>
              </div>
              <span className="page-inline-code">Buoc 4</span>
            </div>

            <div className="page-item-list" style={{ marginTop: "14px" }}>
              {selectedItems.map((item) => (
                <article key={item.id} className="page-item-row">
                  <div className="page-item-thumb">
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.specs.cpu} | {item.specs.vga}</p>
                  </div>

                  <div className="page-item-side">
                    <strong>{formatCurrency(item.price * item.qty)}</strong>
                    <span>SL {item.qty}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="page-summary-list" style={{ marginTop: "14px" }}>
              <div className="page-summary-line">
                <p>Tam tinh</p>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="page-summary-line">
                <p>Van chuyen</p>
                <span>{shippingFee === 0 ? "Mien phi" : formatCurrency(shippingFee)}</span>
              </div>
              <div className="page-summary-line">
                <p>Khuyen mai tam tinh</p>
                <span>Se cap nhat sau</span>
              </div>
            </div>

            <div className="page-summary-total">
              <p>Tong thanh toan</p>
              <strong>{formatCurrency(total)}</strong>
              <span>
                Don hang se duoc goi xac nhan truoc khi khoi tao phieu giao.
              </span>
            </div>

            <div className="page-actions" style={{ marginTop: "12px" }}>
              <Link to="/confirm" className="page-btn">
                XÁC NHẬN ĐẶT HÀNG
              </Link>
              <Link to="/products" className="page-btn-outline">
                Thêm sản phẩm khác
              </Link>
            </div>
          </section>

          <section className="page-support-card">
            <h2 className="page-title">Can xac nhan nhanh?</h2>
            <p className="page-subtitle">
              Goi hotline de khoa hang, doi dia chi hoac xac nhan xuat hoa don cho don nay.
            </p>

            <div className="page-actions" style={{ marginTop: "14px" }}>
              <button type="button" className="page-btn">
                Hotline 1900.XXXX
              </button>
              <button type="button" className="page-btn-outline">
                Chat voi CSKH
              </button>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
