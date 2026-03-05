import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await register({
        fullName: name,
        email,
        password,
      });
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(err?.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Tạo tài khoản mới</h1>
        <p>Đăng ký tài khoản để lưu địa chỉ, xem lịch sử mua hàng và nhận khuyến mãi.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="register-name">Họ và tên</label>
            <input
              id="register-name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Mật khẩu</label>
            <input
              id="register-password"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && <div className="auth-note">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "ĐANG TẠO..." : "TẠO TÀI KHOẢN"}
          </button>
        </form>

        <div className="auth-alt">
          <span>Đã có tài khoản?</span>
          <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
