import "./AdminPages.css";

const stats = [
  { label: "Đơn hàng hôm nay", value: "24" },
  { label: "Doanh thu hôm nay", value: "146.5M" },
  { label: "Khách hàng mới", value: "12" },
  { label: "Sản phẩm sắp hết", value: "8" },
];

const recentOrders = [
  { id: "100901", customer: "Nguyễn Văn A", total: "39,990,000 VND", status: "pending" },
  { id: "100898", customer: "Trần Minh K", total: "17,490,000 VND", status: "shipping" },
  { id: "100889", customer: "Lê Quốc P", total: "58,700,000 VND", status: "done" },
];

export default function Dashboard() {
  return (
    <div className="admin-page">
      <section className="admin-panel">
        <h1>Dashboard</h1>
        <p>Tổng quan nhanh hiệu suất bán hàng và tình trạng vận hành.</p>
      </section>

      <section className="admin-stats">
        {stats.map((stat) => (
          <article key={stat.label} className="admin-stat-card">
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-table">
        <div className="admin-toolbar" style={{ marginBottom: "8px" }}>
          <h2 style={{ margin: 0, fontSize: "18px" }}>Đơn hàng mới nhất</h2>
        </div>

        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
