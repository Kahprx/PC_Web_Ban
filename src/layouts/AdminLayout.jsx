import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { applyRevealMotion } from "../utils/revealMotion";

import iconAdmin from "../assets/images/PC/ICON/administrator.png";
import iconDashboard from "../assets/images/PC/ICON/dashboard.png";
import iconProduct from "../assets/images/PC/ICON/box.png";
import iconOrder from "../assets/images/PC/ICON/clipboard.png";
import iconUser from "../assets/images/PC/ICON/user.png";
import iconStatistic from "../assets/images/PC/ICON/profit-growth.png";
import iconLogout from "../assets/images/PC/ICON/logout.png";
import iconSearch from "../assets/images/PC/ICON/search.png";
import iconBell from "../assets/images/PC/ICON/bell.png";
import iconSupport from "../assets/images/PC/ICON/paper-plane.png";
import iconPhone from "../assets/images/PC/ICON/phone-call.png";
import iconLocation from "../assets/images/PC/ICON/location.png";
import iconShipping from "../assets/images/PC/ICON/delivery-truck.png";
import iconClock from "../assets/images/PC/ICON/clock.png";
import "./AdminLayout.css";

const adminNav = [
  { to: "/admin/dashboard", label: "DASHBOARD", icon: iconDashboard },
  { to: "/admin/products", label: "SẢN PHẨM", icon: iconProduct },
  { to: "/admin/orders", label: "ĐƠN HÀNG", icon: iconOrder },
  { to: "/admin/support-chat", label: "CHAT HỖ TRỢ", icon: iconSupport },
  { to: "/admin/users", label: "USER", icon: iconUser },
  { to: "/admin/dashboard", label: "THỐNG KÊ", icon: iconStatistic },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const routeKey = `${location.pathname}${location.search}`;

  useEffect(() => {
    let cleanupReveal = () => {};
    const rafId = window.requestAnimationFrame(() => {
      cleanupReveal = applyRevealMotion(document);
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      cleanupReveal();
    };
  }, [location.pathname, location.search]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src={iconAdmin} alt="Admin" />
          <div>
            <strong>KAH</strong>
            <span>ADMIN</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {adminNav.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              className={({ isActive }) => `admin-sidebar-link ${isActive ? "is-active" : ""}`}
            >
              <img src={item.icon} alt={item.label} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="admin-sidebar-logout"
          onClick={() => {
            logout();
            navigate("/login", { replace: true });
          }}
        >
          <img src={iconLogout} alt="Logout" />
          <span>ĐĂNG XUẤT</span>
        </button>
      </aside>

      <section className="admin-workspace">
        <header className="admin-header">
          <div className="admin-header-strip">
            <div className="admin-strip-group">
              <span>
                <img src={iconPhone} alt="Phone" />
                HOTLINE: 1800.XXXX
              </span>
              <span>
                <img src={iconLocation} alt="Location" />
                Showroom: TP.HCM
              </span>
            </div>

            <div className="admin-strip-group">
              <span>
                <img src={iconShipping} alt="Shipping" />
                Giao hàng siêu tốc trong 2h
              </span>
              <span>
                <img src={iconClock} alt="Clock" />
                mở cửa: 08:30 - 21:00
              </span>
            </div>
          </div>

          <div className="admin-header-main">
            <div className="admin-header-logo" aria-label="KAH Gaming">
              <strong>KAH</strong>
              <small>GAMING</small>
            </div>

            <label className="admin-header-search" aria-label="Tìm kiếm sản phẩm">
              <img src={iconSearch} alt="Search" />
              <input type="text" placeholder="Tìm kiếm sản phẩm..." />
            </label>

            <div className="admin-header-actions">
              <button type="button" className="admin-theme-toggle" onClick={toggleTheme}>
                {isDark ? "LIGHT" : "DARK"}
              </button>

              <button type="button" className="admin-header-bell" aria-label="Thông báo">
                <img src={iconBell} alt="Bell" />
              </button>

              <div className="admin-header-user">
                <span>{(session?.account || "admin").toUpperCase()}</span>
                <img src={iconUser} alt="Admin user" />
              </div>
            </div>
          </div>
        </header>

        <main className="admin-page-wrap motion-route-shell">
          <div className="motion-route-view" key={routeKey}>
            <Outlet />
          </div>
        </main>
      </section>
    </div>
  );
}
