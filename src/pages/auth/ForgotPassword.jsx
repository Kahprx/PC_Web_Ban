import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordApi } from "../../services/authService";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./Auth.css";

const recoverySteps = [
  "Nhập email bạn đã đăng ký.",
  "Hệ thống backend gửi link đặt lại mật khẩu qua email.",
  "Mở link trong email để tạo mật khẩu mới.",
];

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [previewResetUrl, setPreviewResetUrl] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const safeEmail = String(email || "").trim();
    if (!safeEmail) {
      notifyError(new Error("Vui lòng nhập email"), "Thiếu email");
      return;
    }

    try {
      setLoading(true);
      const result = await forgotPasswordApi({ email: safeEmail });
      const successMessage = result?.message || "Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu.";
      const previewLink = String(result?.data?.previewResetUrl || "").trim();

      setMessage(successMessage);
      setPreviewResetUrl(previewLink);
      notifySuccess(successMessage);
    } catch (error) {
      notifyError(error, "Gửi yêu cầu đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <article className="auth-showcase">
          <p className="auth-kicker">Khôi phục tài khoản</p>
          <h1>Gửi link đặt lại mật khẩu qua email.</h1>
          <p className="auth-lead">Biểu mẫu này đã kết nối API backend và gửi yêu cầu thật.</p>

          <div className="auth-feature-list">
            {recoverySteps.map((item, index) => (
              <article key={item} className="auth-feature-card">
                <strong>Bước {index + 1}</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>

          <div className="auth-link-row">
            <Link to="/login" className="auth-secondary-link">
              Quay lại đăng nhập
            </Link>
          </div>
        </article>

        <section className="auth-card">
          <div className="auth-card-top">
            <p className="auth-kicker">Quên mật khẩu</p>
            <h2>Yêu cầu cấp lại mật khẩu</h2>
            <p>Nhập email để nhận liên kết đặt lại mật khẩu.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "ĐANG GỬI..." : "GỬI LINK ĐẶT LẠI"}
            </button>
          </form>

          {message ? (
            <>
              <div className="auth-divider" />
              <div className="auth-note">{message}</div>
            </>
          ) : null}

          {previewResetUrl ? (
            <div className="auth-note" style={{ marginTop: "10px" }}>
              <strong>Link test local:</strong>{" "}
              <a href={previewResetUrl} target="_blank" rel="noreferrer">
                {previewResetUrl}
              </a>
            </div>
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
