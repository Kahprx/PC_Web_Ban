import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { profileApi, updateProfileApi } from "../../services/authService";
import { notifyError, notifySuccess } from "../../utils/notify";
import "../shared/PageBlocks.css";

const profileTips = [
  "Lưu địa chỉ nhận hàng mặc định để checkout nhanh.",
  "Dùng email chính để nhận thông báo bảo hành và mã đơn.",
  "Cập nhật số điện thoại để kỹ thuật liên hệ khi cần.",
];

const quickActions = [
  { label: "Xem đơn hàng", href: "/orders" },
  { label: "Đổi mật khẩu", href: "/change-password" },
  { label: "Bảo hành", href: "/policy-warranty" },
  { label: "Build PC", href: "/build-pc" },
];

const getInitials = (name = "User Demo") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const buildInitialForm = (session) => ({
  fullName: session?.name || "",
  email: session?.email || "",
  phone: session?.phone || "",
  birthDate: session?.birthDate || "",
  defaultShippingAddress: session?.defaultShippingAddress || "",
  deliveryNote: session?.deliveryNote || "",
});

export default function Profile() {
  const { session, token, refreshProfile } = useAuth();
  const [form, setForm] = useState(() => buildInitialForm(session));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildInitialForm(session));
  }, [session]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const profile = await profileApi(token);
        if (!mounted || !profile) return;

        setForm({
          fullName: profile.full_name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          birthDate: profile.birth_date ? String(profile.birth_date).slice(0, 10) : "",
          defaultShippingAddress: profile.default_shipping_address || "",
          deliveryNote: profile.delivery_note || "",
        });
      } catch (error) {
        notifyError(error, "Không tải được hồ sơ từ backend");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [token]);

  const safeName = form.fullName || session?.name || "Khách hàng";
  const safeEmail = form.email || session?.email || "customer@demo.local";
  const safeAccount = session?.account || "guest";
  const safeSource = session?.source === "backend" ? "Tài khoản backend" : "Demo local";
  const safeRole = session?.role || "user";
  const lastLogin = session?.loginAt
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(session.loginAt))
    : "Chưa có dữ liệu";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      notifyError(new Error("Bạn cần đăng nhập backend để lưu hồ sơ"), "Chưa có phiên backend");
      return;
    }

    const payload = {
      fullName: String(form.fullName || "").trim(),
      email: String(form.email || "").trim(),
      phone: String(form.phone || "").trim(),
      birthDate: String(form.birthDate || "").trim(),
      defaultShippingAddress: String(form.defaultShippingAddress || "").trim(),
      deliveryNote: String(form.deliveryNote || "").trim(),
    };

    if (!payload.fullName || !payload.email) {
      notifyError(new Error("Họ tên và email là bắt buộc"), "Thiếu thông tin");
      return;
    }

    try {
      setSaving(true);
      await updateProfileApi(payload, token);
      await refreshProfile();
      notifySuccess("Đã lưu hồ sơ lên backend");
    } catch (error) {
      notifyError(error, "Lưu hồ sơ thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">My account</p>
          <h1 className="page-title">Quản lý tài khoản gọn, rõ và thao tác nhanh.</h1>
          <p className="page-subtitle">Quản lý hồ sơ cá nhân và thông tin nhận hàng.</p>

          <div className="page-hero-actions">
            <span className="page-inline-code">{safeSource}</span>
            <Link to="/orders" className="page-btn-outline">
              Xem lịch sử đơn
            </Link>
          </div>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
          <p>Vai trò</p>
          <strong>{safeRole}</strong>
          <span>Quyền hiện tại của phiên đăng nhập.</span>
        </article>

        <article className="page-highlight-card">
          <p>Lần đăng nhập</p>
          <strong>{lastLogin}</strong>
          <span>Thông tin phiên gần nhất.</span>
        </article>
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Profile form</p>
                <h2>Thông tin cá nhân và địa chỉ mặc định</h2>
              </div>
              <p>Bạn đang đăng nhập với tài khoản {safeAccount}.</p>
            </div>

            <form className="page-form" style={{ marginTop: "12px" }} onSubmit={handleSubmit}>
              <div className="page-form-grid">
                <div className="page-field">
                  <label>Họ và tên</label>
                  <input type="text" value={form.fullName} onChange={handleChange("fullName")} />
                </div>
                <div className="page-field">
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={handleChange("email")} />
                </div>
                <div className="page-field">
                  <label>Số điện thoại</label>
                  <input type="text" placeholder="09xxxxxxxx" value={form.phone} onChange={handleChange("phone")} />
                </div>
                <div className="page-field">
                  <label>Ngày sinh</label>
                  <input type="date" value={form.birthDate} onChange={handleChange("birthDate")} />
                </div>
                <div className="page-field full">
                  <label>Địa chỉ nhận hàng mặc định</label>
                  <textarea rows={4} value={form.defaultShippingAddress} onChange={handleChange("defaultShippingAddress")} />
                </div>
                <div className="page-field full">
                  <label>Ghi chú giao hàng</label>
                  <textarea rows={3} value={form.deliveryNote} onChange={handleChange("deliveryNote")} />
                </div>
              </div>

              <div className="page-actions">
                <button type="submit" className="page-btn" disabled={!token || loading || saving}>
                  {saving ? "ĐANG LƯU..." : "Lưu thay đổi"}
                </button>
                <Link to="/change-password" className="page-btn-outline">
                  Đổi mật khẩu
                </Link>
              </div>
            </form>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Quick actions</p>
                <h2>Thao tác thường dùng</h2>
              </div>
            </div>

            <div className="page-tip-grid" style={{ marginTop: "12px" }}>
              {quickActions.map((item) => (
                <article key={item.label} className="page-tip-card">
                  <strong>{item.label}</strong>
                  <p>Mở nhanh tính năng liên quan trong quá trình mua hàng.</p>
                  <div className="page-actions" style={{ marginTop: "10px" }}>
                    <Link to={item.href} className="page-btn-outline">
                      Đi đến trang
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="page-stack">
          <section className="page-account-card page-sticky">
            <div className="page-account-head">
              <div className="page-avatar">{getInitials(safeName) || "KH"}</div>
              <div>
                <h3>{safeName}</h3>
                <p>{safeEmail}</p>
              </div>
            </div>

            <div className="page-pill-row">
              <span className="page-pill">{safeRole}</span>
              <span className="page-pill is-soft">{safeSource}</span>
            </div>

            <div className="page-kv-list">
              <div className="page-kv-row">
                <p>Account</p>
                <span>{safeAccount}</span>
              </div>
              <div className="page-kv-row">
                <p>Lần đăng nhập</p>
                <span>{lastLogin}</span>
              </div>
            </div>

            <div className="page-slim-divider" />

            <div className="page-tip-grid">
              {profileTips.map((tip) => (
                <article key={tip} className="page-tip-card">
                  <strong>Lưu ý</strong>
                  <p>{tip}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
