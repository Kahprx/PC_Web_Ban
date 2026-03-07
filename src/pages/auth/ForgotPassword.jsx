import { Link } from "react-router-dom";
import "./Auth.css";

const recoverySteps = [
  "Nhap email da dang ky de he thong xac dinh tai khoan.",
  "Gui link khoi phuc hoac OTP de xac nhan danh tinh.",
  "Dat mat khau moi va thong bao lai cho user khi thanh cong.",
];

export default function ForgotPassword() {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <article className="auth-showcase">
          <p className="auth-kicker">Recovery</p>
          <h1>Trang quen mat khau can giai thich ro quy trinh khoi phuc.</h1>
          <p className="auth-lead">
            Hien tai project moi co FE placeholder cho buoc nay, nen toi bo sung them
            context va cac buoc xu ly de man hinh khong bi trong.
          </p>

          <div className="auth-feature-list">
            {recoverySteps.map((item, index) => (
              <article key={item} className="auth-feature-card">
                <strong>Buoc {index + 1}</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>

          <div className="auth-link-row">
            <Link to="/login" className="auth-secondary-link">
              Quay lai dang nhap
            </Link>
          </div>
        </article>

        <section className="auth-card">
          <div className="auth-card-top">
            <p className="auth-kicker">Forgot password</p>
            <h2>Khoi phuc tai khoan</h2>
            <p>Nhap email da dang ky, sau do he thong se huong dan buoc tiep theo.</p>
          </div>

          <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
            <div className="auth-field">
              <label htmlFor="forgot-email">Email</label>
              <input id="forgot-email" type="email" placeholder="you@example.com" />
            </div>

            <button type="submit" className="auth-submit">
              GUI YEU CAU KHOI PHUC
            </button>
          </form>

          <div className="auth-divider" />

          <div className="auth-note">
            Luong gui mail that chua duoc noi backend. Day la man FE duoc hoan thien
            giao dien de san sang cho API sau.
          </div>

          <div className="auth-alt">
            <Link to="/login">Ve dang nhap</Link>
            <Link to="/register">Tao tai khoan</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
