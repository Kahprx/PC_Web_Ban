import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchMyOrders, fetchWarrantyByOrderCode } from "../../services/orderService";
import { notifyError } from "../../utils/notify";
import "../shared/PageBlocks.css";
import "./ContentPages.css";

const policyItems = [
  "Hàng chính hãng, có mã sản phẩm và mã đơn hàng để tra cứu bảo hành.",
  "Thời gian bảo hành hiển thị theo từng sản phẩm trong đơn, dựa trên ngày đặt hàng.",
  "Các linh kiện chính (CPU/Main/VGA) được ưu tiên thời gian bảo hành dài hơn.",
  "Nếu cần hỗ trợ bảo hành, vui lòng cung cấp mã đơn và mã sản phẩm liên quan.",
];

export default function PolicyWarranty() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [warrantyData, setWarrantyData] = useState(null);
  const [loadingLookup, setLoadingLookup] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) return;
      try {
        setLoadingOrders(true);
        const result = await fetchMyOrders(token, { page: 1, limit: 30 });
        setOrders(result?.data || []);
      } catch (error) {
        notifyError(error, "Không tải được danh sách đơn hàng");
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [token]);

  const orderCodes = useMemo(() => orders.map((order) => `ORDER-${order.id}`), [orders]);

  const handleLookup = async (inputCode) => {
    const safeCode = String(inputCode || orderCode || "").trim();
    if (!safeCode) {
      notifyError("Vui lòng nhập mã đơn hàng");
      return;
    }

    try {
      setLoadingLookup(true);
      const result = await fetchWarrantyByOrderCode(safeCode);
      setWarrantyData(result?.data || null);
      setOrderCode(result?.data?.orderCode || safeCode);
    } catch (error) {
      notifyError(error, "Không tra cứu được bảo hành");
      setWarrantyData(null);
    } finally {
      setLoadingLookup(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Chính sách / Bảo hành</p>
          <h1 className="page-title">Tra cứu trạng thái bảo hành theo mã đơn hàng.</h1>
          <p className="page-subtitle">Nhập mã đơn để xem sản phẩm còn bảo hành, thời hạn và số ngày còn lại.</p>
        </div>
      </section>

      <section className="page-panel">
        <div className="page-panel-header">
          <div>
            <p className="page-panel-kicker">Chính sách áp dụng</p>
            <h2>Điều kiện bảo hành</h2>
          </div>
        </div>

        <div className="content-policy-list" style={{ marginTop: "12px" }}>
          {policyItems.map((item) => (
            <article key={item} className="content-policy-item">
              <p>{item}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-layout-2-1">
        <section className="page-panel">
          <div className="page-panel-header">
            <div>
              <p className="page-panel-kicker">Tra cứu bảo hành</p>
              <h2>Nhập mã đơn hàng</h2>
            </div>
          </div>

          <div className="page-form" style={{ marginTop: "12px" }}>
            <div className="page-field">
              <label>Mã đơn</label>
              <input value={orderCode} onChange={(event) => setOrderCode(event.target.value)} placeholder="Ví dụ: ORDER-123" />
            </div>
            <div className="page-actions">
              <button type="button" className="page-btn" onClick={() => handleLookup(orderCode)} disabled={loadingLookup}>
                {loadingLookup ? "ĐANG TRA CỨU..." : "TRA CỨU BẢO HÀNH"}
              </button>
            </div>
          </div>

          {warrantyData ? (
            <div className="page-table" style={{ marginTop: "12px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Thời hạn</th>
                    <th>Còn lại</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {warrantyData.items?.map((item) => (
                    <tr key={`${item.orderItemId}-${item.productId}`}>
                      <td>{item.productName}</td>
                      <td>{item.warrantyMonths} tháng</td>
                      <td>{item.inWarranty ? `${item.remainingDays} ngày` : "Hết hạn"}</td>
                      <td>
                        <span className={`page-badge ${item.inWarranty ? "success" : "warning"}`}>
                          {item.inWarranty ? "Còn bảo hành" : "Hết bảo hành"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <aside className="page-stack">
          <section className="page-summary-card">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Mã đơn hàng</p>
                <h2>Đơn đã đặt</h2>
              </div>
            </div>

            {loadingOrders ? <p style={{ marginTop: "10px" }}>Đang tải mã đơn...</p> : null}

            {!loadingOrders && orderCodes.length === 0 ? (
              <p style={{ marginTop: "10px" }}>
                {token
                  ? "Bạn chưa có đơn hàng để tra cứu."
                  : "Đăng nhập để xem danh sách mã đơn của bạn hoặc nhập mã đơn trực tiếp bên trái."}
              </p>
            ) : null}

            <div className="page-pill-row" style={{ marginTop: "10px" }}>
              {orderCodes.map((code) => (
                <button key={code} type="button" className="page-pill" onClick={() => handleLookup(code)} style={{ cursor: "pointer" }}>
                  {code}
                </button>
              ))}
            </div>
          </section>

          {warrantyData ? (
            <section className="page-summary-card">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-kicker">Kết quả tra cứu</p>
                  <h2>{warrantyData.orderCode}</h2>
                </div>
              </div>
              <div className="page-kv-list" style={{ marginTop: "10px" }}>
                <div className="page-kv-row">
                  <p>Ngày đặt</p>
                  <span>{new Date(warrantyData.orderedAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <div className="page-kv-row">
                  <p>Tổng sản phẩm</p>
                  <span>{warrantyData.summary?.totalItems || 0}</span>
                </div>
                <div className="page-kv-row">
                  <p>Còn bảo hành</p>
                  <span>{warrantyData.summary?.activeWarrantyItems || 0}</span>
                </div>
                <div className="page-kv-row">
                  <p>Đã hết hạn</p>
                  <span>{warrantyData.summary?.expiredWarrantyItems || 0}</span>
                </div>
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
