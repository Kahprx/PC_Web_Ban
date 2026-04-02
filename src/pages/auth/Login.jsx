import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./Auth.css";

const loginHighlights = [
  "Phan luong user va admin theo role ngay sau khi dang nhap.",
  "Ho tro ca backend account va local demo account trong cung mot flow.",
  "Trang nay da co bo cuc de giai thich context thay vi chi la form.",
];

const demoAccounts = [
  { label: "User demo", account: "tk1", password: "123456" },
  { label: "Admin demo", account: "tk2", password: "123456" },
];

const LoginSchema = Yup.object({
  account: Yup.string().trim().required("Tai khoan la bat buoc"),
  password: Yup.string().trim().min(6, "Mat khau toi thieu 6 ky tu").required("Mat khau la bat buoc"),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <article className="auth-showcase">
          <p className="auth-kicker">Account access</p>
          <h1>Dang nhap de vao dung workspace va luong mua hang.</h1>
          <p className="auth-lead">
            Cung mot diem vao, he thong co the dua ban vao storefront hoac admin tuy
            theo role. Toi giu nguyen logic cu va lam lai UI cho dung chat mot trang
            auth that.
          </p>

          <div className="auth-badge-row">
            <span className="auth-badge">Role-aware</span>
            <span className="auth-badge">Local + backend</span>
            <span className="auth-badge">Mobile friendly</span>
          </div>

          <div className="auth-feature-list">
            {loginHighlights.map((item) => (
              <article key={item} className="auth-feature-card">
                <strong>Flow</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>

          <div className="auth-credential-grid">
            {demoAccounts.map((demo) => (
              <article key={demo.label} className="auth-credential-card">
                <p>{demo.label}</p>
                <strong>{demo.account}</strong>
                <span>Mat khau: {demo.password}</span>
              </article>
            ))}
          </div>

          <div className="auth-link-row">
            <Link to="/user" className="auth-secondary-link">
              Quay lai trang chu
            </Link>
          </div>
        </article>

        <section className="auth-card">
          <div className="auth-card-top">
            <p className="auth-kicker">Login</p>
            <h2>Dang nhap tai khoan</h2>
            <p>Nhap username, email hoac tai khoan demo de truy cap nhanh vao he thong.</p>
          </div>

          <Formik
            initialValues={{ account: "", password: "" }}
            validationSchema={LoginSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              try {
                setStatus("");
                const session = await login(values);
                notifySuccess("Dang nhap thanh cong");

                if (session?.role === "admin") {
                  navigate("/admin/dashboard", { replace: true });
                  return;
                }

                navigate("/", { replace: true });
              } catch (error) {
                setStatus(error?.message || "Dang nhap that bai");
                notifyError(error, "Dang nhap that bai");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, status }) => (
              <Form className="auth-form">
                <div className="auth-field">
                  <label htmlFor="account">Tai khoan</label>
                  <Field id="account" name="account" type="text" placeholder="username hoac email" />
                  <ErrorMessage name="account" component="div" className="auth-note is-error" />
                </div>

                <div className="auth-field">
                  <label htmlFor="password">Mat khau</label>
                  <Field id="password" name="password" type="password" placeholder="Nhap mat khau" />
                  <ErrorMessage name="password" component="div" className="auth-note is-error" />
                </div>

                {status ? (
                  <div className="auth-note is-error" aria-live="polite">
                    {status}
                  </div>
                ) : null}

                <button type="submit" className="auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? "DANG DANG NHAP..." : "DANG NHAP"}
                </button>
              </Form>
            )}
          </Formik>

          <div className="auth-divider" />

          <div className="auth-alt">
            <Link to="/forgot-password">Quen mat khau?</Link>
            <Link to="/register">Tao tai khoan moi</Link>
          </div>

          <div className="auth-note">
            Neu nhap email, he thong uu tien thu backend truoc. Neu dang dung username
            nhu <strong>tk1</strong> hoac <strong>tk2</strong>, app se dung local demo account.
          </div>
        </section>
      </div>
    </div>
  );
}
