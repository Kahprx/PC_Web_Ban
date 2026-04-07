import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchAdminOrders, patchAdminOrderStatus } from "../../services/orderService";
import { notifyError, notifySuccess } from "../../utils/notify";
import { formatVnd } from "../../utils/currency";
import "./AdminPages.css";

const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipping", label: "Shipping" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const formatStatusLabel = (status = "") => {
  const item = ORDER_STATUS_OPTIONS.find((entry) => entry.value === status);
  return item?.label || status || "N/A";
};

export default function OrderManager() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [draftStatusByOrderId, setDraftStatusByOrderId] = useState({});

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

        const orderRows = result?.data || [];
        setOrders(orderRows);
        setPagination(result?.pagination || { totalPages: 1, total: 0 });
        setDraftStatusByOrderId((prev) => {
          const next = { ...prev };
          orderRows.forEach((item) => {
            if (!next[item.id]) next[item.id] = item.status;
          });
          return next;
        });
      } catch (error) {
        notifyError(error, "Không tải được đơn hàng");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [token, search, status, page]);

  const hasOrderRows = orders.length > 0;

  const totalPages = useMemo(() => Number(pagination.totalPages || 1), [pagination.totalPages]);

  const handleSaveStatus = async (orderId) => {
    const nextStatus = String(draftStatusByOrderId[orderId] || "").trim().toLowerCase();
    if (!nextStatus) return;

    try {
      setUpdatingOrderId(orderId);
      await patchAdminOrderStatus(orderId, nextStatus, token);
      setOrders((prev) =>
        prev.map((row) => (Number(row.id) === Number(orderId) ? { ...row, status: nextStatus } : row))
      );
      notifySuccess("Đã cập nhật trạng thái đơn hàng.");
    } catch (error) {
      notifyError(error, "Không cập nhật được trạng thái đơn");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-header">
          <div>
            <p className="admin-kicker">Order operations</p>
            <h1>Quản lý đơn hàng theo dữ liệu API.</h1>
            <p>Lọc, tìm kiếm, phân trang và cập nhật trạng thái trực tiếp.</p>
          </div>
        </div>
      </section>

      <section className="admin-product-panel">
        <div className="admin-product-filters">
          <input
            type="text"
            className="admin-filter-select"
            placeholder="Tìm theo tên/email/mã đơn"
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
            <option value="">Tất cả trạng thái</option>
            {ORDER_STATUS_OPTIONS.map((item) => (
              <option key={`filter-status-${item.value}`} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-product-table-wrap">
          <table className="admin-product-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>KHÁCH HÀNG</th>
                <th>EMAIL</th>
                <th>TỔNG TIỀN</th>
                <th>TRẠNG THÁI</th>
                <th>NGÀY TẠO</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : null}

              {!loading && !hasOrderRows ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">
                    Không có đơn hàng.
                  </td>
                </tr>
              ) : null}

              {!loading
                ? orders.map((order) => {
                    const currentStatus = String(order.status || "").toLowerCase();
                    const draftStatus = String(draftStatusByOrderId[order.id] || currentStatus);
                    const changed = draftStatus !== currentStatus;
                    const isSubmitting = Number(updatingOrderId) === Number(order.id);

                    return (
                      <tr key={order.id}>
                        <td>#{order.id}</td>
                        <td>{order.full_name}</td>
                        <td>{order.email}</td>
                        <td>{formatVnd(order.total_amount)}</td>
                        <td>
                          <span
                            className={`admin-status ${
                              currentStatus === "completed"
                                ? "done"
                                : currentStatus === "cancelled"
                                ? "cancelled"
                                : currentStatus === "pending"
                                ? "pending"
                                : "shipping"
                            }`}
                          >
                            {formatStatusLabel(currentStatus)}
                          </span>
                        </td>
                        <td>{new Date(order.created_at).toLocaleString("vi-VN")}</td>
                        <td style={{ minWidth: 210 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <select
                              className="admin-filter-select"
                              value={draftStatus}
                              onChange={(event) =>
                                setDraftStatusByOrderId((prev) => ({
                                  ...prev,
                                  [order.id]: event.target.value,
                                }))
                              }
                              style={{ height: 34, fontSize: 13, minWidth: 120 }}
                              disabled={isSubmitting}
                            >
                              {ORDER_STATUS_OPTIONS.map((item) => (
                                <option key={`row-status-${order.id}-${item.value}`} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="admin-btn"
                              onClick={() => handleSaveStatus(order.id)}
                              disabled={!changed || isSubmitting}
                              style={{ padding: "6px 10px", fontSize: 11 }}
                            >
                              {isSubmitting ? "Đang lưu..." : "Lưu"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>

        <div className="admin-pagination" style={{ marginTop: 12 }}>
          <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
            {"<"}
          </button>
          <button type="button" className="is-active">
            {page}
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            {">"}
          </button>
          <span style={{ marginLeft: 8 }}>Tổng: {pagination.total || 0}</span>
        </div>
      </section>
    </div>
  );
}
