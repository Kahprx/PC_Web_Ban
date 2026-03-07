import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../shared/PageBlocks.css";

const profileTips = [
  "Luu dia chi nhan hang mac dinh de checkout nhanh hon.",
  "Dung email chinh de khong bo lo xac nhan bao hanh va ma don.",
  "Cap nhat so dien thoai de sale callback khi can doi linh kien.",
];

const quickActions = [
  { label: "Xem don hang", href: "/orders" },
  { label: "Doi mat khau", href: "/change-password" },
  { label: "Build PC", href: "/build-pc" },
];

const getInitials = (name = "User Demo") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export default function Profile() {
  const { session } = useAuth();

  const safeName = session?.name || "Khach hang";
  const safeEmail = session?.email || "customer@demo.local";
  const safeAccount = session?.account || "guest";
  const safeSource = session?.source === "backend" ? "Backend account" : "Local demo";
  const safeRole = session?.role || "user";
  const lastLogin = session?.loginAt
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(session.loginAt))
    : "Chua co du lieu";

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">My account</p>
          <h1 className="page-title">Trang profile can cho thay ro danh tinh va thao tac nhanh.</h1>
          <p className="page-subtitle">
            Toi da doi trang tai khoan tu form co ban thanh mot workspace co tom tat
            tai khoan, thong tin lien he, quick actions va cac ghi chu de user de
            quay lai don hang hoac doi mat khau.
          </p>

          <div className="page-hero-actions">
            <span className="page-inline-code">{safeSource}</span>
            <Link to="/orders" className="page-btn-outline">
              Xem lich su don
            </Link>
          </div>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
          <p>Kenh dang nhap</p>
          <strong>{safeSource}</strong>
          <span>Giup phan biet tai khoan local demo va backend account.</span>
        </article>

        <article className="page-highlight-card">
          <p>Vai tro</p>
          <strong>{safeRole}</strong>
          <span>Dang mo giao dien danh cho role user trong he thong.</span>
        </article>

        <article className="page-highlight-card">
          <p>Lan dang nhap</p>
          <strong>{lastLogin}</strong>
          <span>Moc tham chieu de user kiem tra bao mat tai khoan.</span>
        </article>
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Profile form</p>
                <h2>Thong tin ca nhan va dia chi mac dinh</h2>
              </div>
              <p>Ban hien dang dang nhap voi tai khoan {safeAccount}.</p>
            </div>

            <form className="page-form" style={{ marginTop: "12px" }} onSubmit={(event) => event.preventDefault()}>
              <div className="page-form-grid">
                <div className="page-field">
                  <label>Ho va ten</label>
                  <input type="text" defaultValue={safeName} />
                </div>
                <div className="page-field">
                  <label>Email</label>
                  <input type="email" defaultValue={safeEmail} />
                </div>
                <div className="page-field">
                  <label>So dien thoai</label>
                  <input type="text" placeholder="09xxxxxxxx" defaultValue="0909 123 456" />
                </div>
                <div className="page-field">
                  <label>Ngay sinh</label>
                  <input type="date" defaultValue="2000-01-01" />
                </div>
                <div className="page-field full">
                  <label>Dia chi nhan hang mac dinh</label>
                  <textarea
                    rows={4}
                    defaultValue="123 Nguyen Van Linh, Phuong Tan Phong, Quan 7, TP.HCM"
                  />
                </div>
                <div className="page-field full">
                  <label>Ghi chu giao hang</label>
                  <textarea
                    rows={3}
                    defaultValue="Goi truoc 15 phut. Neu giao gio hanh chinh thi nhan tai quay tiep tan."
                  />
                </div>
              </div>

              <div className="page-actions">
                <button type="submit" className="page-btn">
                  Luu thay doi
                </button>
                <Link to="/change-password" className="page-btn-outline">
                  Doi mat khau
                </Link>
              </div>
            </form>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Quick actions</p>
                <h2>Cac thao tac thuong dung</h2>
              </div>
            </div>

            <div className="page-tip-grid" style={{ marginTop: "12px" }}>
              {quickActions.map((item) => (
                <article key={item.label} className="page-tip-card">
                  <strong>{item.label}</strong>
                  <p>Mo nhanh chuc nang lien quan ma khach hay quay lai trong hanh trinh mua hang.</p>
                  <div className="page-actions" style={{ marginTop: "10px" }}>
                    <Link to={item.href} className="page-btn-outline">
                      Di den trang
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
                <p>Trang thai</p>
                <span>Dang hoat dong</span>
              </div>
              <div className="page-kv-row">
                <p>Lan dang nhap</p>
                <span>{lastLogin}</span>
              </div>
            </div>

            <div className="page-slim-divider" />

            <div className="page-tip-grid">
              {profileTips.map((tip) => (
                <article key={tip} className="page-tip-card">
                  <strong>Luu y</strong>
                  <p>{tip}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="page-support-card">
            <h2 className="page-title">Muon doi sang luong profile that?</h2>
            <p className="page-subtitle">
              Hien tai day moi la FE workspace. Neu can, toi co the noi form nay vao
              API cap nhat profile de luu du lieu that cho backend.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
}
