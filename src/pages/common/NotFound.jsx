import { Link } from "react-router-dom";
import "./NotFound.css";

const quickLinks = [
  { label: "Về trang chủ", href: "/user" },
  { label: "Xem sản phẩm", href: "/products" },
  { label: "Build PC", href: "/build-pc" },
];

export default function NotFound() {
  return (
    <section className="notfound-page">
      <div className="notfound-shell">
        <article className="notfound-card">
          <p className="notfound-kicker">404</p>
          <h1>Trang bạn tìm hiện không tồn tại.</h1>
          <p className="notfound-lead">
            Màn 404 đã được rút gọn, rõ thông tin và có lối quay lại nhanh để không gián đoạn trải nghiệm.
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
          <p className="notfound-kicker">Gợi ý</p>
          <h2>Điểm vào chính</h2>

          <div className="notfound-list">
            <div>
              <strong>/user</strong>
              <span>Trang home storefront.</span>
            </div>
            <div>
              <strong>/products</strong>
              <span>Danh sách sản phẩm và bộ lọc.</span>
            </div>
            <div>
              <strong>/build-pc</strong>
              <span>Workspace build PC.</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
