import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  formatCurrency,
  homeCollectionSections,
  homeHeroBanners,
  homePromoBanners,
  serviceCards,
} from "../../data/storeData";
import { fetchCategories, fetchProducts, toAbsoluteImageUrl } from "../../services/productService";
import "./Home.css";

const heroTabs = [
  { label: "MAN HINH", href: "/products?title=MAN%20HINH" },
  { label: "PC GAMING", href: "/products?title=PC%20GAMING" },
  { label: "WORK STATION", href: "/products?title=PC%20WORK" },
  { label: "LAPTOP AI", href: "/products?title=LAPTOP" },
  { label: "LAPTOP", href: "/products?title=LAPTOP" },
  { label: "GAMING GEAR", href: "/products?title=GAMING%20GEAR" },
  { label: "MAN CHOI GAME", href: "/products?title=MAN%20HINH" },
  { label: "TAI NGHE", href: "/products?title=TAI%20NGHE" },
];

const FALLBACK_ROW_SECTIONS = [
  {
    id: "pc",
    title: "PC BAN CHAY",
    note: "TRA GOP 0% LAI SUAT",
    brands: ["PC AI", "PC VAN PHONG", "PC GAMING", "PC I5", "PC I7", "PC R5", "PC R7", "PC R9"],
    items: homeCollectionSections[0]?.items?.slice(0, 8) || [],
    categoryAliases: ["pc", "pc-gaming", "pc gaming", "desktop"],
    searchFallback: "pc",
  },
  {
    id: "mouse",
    title: "CHUOT BAN CHAY",
    note: "TOP XU HUONG",
    brands: ["WL MOUSE", "FINALMOUSE", "LAMZU", "PULSAR", "RAZER", "LOGITECH", "ZOWIE", "ATK"],
    items: homeCollectionSections[1]?.items?.slice(0, 8) || [],
    categoryAliases: ["chuot", "mouse"],
    searchFallback: "mouse",
  },
  {
    id: "keyboard",
    title: "BAN PHIM HE RAPID TRIGGER",
    note: "DA CO GIA CUC TOT",
    brands: ["Melgeek", "Wooting", "ATK", "Logitech", "Pulsar", "AULA", "DrunkDeer", "Akko"],
    items: homeCollectionSections[2]?.items?.slice(0, 8) || [],
    categoryAliases: ["ban-phim", "ban phim", "keyboard"],
    searchFallback: "keyboard",
  },
  {
    id: "monitor",
    title: "MAN HINH BAN CHAY",
    note: "GIA TOT MOI NGAY",
    brands: ["ASUS", "MSI", "GIGABYTE", "DELL", "LG", "VIEWSONIC", "BENQ", "HKC"],
    items: homeCollectionSections[3]?.items?.slice(0, 8) || [],
    categoryAliases: ["man-hinh", "man hinh", "monitor"],
    searchFallback: "monitor",
  },
  {
    id: "gaming-gear",
    title: "GAMING GEAR HOT",
    note: "COMBO CHOI GAME",
    brands: ["RAZER", "LOGITECH", "AKKO", "WOOTING", "LAMZU", "PULSAR", "SIMGOT", "MOONDROP"],
    items: homeCollectionSections[5]?.items?.slice(0, 8) || [],
    categoryAliases: ["gaming-gear", "gaming gear", "gear"],
    searchFallback: "gaming gear",
  },
];

