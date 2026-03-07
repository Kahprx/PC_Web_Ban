import { Link } from "react-router-dom";
import "./NotFound.css";

const quickLinks = [
  { label: "Ve trang chu", href: "/user" },
  { label: "Xem san pham", href: "/products" },
  { label: "Build PC", href: "/build-pc" },
];

export default function NotFound() {
  return (
    <section className="notfound-page">
      <div className="notfound-shell">
        <article className="notfound-card">
          <p className="notfound-kicker">404</p>
          <h1>Trang ban tim hien khong ton tai trong route hien tai.</h1>
          <p className="notfound-lead">
            Toi da doi trang not found tu mot card co ban thanh mot man fallback co
            hierarchy, giai thich va lo trinh quay lai app.
          </p>

          <div className="notfound-badge-row">
            <span>Route missing</span>
            <span>Safe fallback</span>
            <span>User recovery</span>
          </div>

          <div className="notfound-actions">
            {quickLinks.map((item) => (
              <Link key={item.href} to={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </article>

        <aside className="notfound-panel">
          <p className="notfound-kicker">Goi y</p>
          <h2>Thu cac diem vao chinh</h2>

          <div className="notfound-list">
            <div>
              <strong>/user</strong>
              <span>Trang home storefront.</span>
            </div>
            <div>
              <strong>/products</strong>
              <span>Danh sach san pham va filter.</span>
            </div>
            <div>
              <strong>/build-pc</strong>
              <span>Workspace build PC da duoc lam lai UI.</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
