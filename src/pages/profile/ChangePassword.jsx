import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { changePasswordApi } from "../../services/authService";
import { notifyError, notifySuccess } from "../../utils/notify";
import "../shared/PageBlocks.css";

const securityTips = [
  {
    title: "Mật khẩu tối thiểu 8 ký tự",
    text: "Nên có chữ hoa, chữ thường, số và ký tự đặc biệt để tăng độ an toàn.",
  },
  {
    title: "Không dùng lại mật khẩu cũ",
    text: "Tránh rò rỉ từ dịch vụ khác ảnh hưởng đến tài khoản mua hàng.",
  },
  {
    title: "Đổi mật khẩu sau khi dùng máy lạ",
    text: "Nếu vừa đăng nhập ở showroom, máy công ty hoặc máy bạn bè, hãy đổi ngay.",
  },
  {
    title: "Kiểm tra email thông báo",
    text: "Email là nơi nhận cảnh báo khi tài khoản có thay đổi bất thường.",
  },
];

const deviceRows = [
  { label: "Chrome / Windows", value: "Đang hoạt động tại TP.HCM" },
  { label: "Safari / iPhone", value: "Lần truy cập gần nhất 2 giờ trước" },
];

export default function ChangePassword() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    note: "Sau khi đổi mật khẩu, nên đăng xuất khỏi các phiên cũ nếu hệ thống hỗ trợ.",
  });
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(
    () =>
      Boolean(token) &&
      form.currentPassword.length > 0 &&
      form.newPassword.length >= 6 &&
      form.confirmPassword.length >= 6 &&
      form.newPassword === form.confirmPassword,
    [form.confirmPassword, form.currentPassword, form.newPassword, token]
  );

  const handleChange = (key) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      notifyError(new Error("Bạn cần đăng nhập backend để đổi mật khẩu"), "Chưa có phiên backend");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      notifyError(new Error("Xác nhận mật khẩu không khớp"), "Dữ liệu không hợp lệ");
      return;
    }

    try {
      setSaving(true);
      await changePasswordApi(
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
        token
      );

      notifySuccess("Đổi mật khẩu thành công");
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      notifyError(error, "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Security</p>
          <h1 className="page-title">Đổi mật khẩu theo luồng bảo mật rõ ràng.</h1>
          <p className="page-subtitle">
            Form đổi mật khẩu đã kết nối API backend, kiểm tra mật khẩu hiện tại trước khi cập nhật.
          </p>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
          <p>Mục tiêu</p>
          <strong>Mật khẩu mạnh</strong>
          <span>Ưu tiên bảo mật thay vì chỉ đổi mật khẩu cho xong.</span>
        </article>
        <article className="page-highlight-card">
          <p>Khuyến nghị</p>
          <strong>Không dùng lại</strong>
          <span>Mật khẩu cũ không nên xuất hiện ở bất kỳ dịch vụ nào khác.</span>
        </article>
        <article className="page-highlight-card">
          <p>Thông báo</p>
          <strong>Email hoạt động</strong>
          <span>Hệ thống gửi phản hồi API ngay khi đổi mật khẩu thành công.</span>
        </article>
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Password form</p>
                <h2>Cập nhật thông tin bảo mật</h2>
              </div>
            </div>

            <form className="page-form" style={{ marginTop: "12px" }} onSubmit={handleSubmit}>
              <div className="page-form-grid">
                <div className="page-field full">
                  <label>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={form.currentPassword}
                    onChange={handleChange("currentPassword")}
                  />
                </div>
                <div className="page-field">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={form.newPassword}
                    onChange={handleChange("newPassword")}
                  />
                </div>
                <div className="page-field">
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={form.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                  />
                </div>
                <div className="page-field full">
                  <label>Ghi chú bảo mật</label>
                  <textarea rows={3} value={form.note} onChange={handleChange("note")} />
                </div>
              </div>

              <div className="page-actions">
                <button type="submit" className="page-btn" disabled={!canSubmit || saving}>
                  {saving ? "ĐANG CẬP NHẬT..." : "Cập nhật mật khẩu"}
                </button>
              </div>
            </form>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Best practices</p>
                <h2>Checklist trước khi lưu</h2>
              </div>
            </div>

            <div className="page-tip-grid" style={{ marginTop: "12px" }}>
              {securityTips.map((tip) => (
                <article key={tip.title} className="page-tip-card">
                  <strong>{tip.title}</strong>
                  <p>{tip.text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="page-stack">
          <section className="page-summary-card page-sticky">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Recent sessions</p>
                <h2>Phiên truy cập gần đây</h2>
              </div>
            </div>

            <div className="page-checklist" style={{ marginTop: "14px" }}>
              {deviceRows.map((device) => (
                <div key={device.label} className="page-checklist-row">
                  <p>{device.label}</p>
                  <span>{device.value}</span>
                </div>
              ))}
            </div>

            <div className="page-summary-total">
              <p>Lưu ý</p>
              <strong>Session review</strong>
              <span>Nếu thấy thiết bị lạ, hãy đổi mật khẩu ngay và đăng xuất các phiên cũ.</span>
            </div>
          </section>

          <section className="page-support-card">
            <h2 className="page-title">Trạng thái kết nối</h2>
            <p className="page-subtitle">
              {token ? "Form đổi mật khẩu đang hoạt động với API backend." : "Bạn cần đăng nhập backend để thao tác."}
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
