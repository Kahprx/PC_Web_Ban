import "./AdminPages.css";

const orders = [
  { id: "100901", customer: "Nguyễn Văn A", total: "39,990,000 VND", status: "pending" },
  { id: "100898", customer: "Trần Minh K", total: "17,490,000 VND", status: "shipping" },
  { id: "100889", customer: "Lê Quốc P", total: "58,700,000 VND", status: "done" },
];

export default function OrderManager() {
  return (
    <div className="admin-page">
      <section className="admin-panel">
        <h1>Quản lý đơn hàng</h1>
        <p>Kiểm tra và cập nhật trạng thái đơn hàng theo thời gian thực.</p>
      </section>

      <section className="admin-table">
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.total}</td>
                <td>
                  <span className={`admin-status ${order.status}`}>
                    {order.status === "pending" && "Chờ xử lý"}
                    {order.status === "shipping" && "Đang giao"}
                    {order.status === "done" && "Hoàn tất"}
                  </span>
                </td>
                <td>
                  <select defaultValue={order.status}>
                    <option value="pending">Chờ xử lý</option>
                    <option value="shipping">Đang giao</option>
                    <option value="done">Hoàn tất</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
