import { useParams } from "react-router-dom";
import { formatCurrency, products } from "../../data/storeData";
import "../shared/PageBlocks.css";

export default function OrderDetail() {
  const { id } = useParams();
  const items = products.slice(0, 2);
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="page-shell">
      <section className="page-section">
        <h1 className="page-title">Chi tiết đơn hàng #{id}</h1>
        <p className="page-subtitle">Thông tin trạng thái và danh sách sản phẩm trong đơn.</p>
      </section>

      <div className="page-grid-2">
        <section className="page-card">
          <h2 className="page-title" style={{ fontSize: "17px" }}>Trạng thái giao hàng</h2>
          <div style={{ marginTop: "8px", display: "grid", gap: "8px" }}>
            <div className="page-badge success">Đơn hàng đã xác nhận</div>
            <div className="page-badge info">Đang chuẩn bị hàng</div>
            <div className="page-badge warning">Dự kiến giao trong hôm nay</div>
          </div>
        </section>

        <section className="page-card">
          <h2 className="page-title" style={{ fontSize: "17px" }}>Tóm tắt thanh toán</h2>
          <div className="page-stat" style={{ marginTop: "8px" }}>
            <p>Tổng giá trị đơn</p>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </section>
      </div>

      <section className="page-table">
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Đơn giá</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{formatCurrency(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
