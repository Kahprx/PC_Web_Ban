import { useState } from "react";
import { submitContactApi } from "../../services/contactService";
import { notifyError, notifySuccess } from "../../utils/notify";
import "../shared/PageBlocks.css";
import "./ContentPages.css";

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);

  const onChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const result = await submitContactApi(form);
      const ticket = result?.data || null;
      setTicketInfo(ticket);
      setForm(initialForm);
      notifySuccess(result?.message || "Đã gửi liên hệ thành công");
    } catch (error) {
      notifyError(error, "Không gửi được liên hệ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Liên hệ</p>
          <h1 className="page-title">Gửi yêu cầu hỗ trợ trực tiếp cho đội ngũ KAH Gaming.</h1>
          <p className="page-subtitle">
            Form liên hệ đã kết nối backend API. Sau khi gửi thành công, hệ thống trả về mã liên hệ để bạn theo dõi.
          </p>
        </div>
      </section>

      <section className="content-contact-grid">
        <section className="page-panel">
          <div className="page-panel-header">
            <div>
              <p className="page-panel-kicker">Contact Form</p>
              <h2>Gửi thông tin</h2>
            </div>
          </div>

          <form className="page-form" style={{ marginTop: "12px" }} onSubmit={handleSubmit}>
            <div className="page-form-grid">
              <div className="page-field">
                <label>Họ và tên</label>
                <input value={form.fullName} onChange={onChange("fullName")} placeholder="Nguyễn Văn A" />
              </div>
              <div className="page-field">
                <label>Số điện thoại</label>
                <input value={form.phone} onChange={onChange("phone")} placeholder="09xxxxxxxx" />
              </div>
              <div className="page-field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={onChange("email")} placeholder="you@example.com" />
              </div>
              <div className="page-field">
                <label>Chủ đề</label>
                <input value={form.subject} onChange={onChange("subject")} placeholder="Tư vấn build PC" />
              </div>
              <div className="page-field full">
                <label>Nội dung</label>
                <textarea rows={5} value={form.message} onChange={onChange("message")} placeholder="Mô tả nhu cầu của bạn..." />
              </div>
            </div>

            <div className="page-actions">
              <button type="submit" className="page-btn" disabled={submitting}>
                {submitting ? "ĐANG GỬI..." : "GỬI LIÊN HỆ"}
              </button>
            </div>
          </form>
        </section>

        <aside className="page-stack">
          <section className="page-summary-card">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Thông tin hỗ trợ</p>
                <h2>Kênh liên hệ</h2>
              </div>
            </div>

            <div className="page-kv-list" style={{ marginTop: "12px" }}>
              <div className="page-kv-row">
                <p>Hotline</p>
                <span>1900 1984</span>
              </div>
              <div className="page-kv-row">
                <p>Email</p>
                <span>support@kahgaming.vn</span>
              </div>
              <div className="page-kv-row">
                <p>Địa chỉ</p>
                <span>150 đường abc, Quận 1, TP.HCM</span>
              </div>
            </div>
          </section>

          {ticketInfo ? (
            <section className="page-panel">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-kicker">Đã gửi thành công</p>
                  <h2>Mã liên hệ của bạn</h2>
                </div>
              </div>
              <div className="page-kv-list" style={{ marginTop: "12px" }}>
                <div className="page-kv-row">
                  <p>Mã liên hệ</p>
                  <span>{ticketInfo.ticketCode}</span>
                </div>
                <div className="page-kv-row">
                  <p>Thời gian</p>
                  <span>{new Date(ticketInfo.receivedAt).toLocaleString("vi-VN")}</span>
                </div>
                <div className="page-kv-row">
                  <p>Email nhận phản hồi</p>
                  <span>{ticketInfo.email}</span>
                </div>
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </div>
  );
}
