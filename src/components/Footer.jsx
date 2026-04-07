  import { Link } from "react-router-dom";
import iconFacebook from "../assets/images/PC/ICON/facebook.png";
import iconInstagram from "../assets/images/PC/ICON/instagram.png";
import iconZalo from "../assets/images/PC/ICON/icons8-zalo-40.png";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container mx-auto site-footer-grid">
        <section className="site-footer-brand">
          <p className="site-footer-logo">KAH</p>
          <p className="site-footer-sublogo">PC Gaming Center</p>
          <p>Vị trí uy tín cho dân chơi setup.</p>
          <p>Hỗ trợ build máy theo nhu cầu thật.</p>

          <div className="site-footer-social" aria-label="Mạng xã hội">
            <a href="#" aria-label="Facebook">
              <img src={iconFacebook} alt="Facebook" />
            </a>
            <a href="#" aria-label="Instagram">
              <img src={iconInstagram} alt="Instagram" />
            </a>
            <a href="#" aria-label="Zalo">
              <img src={iconZalo} alt="Zalo" />
            </a>
          </div>
        </section>

        <section>
          <p className="site-footer-title">Sản phẩm</p>
          <p>Bàn phím cơ custom</p>
          <p>Tai nghe IEM</p>
          <p>Gaming Gear</p>
        </section>

        <section>
          <p className="site-footer-title">Hỗ trợ</p>
          <p>
            <Link to="/orders">Tra cứu đơn hàng</Link>
          </p>
          <p>
            <Link to="/policy-warranty">Chính sách / bảo hành</Link>
          </p>
          <p>
            <Link to="/blog">Tin tức / blog</Link>
          </p>
          <p>
            <Link to="/contact">Liên hệ</Link>
          </p>
        </section>

        <section>
          <p className="site-footer-title">Liên hệ</p>
          <p>150 đường abc, Quận 1, TP.HCM</p>
          <p>1900 1984</p>
          <p>support@kahgaming.vn</p>
          <p>
            <Link to="/about">Giới thiệu</Link>
          </p>
        </section>
      </div>
    </footer>
  );
}
