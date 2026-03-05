import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!account.trim() || !password.trim()) {
      setError("Vui lòng nhập đủ tài khoản và mật khẩu.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const session = await login({ account, password });

      if (session?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Đăng nhập tài khoản</h1>
        <p>Đăng nhập để vào đúng chức năng theo role tài khoản.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="login-account">Tài khoản</label>
            <input
              id="login-account"
              type="text"
              placeholder="username hoặc email"
              value={account}
              onChange={(event) => setAccount(event.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Mật khẩu</label>
            <input
              id="login-password"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && <div className="auth-note">{error}</div>}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
          </button>
        </form>

        <div className="auth-alt">
          <Link to="/forgot-password">Quên mật khẩu?</Link>
          <Link to="/register">Tạo tài khoản mới</Link>
        </div>

        <div className="auth-note">
          Demo local mặc định: <strong>tk1</strong> (user), <strong>tk2</strong> (admin), mật khẩu <strong>123456</strong>.
          Bạn có thể đăng ký thêm tài khoản mới và đăng nhập lại bằng chính tài khoản đó.
        </div>
      </div>
    </div>
  );
}
