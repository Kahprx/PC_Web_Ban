import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { resetPasswordApi, verifyResetPasswordTokenApi } from "../../services/authService";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./Auth.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setTokenValid(false);
        setMessage("Thiếu token đặt lại mật khẩu.");
        return;
      }

      try {
        await verifyResetPasswordTokenApi(token);
        setTokenValid(true);
      } catch (error) {
        setTokenValid(false);
        setMessage(error.message || "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
      }
    };

    verify();
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const safePassword = String(password).trim();
    const safeConfirm = String(confirmPassword).trim();

    if (!token) {
      notifyError(new Error("Token đặt lại mật khẩu không hợp lệ"), "Thiếu token");
      return;
    }

    if (safePassword.length < 6) {
      notifyError(new Error("Mật khẩu phải có ít nhất 6 ký tự"), "Mật khẩu yếu");
      return;
    }

    if (safePassword !== safeConfirm) {
      notifyError(new Error("Mật khẩu xác nhận không trùng khớp"), "Xác nhận mật khẩu");
      return;
    }

    try {
      setLoading(true);
      const result = await resetPasswordApi({ token, password: safePassword });
      const successMessage = result?.message || "Đặt lại mật khẩu thành công.";
      setMessage(successMessage);
      notifySuccess(successMessage);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      notifyError(error, "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <article className="auth-showcase">
          <p className="auth-kicker">Đặt lại mật khẩu</p>
          <h1>Thiết lập mật khẩu mới cho tài khoản của bạn.</h1>
          <p className="auth-lead">Mở liên kết trong email và nhập mật khẩu mới để hoàn tất.</p>

          <div className="auth-link-row">
            <Link to="/login" className="auth-secondary-link">
              Quay lại đăng nhập
            </Link>
          </div>
        </article>

        <section className="auth-card">
          <div className="auth-card-top">
            <p className="auth-kicker">Reset password</p>
            <h2>Tạo mật khẩu mới</h2>
            <p>Hệ thống sẽ xác thực token trước khi cập nhật mật khẩu.</p>
          </div>

          {tokenValid === false ? (
            <div className="auth-note">{message || "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."}</div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="reset-password">Mật khẩu mới</label>
                <input
                  id="reset-password"
                  type="password"
                  placeholder="Nhập mật khẩu mới"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reset-confirm-password">Xác nhận mật khẩu</label>
                <input
                  id="reset-confirm-password"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit" disabled={loading || tokenValid === null}>
                {loading ? "ĐANG CẬP NHẬT..." : "ĐỔI MẬT KHẨU"}
              </button>
            </form>
          )}

          {message && tokenValid !== false ? (
            <>
              <div className="auth-divider" />
              <div className="auth-note">{message}</div>
            </>
          ) : null}

          <div className="auth-alt">
            <Link to="/login">Đăng nhập</Link>
            <Link to="/register">Tạo tài khoản</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
