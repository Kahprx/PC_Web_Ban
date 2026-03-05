import { Link } from "react-router-dom";
import { formatCurrency, products } from "../../data/storeData";
import "../shared/PageBlocks.css";

const lineItems = products.slice(0, 3).map((product, index) => ({
  ...product,
  qty: index + 1,
}));

export default function Cart() {
  const subtotal = lineItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="page-shell">
      <section className="page-section">
        <h1 className="page-title">Giỏ hàng của bạn</h1>
        <p className="page-subtitle">Kiểm tra sản phẩm, số lượng và tiến hành thanh toán.</p>
      </section>

      <section className="page-table">
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Đơn giá</th>
              <th>Tạm tính</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.qty}</td>
                <td>{formatCurrency(item.price)}</td>
                <td>{formatCurrency(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="page-card">
        <div className="page-grid-2">
          <div className="page-stat">
            <p>Tạm tính</p>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div className="page-stat">
            <p>Phí vận chuyển</p>
            <strong>{formatCurrency(0)}</strong>
          </div>
        </div>

        <div className="page-actions" style={{ marginTop: "10px" }}>
          <Link to="/checkout" className="page-btn">
            TIẾN HÀNH THANH TOÁN
          </Link>
          <Link to="/products" className="page-btn-outline">
            TIẾP TỤC MUA HÀNG
          </Link>
        </div>
      </section>
    </div>
  );
}
