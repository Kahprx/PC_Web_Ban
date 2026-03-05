import iconFacebook from "../assets/images/PC/ICON/facebook.png";
import iconInstagram from "../assets/images/PC/ICON/instagram.png";
import iconZalo from "../assets/images/PC/ICON/icons8-zalo-40.png";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container mx-auto site-footer-grid">
        <section className="site-footer-brand">
          <p className="site-footer-logo">KAH <span>Gaming Gear</span></p>
          <p>Don vi ban le PC & Gaming Gear chinh hang.</p>
          <p>Nhan build cau hinh theo nhu cau va ngan sach.</p>

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
          <p className="site-footer-title">HE THONG CUA HANG</p>
          <p>Chi nhanh Q1, TP.HCM</p>
          <p>Chi nhanh Thu Duc, TP.HCM</p>
          <p>Chi nhanh Ha Noi</p>
        </section>

        <section>
          <p className="site-footer-title">HO TRO KHACH HANG</p>
          <p>Hotline: 1900.XXXX</p>
          <p>Email: support@kahstore.vn</p>
          <p>08:30 - 21:00 (T2 - CN)</p>
        </section>

        <section>
          <p className="site-footer-title">CHINH SACH</p>
          <p>Giao hang nhanh noi thanh</p>
          <p>Tra gop 0% qua the tin dung</p>
          <p>Bao hanh 1 doi 1 theo dieu kien</p>
        </section>
      </div>
    </footer>
  );
}
