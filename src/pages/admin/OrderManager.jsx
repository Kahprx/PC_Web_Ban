import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminOrders } from "../../services/orderService";
import { notifyError } from "../../utils/notify";
import { formatVnd } from "../../utils/currency";
import "./AdminPages.css";

export default function OrderManager() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (!token) return;

      try {
        setLoading(true);
        const result = await fetchAdminOrders(token, {
          search,
          status,
          page,
          limit: 10,
        });

        setOrders(result?.data || []);
        setPagination(result?.pagination || { totalPages: 1, total: 0 });
      } catch (error) {
        notifyError(error, "Khong tai duoc don hang");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [token, search, status, page]);

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-header">
          <div>
            <p className="admin-kicker">Order operations</p>
            <h1>Quan ly don hang theo du lieu API.</h1>
            <p>Bo loc, tim kiem va phan trang theo role admin.</p>
          </div>
        </div>
      </section>

      <section className="admin-product-panel">
        <div className="admin-product-filters">
          <input
            type="text"
            className="admin-filter-select"
            placeholder="Tim theo ten/email/ma don"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          <select
            className="admin-filter-select"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tat ca trang thai</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="admin-product-table-wrap">
          <table className="admin-product-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>KHACH HANG</th>
                <th>EMAIL</th>
                <th>TONG TIEN</th>
                <th>TRANG THAI</th>
                <th>NGAY TAO</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty">Dang tai du lieu...</td>
                </tr>
              ) : null}

              {!loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-table-empty">Khong co don hang.</td>
                </tr>
              ) : null}

              {!loading
                ? orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.full_name}</td>
                      <td>{order.email}</td>
                      <td>{formatVnd(order.total_amount)}</td>
                      <td>
                        <span className={`admin-status ${order.status === "completed" ? "done" : order.status === "pending" ? "pending" : "shipping"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>{new Date(order.created_at).toLocaleString("vi-VN")}</td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination" style={{ marginTop: 12 }}>
          <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
            {"<"}
          </button>
          <button type="button" className="is-active">{page}</button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(Number(pagination.totalPages || 1), prev + 1))}
            disabled={page >= Number(pagination.totalPages || 1)}
          >
            {">"}
          </button>
          <span style={{ marginLeft: 8 }}>Tong: {pagination.total || 0}</span>
        </div>
      </section>
    </div>
  );
}
