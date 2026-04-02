import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./Auth.css";

const registerBenefits = [
  "Luu profile va dia chi giao hang de checkout nhanh hon.",
  "Theo doi lich su don, trang thai xu ly va thong tin bao hanh.",
  "San sang de noi tiep voi backend khi project chuyen sang du lieu that.",
];

const RegisterSchema = Yup.object({
  fullName: Yup.string().trim().min(2, "Ho ten toi thieu 2 ky tu").required("Ho ten la bat buoc"),
  email: Yup.string().trim().email("Email khong hop le").required("Email la bat buoc"),
  password: Yup.string().trim().min(6, "Mat khau toi thieu 6 ky tu").required("Mat khau la bat buoc"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Xac nhan mat khau khong khop")
    .required("Xac nhan mat khau la bat buoc"),
});

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

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
                notifySuccess("Dang ky thanh cong");
                navigate("/profile", { replace: true });
              } catch (error) {
                setStatus(error?.message || "Dang ky that bai");
                notifyError(error, "Dang ky that bai");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting, status }) => (
              <Form className="auth-form">
                <div className="auth-field">
                  <label htmlFor="fullName">Ho va ten</label>
                  <Field id="fullName" name="fullName" type="text" placeholder="Nguyen Van A" />
                  <ErrorMessage name="fullName" component="div" className="auth-note is-error" />
                </div>

                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <Field id="email" name="email" type="email" placeholder="you@example.com" />
                  <ErrorMessage name="email" component="div" className="auth-note is-error" />
                </div>

                <div className="auth-field">
                  <label htmlFor="password">Mat khau</label>
                  <Field id="password" name="password" type="password" placeholder="Toi thieu 6 ky tu" />
                  <ErrorMessage name="password" component="div" className="auth-note is-error" />
                </div>

                <div className="auth-field">
                  <label htmlFor="confirmPassword">Xac nhan mat khau</label>
                  <Field
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Nhap lai mat khau"
                  />
                  <ErrorMessage name="confirmPassword" component="div" className="auth-note is-error" />
                </div>

                {status ? (
                  <div className="auth-note is-error" aria-live="polite">
                    {status}
                  </div>
                ) : null}

                <button type="submit" className="auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? "DANG TAO..." : "TAO TAI KHOAN"}
                </button>
              </Form>
            )}
          </Formik>

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
