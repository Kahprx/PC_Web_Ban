import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./Auth.css";

const LoginSchema = Yup.object({
  email: Yup.string().trim().email("Invalid email").required("Email is required"),
  password: Yup.string().trim().min(6, "Password must be at least 6 characters").required("Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <article className="auth-showcase">
          <p className="auth-kicker">Truy cập tài khoản</p>
          <h1>Đăng nhập để sử dụng đầy đủ tính năng tài khoản.</h1>
          <p className="auth-lead">
            Biểu mẫu này kết nối trực tiếp API backend. Hồ sơ, lịch sử đơn hàng và quyền truy cập sẽ được đồng bộ
            theo tài khoản của bạn.
          </p>

          <div className="auth-link-row">
            <Link to="/user" className="auth-secondary-link">
              Về trang chủ
            </Link>
          </div>
        </article>

        <section className="auth-card">
          <div className="auth-card-top">
            <p className="auth-kicker">Đăng nhập</p>
            <h2>Vào tài khoản</h2>
            <p>Nhập email và mật khẩu để tiếp tục.</p>
          </div>

          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={LoginSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              try {
                setStatus("");
                const session = await login({
                  email: values.email,
                  password: values.password,
                });

                notifySuccess("Login success");

                if (session?.role === "admin") {
                  navigate("/admin/dashboard", { replace: true });
                  return;
                }

                navigate("/", { replace: true });
              } catch (error) {
                setStatus(error?.message || "Login failed");
                notifyError(error, "Login failed");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, status }) => (
              <Form className="auth-form">
                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <Field id="email" name="email" type="email" placeholder="you@example.com" />
                  <ErrorMessage name="email" component="div" className="auth-note is-error" />
                </div>

                <div className="auth-field">
                  <label htmlFor="password">Mật khẩu</label>
                  <Field id="password" name="password" type="password" placeholder="Nhập mật khẩu" />
                  <ErrorMessage name="password" component="div" className="auth-note is-error" />
                </div>

                {status ? (
                  <div className="auth-note is-error" aria-live="polite">
                    {status}
                  </div>
                ) : null}

                <button type="submit" className="auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP"}
                </button>
              </Form>
            )}
          </Formik>

          <div className="auth-divider" />

          <div className="auth-alt">
            <Link to="/forgot-password">Quên mật khẩu?</Link>
            <Link to="/register">Tạo tài khoản</Link>
          </div>

          <div className="auth-note">Bạn cần tài khoản backend để lưu và đồng bộ dữ liệu thực theo người dùng.</div>
        </section>
      </div>
    </div>
  );
}
