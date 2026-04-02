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
          <p>Vi tri uy tin cho dan choi setup.</p>
          <p>Ho tro build may theo nhu cau that.</p>

          <div className="site-footer-social" aria-label="Mang xa hoi">
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
          <p className="site-footer-title">San pham</p>
          <p>Ban phim co custom</p>
          <p>Tai nghe IEM</p>
          <p>Gaming Gear</p>
        </section>

        <section>
          <p className="site-footer-title">Ho tro</p>
          <p>Tra cuu don hang</p>
          <p>Tai khoan cua ban</p>
          <p>Lien he</p>
        </section>

        <section>
          <p className="site-footer-title">Lien he</p>
          <p>150 duong abc, Quan 1, TP.HCM</p>
          <p>1900 1984</p>
          <p>support@kahgaming.vn</p>
        </section>
      </div>
    </footer>
  );
}
