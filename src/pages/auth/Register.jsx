import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";

const registerBenefits = [
  "Luu profile va dia chi giao hang de checkout nhanh hon.",
  "Theo doi lich su don, trang thai xu ly va thong tin bao hanh.",
  "San sang de noi tiep voi backend khi project chuyen sang du lieu that.",
];

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
      setError("Vui long nhap day du thong tin.");
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
      setError(err?.message || "Dang ky that bai.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <article className="auth-showcase">
          <p className="auth-kicker">New account</p>
          <h1>Tao tai khoan de bien shopping flow thanh mot hanh trinh co luu vet.</h1>
          <p className="auth-lead">
            Batch nay khong chi them mau sac. Toi dang bien nhom auth thanh cac man
            co thong diep, quyen loi va hierarchy ro rang hon.
          </p>

          <div className="auth-feature-list">
            {registerBenefits.map((item) => (
              <article key={item} className="auth-feature-card">
                <strong>Benefit</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>

          <div className="auth-credential-card auth-credential-card-wide">
            <p>Luu y</p>
            <strong>Password toi thieu 6 ky tu</strong>
            <span>Neu backend khong san sang, app van co the tao local account de demo FE.</span>
          </div>

          <div className="auth-link-row">
            <Link to="/login" className="auth-secondary-link">
              Da co tai khoan? Dang nhap
            </Link>
          </div>
        </article>

        <section className="auth-card">
          <div className="auth-card-top">
            <p className="auth-kicker">Register</p>
            <h2>Tao tai khoan moi</h2>
            <p>Nhap thong tin co ban de khoi tao profile user trong he thong.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="register-name">Ho va ten</label>
              <input
                id="register-name"
                type="text"
                placeholder="Nguyen Van A"
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
              <label htmlFor="register-password">Mat khau</label>
              <input
                id="register-password"
                type="password"
                placeholder="Toi thieu 6 ky tu"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error && (
              <div className="auth-note is-error" aria-live="polite">
                {error}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "DANG TAO..." : "TAO TAI KHOAN"}
            </button>
          </form>

          <div className="auth-divider" />

          <div className="auth-alt">
            <span>Dang co san profile va order pages cho role user.</span>
            <Link to="/login">Dang nhap</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
