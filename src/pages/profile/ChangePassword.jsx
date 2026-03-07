import "../shared/PageBlocks.css";

const securityTips = [
  {
    title: "Mat khau toi thieu 8 ky tu",
    text: "Nen co chu hoa, chu thuong, so va ky tu dac biet de kho doan hon.",
  },
  {
    title: "Khong dung lai mat khau cu",
    text: "Trach tinh trang ro ri o dich vu khac anh huong den tai khoan mua hang.",
  },
  {
    title: "Doi mat khau sau khi share may",
    text: "Neu vua dang nhap o showroom, may cong ty hoac may ban be, nen doi ngay.",
  },
  {
    title: "Kiem tra email thong bao",
    text: "Day la dau moi de nhan canh bao khi tai khoan co thay doi bat thuong.",
  },
];

const deviceRows = [
  { label: "Chrome / Windows", value: "Dang hoat dong tai TP.HCM" },
  { label: "Safari / iPhone", value: "Lan truy cap gan nhat 2 gio truoc" },
];

export default function ChangePassword() {
  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Security</p>
          <h1 className="page-title">Doi mat khau can duoc trinh bay nhu mot flow bao mat.</h1>
          <p className="page-subtitle">
            Toi da doi man nay tu form rong thanh mot workspace co huong dan, khuyen
            nghi va thong tin session de nguoi dung tin tuong hon khi thao tac.
          </p>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
          <p>Muc tieu</p>
          <strong>Strong password</strong>
          <span>Dat uu tien cho bao mat thay vi mot form thay doi don thuan.</span>
        </article>
        <article className="page-highlight-card">
          <p>Khuyen nghi</p>
          <strong>Khong dung lai</strong>
          <span>Mat khau cu khong nen xuat hien o bat ky dich vu nao khac.</span>
        </article>
        <article className="page-highlight-card">
          <p>Thong bao</p>
          <strong>Email active</strong>
          <span>He thong nen gui mail sau moi lan doi thong tin nhay cam.</span>
        </article>
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Password form</p>
                <h2>Cap nhat thong tin bao mat</h2>
              </div>
            </div>

            <form className="page-form" style={{ marginTop: "12px" }} onSubmit={(event) => event.preventDefault()}>
              <div className="page-form-grid">
                <div className="page-field full">
                  <label>Mat khau hien tai</label>
                  <input type="password" placeholder="Nhap mat khau hien tai" />
                </div>
                <div className="page-field">
                  <label>Mat khau moi</label>
                  <input type="password" placeholder="Nhap mat khau moi" />
                </div>
                <div className="page-field">
                  <label>Xac nhan mat khau moi</label>
                  <input type="password" placeholder="Nhap lai mat khau moi" />
                </div>
                <div className="page-field full">
                  <label>Ghi chu bao mat</label>
                  <textarea
                    rows={3}
                    defaultValue="Sau khi doi mat khau, tai khoan nen duoc dang xuat khoi cac phien cu neu he thong ho tro."
                  />
                </div>
              </div>

              <div className="page-actions">
                <button type="submit" className="page-btn">
                  Cap nhat mat khau
                </button>
              </div>
            </form>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Best practices</p>
                <h2>Checklist truoc khi luu</h2>
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
                <h2>Phien truy cap gan day</h2>
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
              <p>Luu y</p>
              <strong>Session review</strong>
              <span>
                Neu thay thiet bi la, day la diem nen bo sung API dang xuat tat ca
                session va email canh bao.
              </span>
            </div>
          </section>

          <section className="page-support-card">
            <h2 className="page-title">Flow nay hien moi dung o FE.</h2>
            <p className="page-subtitle">
              Neu ban muon day du, buoc tiep theo la them API doi mat khau, validate
              client va thong bao thanh cong that.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
