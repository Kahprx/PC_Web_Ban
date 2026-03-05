import { Link } from "react-router-dom";
import "../shared/PageBlocks.css";

export default function Confirm() {
  const orderCode = "KAH-DEMO-001";

  return (
    <div className="page-shell">
      <section className="page-card" style={{ textAlign: "center" }}>
        <h1 className="page-title">Đặt hàng thành công</h1>
        <p className="page-subtitle">Cảm ơn bạn đã mua hàng tại KAH Gaming.</p>

        <div className="page-stat" style={{ marginTop: "10px" }}>
          <p>Mã đơn hàng</p>
          <strong>{orderCode}</strong>
        </div>

        <div className="page-actions" style={{ justifyContent: "center", marginTop: "12px" }}>
          <Link to="/orders" className="page-btn">
            XEM ĐƠN HÀNG
          </Link>
          <Link to="/products" className="page-btn-outline">
            TIẾP TỤC MUA HÀNG
          </Link>
        </div>
      </section>
    </div>
  );
}