const FALLBACK_AUDIO_SECTION = {
  id: "audio",
  title: "TAI NGHE BAN CHAY",
  note: "TRA GOP 0%",
  brands: ["Tanchjim", "KiwiEars", "Simgot", "Kefine", "ThieAudio", "Moondrop", "Truthear", "7HZ"],
  items: homeCollectionSections[4]?.items?.slice(0, 8) || [],
  categoryAliases: ["tai-nghe", "tai nghe", "audio", "headphone", "iem"],
  searchFallback: "tai nghe",
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const pickCategoryByAliases = (categories, aliases = []) => {
  const normalizedAliases = aliases.map((alias) => normalizeText(alias));

  return categories.find((category) => {
    const categorySlug = normalizeText(category?.slug || "");
    const categoryName = normalizeText(category?.name || "");
    return normalizedAliases.some((alias) => categorySlug === alias || categoryName === alias);
  });
};

const mapApiProductToHomeItem = (product, fallbackImage = "") => {
  const rawImage = product?.image_url || product?.image || fallbackImage;
  const image = toAbsoluteImageUrl(rawImage);
  const type = String(product?.category_name || "SAN PHAM").toUpperCase();

  return {
    id: product?.id,
    name: product?.name || "San pham dang cap nhat",
    subtitle: `${type} CHINH HANG`,
    image: image || fallbackImage,
    price: Number(product?.price || 0),
    href: product?.id ? `/product/${product.id}` : "/products",
  };
};

const mergeApiSection = (fallbackSection, apiProducts = []) => {
  const fallbackImage = fallbackSection?.items?.[0]?.image || "";
  const mapped = apiProducts
    .map((item) => mapApiProductToHomeItem(item, fallbackImage))
    .filter((item) => String(item.name || "").trim().length > 1);

  if (mapped.length === 0) {
    return fallbackSection;
  }

  return {
    ...fallbackSection,
    items: mapped.slice(0, 10),
  };
};

function ProductRow({ section, offset, onPrev, onNext }) {
  const trackRef = useRef(null);
  const hasItems = section.items.length > 0;
  const loopItems = hasItems ? [...section.items, ...section.items] : [];

  useEffect(() => {
    if (trackRef.current && hasItems) {
      const totalItems = section.items.length * 2 || 1;
      const shiftPercent = 100 / totalItems;
      trackRef.current.style.transform = `translateX(-${offset * shiftPercent}%)`;
    }
  }, [hasItems, offset, section.items.length]);

  return (
    <section className="home-row carousel-container">
      <div className="home-row__header">
        <div className="home-row__title">
          <h2>{section.title}</h2>
          <span>{section.note}</span>
        </div>

        <div className="home-row__brands">
          {section.brands.map((brand) => (
            <Link key={brand} to="/products" className="home-row__brand">
              {brand}
            </Link>
          ))}
        </div>
      </div>

      <div className="home-row__body">
        <button
          type="button"
          className="home-row__arrow carousel-arrow"
          onClick={onPrev}
          aria-label="Truoc"
        >
          {"<"}
        </button>

        <div className="home-row__viewport">
          <div className="home-row__grid carousel-track row-stagger" ref={trackRef}>
            {loopItems.map((item, idx) => (
              <Link key={`${item.id}-${idx}`} to={item.href} className="home-card">
                <div className="home-card__image">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="home-card__info">
                  <h3>{item.name}</h3>
                  <p>{item.subtitle}</p>
                  <strong>{formatCurrency(item.price)}</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="home-row__arrow carousel-arrow"
          onClick={onNext}
          aria-label="Sau"
        >
          {">"}
        </button>
      </div>
    </section>
  );
}

const useCarousel = (itemsLength) => {
  const [offset, setOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const next = useCallback(() => {
    if (itemsLength <= 1) return;
    setOffset((prev) => (prev >= itemsLength - 1 ? 0 : prev + 1));
  }, [itemsLength]);

  const prev = useCallback(() => {
    if (itemsLength <= 1) return;
    setOffset((prev) => (prev === 0 ? itemsLength - 1 : prev - 1));
  }, [itemsLength]);

  useEffect(() => {
    setOffset(0);
  }, [itemsLength]);

  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(next, 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [next, isPaused]);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => setIsPaused(false), []);

  return { offset, next, prev, pause, resume };
};

export default function Home() {
  const [rowSections, setRowSections] = useState(FALLBACK_ROW_SECTIONS);
  const [audioSection, setAudioSection] = useState(FALLBACK_AUDIO_SECTION);

  useEffect(() => {
    let mounted = true;

    const loadHomeCollections = async () => {
      try {
        const categories = await fetchCategories();
        const sectionDefs = [...FALLBACK_ROW_SECTIONS, FALLBACK_AUDIO_SECTION];

        const responses = await Promise.all(
          sectionDefs.map(async (section) => {
            const foundCategory = pickCategoryByAliases(categories, section.categoryAliases);
            const params = {
              status: "active",
              limit: 12,
              page: 1,
              sortBy: "created_at",
              sortOrder: "desc",
            };

            if (foundCategory?.id) {
              params.categoryId = Number(foundCategory.id);
            } else if (section.searchFallback) {
              params.search = section.searchFallback;
            }

            const result = await fetchProducts(params);
            return result?.data || [];
          })
        );

        if (!mounted) return;

        const nextRows = FALLBACK_ROW_SECTIONS.map((section, index) =>
          mergeApiSection(section, responses[index] || [])
        );

        const nextAudio = mergeApiSection(
          FALLBACK_AUDIO_SECTION,
          responses[responses.length - 1] || []
        );

        setRowSections(nextRows);
        setAudioSection(nextAudio);
      } catch {
        if (mounted) {
          setRowSections(FALLBACK_ROW_SECTIONS);
          setAudioSection(FALLBACK_AUDIO_SECTION);
        }
      }
    };

    loadHomeCollections();

    return () => {
      mounted = false;
    };
  }, []);

  const categoryIcons = useMemo(
    () => [
      {
        label: "PC BAN CHAY",
        href: "/products?title=PC%20GAMING",
        image: rowSections[0]?.items?.[0]?.image || FALLBACK_ROW_SECTIONS[0]?.items?.[0]?.image,
      },
      {
        label: "CHUOT GAMING",
        href: "/products?title=CHUOT",
        image: rowSections[1]?.items?.[0]?.image || FALLBACK_ROW_SECTIONS[1]?.items?.[0]?.image,
      },
      {
        label: "BAN PHIM HE",
        href: "/products?title=BAN%20PHIM",
        image: rowSections[2]?.items?.[0]?.image || FALLBACK_ROW_SECTIONS[2]?.items?.[0]?.image,
      },
      {
        label: "MAN HINH",
        href: "/products?title=MAN%20HINH",
        image: rowSections[3]?.items?.[0]?.image || FALLBACK_ROW_SECTIONS[3]?.items?.[0]?.image,
      },
      {
        label: "TAI NGHE",
        href: "/products?title=TAI%20NGHE",
        image: audioSection?.items?.[0]?.image || FALLBACK_AUDIO_SECTION?.items?.[0]?.image,
      },
      {
        label: "GAMING GEAR",
        href: "/products?title=GAMING%20GEAR",
        image: rowSections[4]?.items?.[0]?.image || FALLBACK_ROW_SECTIONS[4]?.items?.[0]?.image,
      },
      {
        label: "CPU / MAIN",
        href: "/build-pc",
        image: rowSections[0]?.items?.[1]?.image || FALLBACK_ROW_SECTIONS[0]?.items?.[1]?.image,
      },
    ],
    [audioSection, rowSections]
  );

  const rowCarousels = rowSections.map((section) => useCarousel(section.items.length || 1));
  const audioCarousel = useCarousel(audioSection.items.length || 1);

  return (
    <main className="home-page" data-reveal>
      <div className="home-shell">
        <section className="home-hero-block" data-reveal>
          <div className="home-hero-grid row-stagger">
            <Link to="/products" className="home-hero-card home-hero-card--main">
              <img src={homeHeroBanners.main} alt="Sua chua va nang cap PC chuyen nghiep" />
              <div className="home-hero-card__overlay">
                <h2>Sua chua va Nang cap PC chuyen nghiep</h2>
                <p>Dich vu ky thuat tan tam cho gaming setup va workstation.</p>
                <span>MUA NGAY</span>
              </div>
            </Link>

            <Link to="/products" className="home-hero-card home-hero-card--side">
              <img src={homeHeroBanners.rightTop} alt="Work from home" />
              <div className="home-hero-card__label">WORK FROM HOME</div>
            </Link>

            <Link to="/build-pc" className="home-hero-card home-hero-card--side">
              <img src={homeHeroBanners.rightBottom} alt="Build PC gaming" />
              <div className="home-hero-card__label">BUILD PC GAMING</div>
            </Link>
          </div>

          <nav className="home-hero-tabs row-stagger" aria-label="Danh muc nhanh">
            {heroTabs.map((tab) => (
              <Link key={tab.label} to={tab.href} className="home-hero-tabs__item">
                {tab.label}
              </Link>
            ))}
          </nav>

          <div className="home-category-line row-stagger" data-reveal>
            <div className="home-category-line__heading">
              <span>DEAL HOT HOM NAY</span>
              <h3>DANH MUC NOI BAT</h3>
            </div>

            <div className="home-category-line__grid row-stagger">
              {categoryIcons.map((item) => (
                <Link key={item.label} to={item.href} className="home-category-icon">
                  <div className="home-category-icon__thumb">
                    <img src={item.image} alt={item.label} />
                  </div>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="home-banner-pair row-stagger" data-reveal>
          <Link to="/build-pc" className="home-banner-pair__item">
            <img src={homePromoBanners[0]} alt="Tu build bo PC theo nhu cau" />
          </Link>
          <Link to="/products" className="home-banner-pair__item">
            <img src={homePromoBanners[1]} alt="Ghe gaming giam gia soc" />
          </Link>
        </section>

        {rowSections.map((section, index) => (
          <ProductRow
            key={section.id}
            section={section}
            offset={rowCarousels[index].offset}
            onPrev={rowCarousels[index].prev}
            onNext={rowCarousels[index].next}
          />
        ))}

        <ProductRow
          key={audioSection.id}
          section={audioSection}
          offset={audioCarousel.offset}
          onPrev={audioCarousel.prev}
          onNext={audioCarousel.next}
        />

        <section className="home-service-strip row-stagger" data-reveal>
          {serviceCards.map((service) => (
            <article key={service.title} className="home-service-strip__item">
              <img src={service.icon} alt={service.title} />
              <div>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="home-newsletter" data-reveal>
          <h2>Nhan thong bao uu dai som nhat</h2>
          <p>Dung bo lo cac dot flash sale va linh kien hiem. Dang ky nhan tin ngay hom nay nhe.</p>

          <form className="home-newsletter__form">
            <input type="email" placeholder="Email cua ban" />
            <button type="submit">DANG KY</button>
          </form>
        </section>
      </div>
    </main>
  );
}
