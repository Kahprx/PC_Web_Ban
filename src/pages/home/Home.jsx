import { Link } from "react-router-dom";
import {
  formatCurrency,
  homeCollectionSections,
  homeFeaturedCards,
  homeHeroBanners,
  homePromoBanners,
} from "../../data/storeData";

import iconFlash from "../../assets/images/PC/ICON/flash-sale.png";
import "./Home.css";

const categoryChips = [
  "TẤT CẢ",
  "PC GAMING",
  "WORK STATION",
  "MÀN HÌNH 4K",
  "LAPTOP AI",
  "GAMING GEAR",
  "ÂM THANH",
];

const detailTitleById = {
  "home-collection-pc": "PC BÁN CHẠY | TRẢ GÓP 0%",
  "home-collection-mouse": "CHUỘT BÁN CHẠY | TRẢ GÓP 0%",
  "home-collection-keyboard": "BÀN PHÍM HE RAPID TRIGGER | TRẢ GÓP 0%",
  "home-collection-monitor": "MÀN HÌNH BÁN CHẠY | TRẢ GÓP 0%",
  "home-collection-audio": "TAI NGHE BÁN CHẠY | TRẢ GÓP 0%",
};

const toTagLabel = (tag) => String(tag || "").replace(/\s+/g, " ").trim().toUpperCase();

export default function Home() {
  return (
    <div className="home-page">
      <div className="home-shell">
        <section className="home-hero-grid">
          <article className="home-hero-main-card home-hero-main-card-service">
            {homeHeroBanners.main && <img src={homeHeroBanners.main} alt="Main hero" />}

            <div className="home-hero-main-content">
              <p className="home-hero-main-kicker">Exclusive Service</p>
              <h1>
                Sửa chữa & Nâng cấp
                <br />
                PC chuyên nghiệp
              </h1>
              <p className="home-hero-main-text">
                Dịch vụ bảo trì và nâng cấp cấu hình máy tính theo tiêu chuẩn Gaming quốc tế.
              </p>
              <Link to="/build-pc" className="home-hero-main-cta">
                Đặt lịch ngay
              </Link>
            </div>
          </article>

          <article className="home-hero-side-card home-hero-side-card-offer">
            {homeHeroBanners.rightTop && <img src={homeHeroBanners.rightTop} alt="Ưu đãi" />}
            <div className="home-hero-side-label home-hero-side-label-offer">
              <strong>ƯU ĐÃI LINH KIỆN</strong>
              <small>Giảm giá 40%</small>
            </div>
          </article>

          <article className="home-hero-side-card home-hero-side-card-build">
            {homeHeroBanners.rightBottom && <img src={homeHeroBanners.rightBottom} alt="Build" />}
            <div className="home-hero-side-label home-hero-side-label-build">BUILD PC GAMING</div>
          </article>
        </section>

        <section className="home-chip-row">
          {categoryChips.map((chip) => (
            <Link key={chip} to="/products" className="home-chip-item">
              {chip}
            </Link>
          ))}
        </section>

        <section className="home-highlight">
          <header className="home-highlight-head">
            <div>
              <p>
                <img src={iconFlash} alt="Flash" className="home-flash-icon" />
                FLASH SALE
              </p>
              <h2>SẢN PHẨM NỔI BẬT</h2>
            </div>
            <Link to="/products">XEM TẤT CẢ</Link>
          </header>

          <div className="home-highlight-grid">
            {homeFeaturedCards.slice(0, 6).map((card, index) => {
              return (
                <Link
                  key={`${card.title}-${index}`}
                  to={card?.href || "/products"}
                  className="home-highlight-card"
                >
                  <div className="home-highlight-image-wrap">
                    <img src={card?.image} alt={card.title} />
                  </div>
                  <small>{card.type}</small>
                  <h3>{card.title}</h3>
                  <span>{formatCurrency(card.price || 0)}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="home-detail">
          <p className="home-detail-label">detail</p>

          <div className="home-detail-banner-row">
            {homePromoBanners.slice(0, 2).map((banner, index) => (
              <Link key={`promo-${index}`} to="/build-pc" className="home-detail-banner">
                <img src={banner} alt={`Khuyến mãi ${index + 1}`} />
              </Link>
            ))}
          </div>

          <div className="home-detail-sections">
            {homeCollectionSections.map((section) => (
              <article key={section.id} className="home-detail-strip">
                <header className="home-detail-strip-head">
                  <h3>{detailTitleById[section.id] || section.title}</h3>

                  <div className="home-detail-strip-tags">
                    {section.tags.slice(0, 8).map((tag) => (
                      <span key={`${section.id}-${tag}`}>{toTagLabel(tag)}</span>
                    ))}
                  </div>
                </header>

                <div className="home-detail-strip-body">
                  <button type="button" className="home-strip-arrow home-strip-arrow-left" aria-label="Prev">
                    ‹
                  </button>

                  <div className="home-detail-strip-grid">
                    {section.items.slice(0, 8).map((item) => (
                      <Link key={item.id} to={item.href || "/products"} className="home-detail-item-card">
                        <div className="home-detail-item-image-wrap">
                          <img src={item.image} alt={item.name} />
                        </div>
                        <p>{item.name}</p>
                        <strong>{formatCurrency(item.price)}</strong>
                        <span>THÊM VÀO GIỎ HÀNG</span>
                      </Link>
                    ))}
                  </div>

                  <button type="button" className="home-strip-arrow home-strip-arrow-right" aria-label="Next">
                    ›
                  </button>
                </div>
              </article>
            ))}
          </div>

          <section className="home-newsletter" aria-label="Nhận tin ưu đãi">
            <h3>Nhận thông báo ưu đãi sớm nhất</h3>
            <p>
              Đừng bỏ lỡ các đợt flash sale và linh kiện hiếm. Đăng ký nhận tin ngay hôm nay.
            </p>

            <div className="home-newsletter-form">
              <input type="email" placeholder="Email của bạn" />
              <button type="button">ĐĂNG KÝ</button>
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
