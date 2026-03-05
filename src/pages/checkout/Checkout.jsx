import { Link } from "react-router-dom";
import { formatCurrency, products } from "../../data/storeData";
import "../shared/PageBlocks.css";

const selectedItems = products.slice(0, 2);

export default function Checkout() {
  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="page-shell">
      <section className="page-section">
        <h1 className="page-title">Thanh toán</h1>
        <p className="page-subtitle">Điền thông tin giao hàng và chọn phương thức thanh toán.</p>
      </section>

      <div className="page-grid-2">
        <section className="page-form-card">
          <form className="page-form" onSubmit={(event) => event.preventDefault()}>
            <div className="page-field">
              <label>Họ và tên</label>
              <input type="text" placeholder="Nguyễn Văn A" />
            </div>
            <div className="page-field">
              <label>Số điện thoại</label>
              <input type="text" placeholder="09xxxxxxxx" />
            </div>
            <div className="page-field">
              <label>Địa chỉ nhận hàng</label>
              <textarea rows={3} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" />
            </div>
            <div className="page-field">
              <label>Phương thức thanh toán</label>
              <select>
                <option>COD - Thanh toán khi nhận hàng</option>
                <option>Chuyển khoản ngân hàng</option>
                <option>Thẻ tín dụng / trả góp</option>
              </select>
            </div>
          </form>
        </section>

        <section className="page-card">
          <h2 className="page-title" style={{ fontSize: "18px" }}>Đơn hàng</h2>
          <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
            {selectedItems.map((item) => (
              <div key={item.id} className="page-stat">
                <p>{item.name}</p>
                <strong style={{ fontSize: "14px" }}>{formatCurrency(item.price)}</strong>
              </div>
            ))}
          </div>

          <div className="page-stat" style={{ marginTop: "8px" }}>
            <p>Tổng thanh toán</p>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <div className="page-actions" style={{ marginTop: "10px" }}>
            <Link to="/confirm" className="page-btn">
              XÁC NHẬN ĐẶT HÀNG
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
