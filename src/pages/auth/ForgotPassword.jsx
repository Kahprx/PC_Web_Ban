import { Link } from "react-router-dom";
import "./Auth.css";

export default function ForgotPassword() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Quên mật khẩu</h1>
        <p>Nhập email đã đăng ký, hệ thống sẽ gửi liên kết khôi phục mật khẩu cho bạn.</p>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          <div className="auth-field">
            <label htmlFor="forgot-email">Email</label>
            <input id="forgot-email" type="email" placeholder="you@example.com" />
          </div>

          <button type="submit" className="auth-submit">
            GỬI LIÊN KẾT KHÔI PHỤC
          </button>
        </form>

        <div className="auth-alt">
          <Link to="/login">Quay lại đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
