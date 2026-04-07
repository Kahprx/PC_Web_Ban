import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { changePasswordApi } from "../../services/authService";
import { notifyError, notifySuccess } from "../../utils/notify";
import "../shared/PageBlocks.css";

const securityTips = [
  {
    title: "Máº­t kháº©u tá»‘i thiá»ƒu 8 kÃ½ tá»±",
    text: "NÃªn cÃ³ chá»¯ hoa, chá»¯ thÆ°á»ng, sá»‘ vÃ  kÃ½ tá»± Ä‘áº·c biá»‡t Ä‘á»ƒ tÄƒng Ä‘á»™ an toÃ n.",
  },
  {
    title: "KhÃ´ng dÃ¹ng láº¡i máº­t kháº©u cÅ©",
    text: "TrÃ¡nh rÃ² rá»‰ tá»« dá»‹ch vá»¥ khÃ¡c áº£nh hÆ°á»Ÿng Ä‘áº¿n tÃ i khoáº£n mua hÃ ng.",
  },
  {
    title: "Äá»•i máº­t kháº©u sau khi dÃ¹ng mÃ¡y láº¡",
    text: "Náº¿u vá»«a Ä‘Äƒng nháº­p á»Ÿ showroom, mÃ¡y cÃ´ng ty hoáº·c mÃ¡y báº¡n bÃ¨, hÃ£y Ä‘á»•i ngay.",
  },
  {
    title: "Kiá»ƒm tra email thÃ´ng bÃ¡o",
    text: "Email lÃ  nÆ¡i nháº­n cáº£nh bÃ¡o khi tÃ i khoáº£n cÃ³ thay Ä‘á»•i báº¥t thÆ°á»ng.",
  },
];

const deviceRows = [
  { label: "Chrome / Windows", value: "Äang hoáº¡t Ä‘á»™ng táº¡i TP.HCM" },
  { label: "Safari / iPhone", value: "Láº§n truy cáº­p gáº§n nháº¥t 2 giá» trÆ°á»›c" },
];

export default function ChangePassword() {
  const { token } = useAuth();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    note: "Sau khi Ä‘á»•i máº­t kháº©u, nÃªn Ä‘Äƒng xuáº¥t khá»i cÃ¡c phiÃªn cÅ© náº¿u há»‡ thá»‘ng há»— trá»£.",
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
      notifyError(new Error("Báº¡n cáº§n Ä‘Äƒng nháº­p backend Ä‘á»ƒ Ä‘á»•i máº­t kháº©u"), "ChÆ°a cÃ³ phiÃªn backend");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      notifyError(new Error("XÃ¡c nháº­n máº­t kháº©u khÃ´ng khá»›p"), "Dá»¯ liá»‡u khÃ´ng há»£p lá»‡");
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

      notifySuccess("Äá»•i máº­t kháº©u thÃ nh cÃ´ng");
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      notifyError(error, "Äá»•i máº­t kháº©u tháº¥t báº¡i");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Security</p>
          <h1 className="page-title">Äá»•i máº­t kháº©u theo luá»“ng báº£o máº­t rÃµ rÃ ng.</h1>
          <p className="page-subtitle">
            Form Ä‘á»•i máº­t kháº©u Ä‘Ã£ káº¿t ná»‘i API backend, kiá»ƒm tra máº­t kháº©u hiá»‡n táº¡i trÆ°á»›c khi cáº­p nháº­t.
          </p>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
          <p>Má»¥c tiÃªu</p>
          <strong>Máº­t kháº©u máº¡nh</strong>
          <span>Æ¯u tiÃªn báº£o máº­t thay vÃ¬ chá»‰ Ä‘á»•i máº­t kháº©u cho xong.</span>
        </article>
        <article className="page-highlight-card">
          <p>Khuyáº¿n nghá»‹</p>
          <strong>KhÃ´ng dÃ¹ng láº¡i</strong>
          <span>Máº­t kháº©u cÅ© khÃ´ng nÃªn xuáº¥t hiá»‡n á»Ÿ báº¥t ká»³ dá»‹ch vá»¥ nÃ o khÃ¡c.</span>
        </article>
        <article className="page-highlight-card">
          <p>ThÃ´ng bÃ¡o</p>
          <strong>Email hoáº¡t Ä‘á»™ng</strong>
          <span>Há»‡ thá»‘ng gá»­i pháº£n há»“i API ngay khi Ä‘á»•i máº­t kháº©u thÃ nh cÃ´ng.</span>
        </article>
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Password form</p>
                <h2>Cáº­p nháº­t thÃ´ng tin báº£o máº­t</h2>
              </div>
            </div>

            <form className="page-form" style={{ marginTop: "12px" }} onSubmit={handleSubmit}>
              <div className="page-form-grid">
                <div className="page-field full">
                  <label>Máº­t kháº©u hiá»‡n táº¡i</label>
                  <input
                    type="password"
                    placeholder="Nháº­p máº­t kháº©u hiá»‡n táº¡i"
                    value={form.currentPassword}
                    onChange={handleChange("currentPassword")}
                  />
                </div>
                <div className="page-field">
                  <label>Máº­t kháº©u má»›i</label>
                  <input
                    type="password"
                    placeholder="Nháº­p máº­t kháº©u má»›i"
                    value={form.newPassword}
                    onChange={handleChange("newPassword")}
                  />
                </div>
                <div className="page-field">
                  <label>XÃ¡c nháº­n máº­t kháº©u má»›i</label>
                  <input
                    type="password"
                    placeholder="Nháº­p láº¡i máº­t kháº©u má»›i"
                    value={form.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                  />
                </div>
                <div className="page-field full">
                  <label>Ghi chÃº báº£o máº­t</label>
                  <textarea rows={3} value={form.note} onChange={handleChange("note")} />
                </div>
              </div>

              <div className="page-actions">
                <button type="submit" className="page-btn" disabled={!canSubmit || saving}>
                  {saving ? "ÄANG Cáº¬P NHáº¬T..." : "Cáº­p nháº­t máº­t kháº©u"}
                </button>
              </div>
            </form>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Best practices</p>
                <h2>Checklist trÆ°á»›c khi lÆ°u</h2>
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
                <h2>PhiÃªn truy cáº­p gáº§n Ä‘Ã¢y</h2>
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
              <p>LÆ°u Ã½</p>
              <strong>Session review</strong>
              <span>Náº¿u tháº¥y thiáº¿t bá»‹ láº¡, hÃ£y Ä‘á»•i máº­t kháº©u ngay vÃ  Ä‘Äƒng xuáº¥t cÃ¡c phiÃªn cÅ©.</span>
            </div>
          </section>

        </div>
      </section>
    </div>
  );
}
