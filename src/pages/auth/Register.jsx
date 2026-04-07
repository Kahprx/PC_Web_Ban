import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./Auth.css";

const RegisterSchema = Yup.object({
  fullName: Yup.string().trim().min(2, "Name must be at least 2 characters").required("Full name is required"),
  email: Yup.string().trim().email("Invalid email").required("Email is required"),
  password: Yup.string().trim().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Password confirmation does not match")
    .required("Password confirmation is required"),
});

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <article className="auth-showcase">
          <p className="auth-kicker">Tài khoản mới</p>
          <h1>Tạo tài khoản để quản lý đơn hàng và hồ sơ cá nhân.</h1>
          <p className="auth-lead">
            Form đăng ký đã kết nối backend API: tạo tài khoản thật, lưu thông tin người dùng và đồng bộ với các trang
            khác.
          </p>

          <div className="auth-link-row">
            <Link to="/login" className="auth-secondary-link">
              Đã có tài khoản? Đăng nhập
            </Link>
          </div>
        </article>

        <section className="auth-card">
          <div className="auth-card-top">
            <p className="auth-kicker">Đăng ký</p>
            <h2>Tạo tài khoản</h2>
            <p>Điền thông tin cơ bản để tạo hồ sơ người dùng trên hệ thống.</p>
          </div>

          <Formik
            initialValues={{
              fullName: "",
              email: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={RegisterSchema}
            onSubmit={async (values, { setSubmitting, setStatus }) => {
              try {
                setStatus("");
                await register({
                  fullName: values.fullName,
                  email: values.email,
                  password: values.password,
                });
                notifySuccess("Register success");
                navigate("/profile", { replace: true });
              } catch (error) {
                setStatus(error?.message || "Register failed");
                notifyError(error, "Register failed");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, status }) => (
              <Form className="auth-form">
                <div className="auth-field">
                  <label htmlFor="fullName">Họ và tên</label>
                  <Field id="fullName" name="fullName" type="text" placeholder="Nguyen Van A" />
                  <ErrorMessage name="fullName" component="div" className="auth-note is-error" />
                </div>

                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <Field id="email" name="email" type="email" placeholder="you@example.com" />
                  <ErrorMessage name="email" component="div" className="auth-note is-error" />
                </div>

                <div className="auth-field">
                  <label htmlFor="password">Mật khẩu</label>
                  <Field id="password" name="password" type="password" placeholder="Tối thiểu 6 ký tự" />
                  <ErrorMessage name="password" component="div" className="auth-note is-error" />
                </div>

                <div className="auth-field">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="auth-note is-error" />
                </div>

                {status ? (
                  <div className="auth-note is-error" aria-live="polite">
                    {status}
                  </div>
                ) : null}

                <button type="submit" className="auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? "ĐANG TẠO..." : "TẠO TÀI KHOẢN"}
                </button>
              </Form>
            )}
          </Formik>

          <div className="auth-divider" />

          <div className="auth-alt">
            <span>Hồ sơ và đơn hàng sẽ đồng bộ theo tài khoản backend.</span>
            <Link to="/login">Đăng nhập</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
