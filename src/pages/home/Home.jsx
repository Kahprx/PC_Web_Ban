import { useEffect, useRef, useState } from "react";
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
  "AM THANH",
];

const toTagLabel = (tag) => String(tag || "").replace(/\s+/g, " ").trim().toUpperCase();
const toProductLinkByChip = (chip) => {
  const normalizedChip = String(chip || "").trim();
  if (!normalizedChip || normalizedChip === categoryChips[0] || normalizedChip.toUpperCase() === "TAT CA") {
    return "/products?title=SAN%20PHAM%20MUON%20MUA";
  }

  const query = new URLSearchParams({
    title: normalizedChip,
  });
  return `/products?${query.toString()}`;
};

export default function Home() {
  const pageRef = useRef(null);
  const [currentHero, setCurrentHero] = useState(0);
  const heroBanners = [
    homeHeroBanners.main,
    homeHeroBanners.rightTop,
    homeHeroBanners.rightBottom,
  ].filter(Boolean);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealElements = Array.from(root.querySelectorAll("[data-reveal]"));

    if (prefersReducedMotion) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
      return undefined;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    revealElements.forEach((element) => revealObserver.observe(element));

    // Hero slider auto-advance
    const sliderInterval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroBanners.length);
    }, 4000);

    let rafId = 0;
    const updateParallax = () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
      root.style.setProperty("--home-scroll-progress", progress.toFixed(3));
      rafId = 0;
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      revealObserver.disconnect();
      clearInterval(sliderInterval);
      window.removeEventListener("scroll", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [heroBanners.length]);

  return (
    <div className="home-page" ref={pageRef}>
      <div className="home-shell">
        <section className="home-hero-grid home-reveal is-visible" data-reveal>
          <article className="home-hero-main-card home-parallax-layer" 
                   style={{ "--hero-index": currentHero }}>
            <img src={heroBanners[currentHero % heroBanners.length]} alt="Main hero" />
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
                Đặt lịch ngay →
              </Link>
            </div>
          </article>

          <article className="home-hero-side-card home-hero-side-card-offer home-parallax-layer">
            {homeHeroBanners.rightTop && <img src={homeHeroBanners.rightTop} alt="Ưu đãi" />}
            <div className="home-hero-side-label home-hero-side-label-offer">
              <strong>UU DAI LINH KIEN</strong>
              <small>Giảm giá 40%</small>
            </div>
          </article>

          <article className="home-hero-side-card home-hero-side-card-build home-parallax-layer">
            {homeHeroBanners.rightBottom && <img src={homeHeroBanners.rightBottom} alt="Build" />}
            <div className="home-hero-side-label home-hero-side-label-build">BUILD PC GAMING</div>
          </article>
        </section>

        <section className="home-chip-row home-reveal" data-reveal>
          {categoryChips.map((chip) => (
            <Link key={chip} to={toProductLinkByChip(chip)} className="home-chip-item">
              {chip}
            </Link>
          ))}
        </section>

        <section className="home-highlight home-reveal" data-reveal>
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
                  style={{ "--stagger": index }}
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

        <section className="home-detail home-reveal" data-reveal>
          <div className="home-detail-banner-row">
            {homePromoBanners.slice(0, 2).map((banner, index) => (
              <Link
                key={`promo-${index}`}
                to="/build-pc"
                className="home-detail-banner"
                style={{ "--stagger": index + 1 }}
              >
                <img src={banner} alt={`Khuyến mãi ${index + 1}`} />
              </Link>
            ))}
          </div>

          <div className="home-detail-sections">
            {homeCollectionSections.slice(0, 2).map((section, sectionIndex) => (  // Reduced to 2 sections for balance
              <article key={section.id} className="home-detail-strip" style={{ "--stagger": sectionIndex + 1 }}>

                <div className="home-detail-strip-body">
                  <button type="button" className="home-strip-arrow home-strip-arrow-left" aria-label="Prev">
                    ‹
                  </button>

                  <div className="home-detail-strip-grid">
                    {section.items.slice(0, 6).map((item, itemIndex) => (  // Reduced to 6 items
                      <Link
                        key={item.id}
                        to={item.href || "/products"}
                        className="home-detail-item-card"
                        style={{ "--stagger": itemIndex + 1 }}
                      >
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
