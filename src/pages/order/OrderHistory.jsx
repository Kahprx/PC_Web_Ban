import { Link } from "react-router-dom";
import { formatCurrency } from "../../data/storeData";
import "../shared/PageBlocks.css";

const orders = [
  { id: "100901", date: "2026-02-24", total: 39_990_000, status: "Đang xử lý", badge: "warning" },
  { id: "100845", date: "2026-02-20", total: 22_490_000, status: "Đang giao", badge: "info" },
  { id: "100732", date: "2026-02-14", total: 58_700_000, status: "Hoàn tất", badge: "success" },
];

export default function OrderHistory() {
  return (
    <div className="page-shell">
      <section className="page-section">
        <h1 className="page-title">Lịch sử đơn hàng</h1>
        <p className="page-subtitle">Theo dõi trạng thái và chi tiết các đơn hàng đã đặt.</p>
      </section>

      <section className="page-table">
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.date}</td>
                <td>{formatCurrency(order.total)}</td>
                <td>
                  <span className={`page-badge ${order.badge}`}>{order.status}</span>
                </td>
                <td>
                  <Link to={`/orders/${order.id}`} className="page-btn-outline">Chi tiết</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
