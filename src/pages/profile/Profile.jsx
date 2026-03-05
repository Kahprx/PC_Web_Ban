import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../shared/PageBlocks.css";

export default function Profile() {
  const { session } = useAuth();

  return (
    <div className="page-shell">
      <section className="page-section">
        <h1 className="page-title">Tài khoản của tôi</h1>
        <p className="page-subtitle">Cập nhật thông tin cá nhân và địa chỉ nhận hàng mặc định.</p>
      </section>

      <section className="page-form-card">
        <form className="page-form" onSubmit={(event) => event.preventDefault()}>
          <div className="page-grid-2">
            <div className="page-field">
              <label>Họ và tên</label>
              <input type="text" defaultValue={session?.name || "Khách hàng"} />
            </div>
            <div className="page-field">
              <label>Email</label>
              <input type="email" defaultValue={session?.email || ""} />
            </div>
          </div>

          <div className="page-grid-2">
            <div className="page-field">
              <label>Số điện thoại</label>
              <input type="text" placeholder="09xxxxxxxx" />
            </div>
            <div className="page-field">
              <label>Ngày sinh</label>
              <input type="date" />
            </div>
          </div>

          <div className="page-field">
            <label>Địa chỉ mặc định</label>
            <textarea rows={3} placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" />
          </div>

          <div className="page-actions">
            <button type="submit" className="page-btn">LƯU THAY ĐỔI</button>
            <Link to="/change-password" className="page-btn-outline">ĐỔI MẬT KHẨU</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
