import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  { label: "MÀN HÌNH", href: "/products?title=MAN%20HINH" },
  { label: "PC GAMING", href: "/products?title=PC%20GAMING" },
  { label: "WORK STATION", href: "/products?title=PC%20WORK" },
  { label: "LAPTOP AI", href: "/products?title=LAPTOP" },
  { label: "LAPTOP", href: "/products?title=LAPTOP" },
  { label: "GAMING GEAR", href: "/products?title=GAMING%20GEAR" },
  { label: "MÀN CHƠI GAME", href: "/products?title=MAN%20HINH" },
  { label: "TAI NGHE", href: "/products?title=TAI%20NGHE" },
];

const FALLBACK_ROW_SECTIONS = [
  {
    id: "pc",
    title: "PC BÁN CHẠY",
    note: "TRẢ GÓP 0% LÃI SUẤT",
    brands: ["PC AI", "PC VĂN PHÒNG", "PC GAMING", "PC I5", "PC I7", "PC R5", "PC R7", "PC R9"],
    items: homeCollectionSections[0]?.items?.slice(0, 8) || [],
    categoryAliases: ["pc", "pc-gaming", "pc gaming", "desktop"],
    searchFallback: "pc",
  },
  {
    id: "mouse",
    title: "CHUỘT BÁN CHẠY",
    note: "TOP XU HƯỚNG",
    brands: ["WL MOUSE", "FINALMOUSE", "LAMZU", "PULSAR", "RAZER", "LOGITECH", "ZOWIE", "ATK"],
    items: homeCollectionSections[1]?.items?.slice(0, 8) || [],
    categoryAliases: ["chuột", "mouse"],
    searchFallback: "mouse",
  },
  {
    id: "keyboard",
    title: "BÀN PHÍM HE RAPID TRIGGER",
    note: "ĐÃ CÓ GIÁ CỰC TỐT",
    brands: ["Melgeek", "Wooting", "ATK", "Logitech", "Pulsar", "AULA", "DrunkDeer", "Akko"],
    items: homeCollectionSections[2]?.items?.slice(0, 8) || [],
    categoryAliases: ["ban-phim", "bàn phím", "keyboard"],
    searchFallback: "keyboard",
  },
  {
    id: "monitor",
    title: "MÀN HÌNH BÁN CHẠY",
    note: "GIÁ TỐT MỖI NGÀY",
    brands: ["ASUS", "MSI", "GIGABYTE", "DELL", "LG", "VIEWSONIC", "BENQ", "HKC"],
    items: homeCollectionSections[3]?.items?.slice(0, 8) || [],
    categoryAliases: ["man-hinh", "màn hình", "monitor"],
    searchFallback: "monitor",
  },
  {
    id: "gaming-gear",
    title: "GAMING GEAR HOT",
    note: "COMBO CHƠI GAME",
    brands: ["RAZER", "LOGITECH", "ZOWIE", "WOOTING", "LAMZU", "PULSAR", "FINALMOUSE", "AKKO"],
    items:
      homeCollectionSections[5]?.items?.slice(0, 8).map((item) => ({
        ...item,
        subtitle: "GEAR HOT TUYEN THU",
      })) || [],
    categoryAliases: ["gaming-gear", "gaming gear", "gear"],
    searchFallback: "gaming gear",
  },
];

const FALLBACK_AUDIO_SECTION = {
  id: "audio",
  title: "TAI NGHE BÁN CHẠY",
  note: "TRẢ GÓP 0%",
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

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const pickCategoryByAliases = (categories, aliases = []) => {
  const normalizedAliases = aliases.map((alias) => normalizeText(alias));

  return categories.find((category) => {
    const categorySlug = normalizeText(category?.slug || "");
    const categoryName = normalizeText(category?.name || "");
    return normalizedAliases.some((alias) => categorySlug === alias || categoryName === alias);
  });
};

const isGearLikePlaceholderImage = (value = "") => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return true;
  return /(shopping-cart|cart|clipboard|cloud|add-to|placeholder|no-image|icon|vite\.svg)/.test(text);
};

const mapApiProductToHomeItem = (
  product,
  fallbackImage = "",
  fallbackAlternates = [],
  index = 0,
  forcedSubtitle = ""
) => {
  const rawImage = product?.image_url || product?.image || fallbackImage;
  const image = toAbsoluteImageUrl(rawImage);
  const hasAlternates = Array.isArray(fallbackAlternates) && fallbackAlternates.length > 0;
  const alternateImage = hasAlternates ? fallbackAlternates[index % fallbackAlternates.length] : fallbackImage;
  const resolvedImage = isGearLikePlaceholderImage(image) ? alternateImage || fallbackImage : image || alternateImage;
  const type = String(product?.category_name || "SẢN PHẨM").toUpperCase();
  const subtitle = String(forcedSubtitle || "").trim() || `${type} CHÍNH HÃNG`;

  return {
    id: product?.id,
    name: product?.name || "Sản phẩm đang cập nhật",
    subtitle,
    image: resolvedImage || fallbackImage,
    price: Number(product?.price || 0),
    productCode: String(product?.product_code || product?.productCode || "").trim(),
    href: product?.id ? `/product/${product.id}` : "/products",
  };
};

const mergeApiSection = (fallbackSection, apiProducts = []) => {
  const fallbackAlternates = (fallbackSection?.items || [])
    .map((item) => item?.image)
    .filter(Boolean);
  const fallbackImage = fallbackAlternates[0] || "";
  const forcedSubtitle =
    String(fallbackSection?.id || "").trim().toLowerCase() === "gaming-gear"
      ? "GAMING GEAR CHÍNH HÃNG"
      : "";

  const mapped = apiProducts
    .map((item, index) =>
      mapApiProductToHomeItem(item, fallbackImage, fallbackAlternates, index, forcedSubtitle)
    )
    .filter((item) => String(item.name || "").trim().length > 1);

  if (mapped.length === 0) {
    return fallbackSection;
  }

  return {
    ...fallbackSection,
    items: mapped.slice(0, 10),
  };
};

const BRAND_SEARCH_ALIASES = {
  "WL MOUSE": "wlmouse",
  FINALMOUSE: "finalmouse",
  LAMZU: "lamzu",
  PULSAR: "pulsar",
  RAZER: "razer",
  LOGITECH: "logitech",
  ZOWIE: "zowie",
  ATK: "atk",
};

const SECTION_TITLE_BY_ID = {
  pc: "PC GAMING",
  mouse: "CHUOT",
  keyboard: "BAN PHIM",
  monitor: "MAN HINH",
  "gaming-gear": "GAMING GEAR",
  audio: "TAI NGHE",
};

const buildBrandFilterLink = (section, brand) => {
  const params = new URLSearchParams();
  const sectionTitle = SECTION_TITLE_BY_ID[String(section?.id || "").trim()] || "SAN PHAM";
  const brandLabel = String(brand || "").trim();
  const brandKeyword = BRAND_SEARCH_ALIASES[brandLabel.toUpperCase()] || brandLabel;

  params.set("title", sectionTitle);
  params.set("search", brandKeyword);

  return `/products?${params.toString()}`;
};

const buildSectionSeed = (value = "") =>
  String(value)
    .split("")
    .reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);

function ProductRow({ section, autoplayDirection = "forward" }) {
  const trackRef = useRef(null);
  const navigate = useNavigate();
  const hasItems = section.items.length > 0;
  const loopItems = hasItems ? [...section.items, ...section.items] : [];
  const [offset, setOffset] = useState(0);
  const [itemStepPx, setItemStepPx] = useState(0);
  const [openingItemId, setOpeningItemId] = useState("");

  const sectionSeed = useMemo(() => buildSectionSeed(section.id), [section.id]);
  const autoplayMs = useMemo(() => 3200 + (sectionSeed % 7) * 360, [sectionSeed]);

  const onNext = useCallback(() => {
    if (!hasItems) return;
    setOffset((prev) => (prev >= section.items.length - 1 ? 0 : prev + 1));
  }, [hasItems, section.items.length]);

  const onPrev = useCallback(() => {
    if (!hasItems) return;
    setOffset((prev) => (prev <= 0 ? section.items.length - 1 : prev - 1));
  }, [hasItems, section.items.length]);

  const autoplayStep = useCallback(() => {
    if (autoplayDirection === "reverse") {
      onPrev();
      return;
    }
    onNext();
  }, [autoplayDirection, onNext, onPrev]);

  const handleCardClick = useCallback(
    async (event, item) => {
      event.preventDefault();
      if (!item) return;

      const itemId = String(item?.id ?? "").trim();
      if (openingItemId && openingItemId === itemId) return;
      setOpeningItemId(itemId);

      try {
        const numericId = Number(itemId);
        if (Number.isFinite(numericId) && numericId > 0) {
          navigate(`/product/${numericId}`);
          return;
        }

        const keywordQueue = [];
        const seenKeywords = new Set();
        const pushKeyword = (value, mode = "name") => {
          const keyword = String(value || "").trim();
          if (!keyword) return;
          const key = `${mode}:${normalizeText(keyword)}`;
          if (seenKeywords.has(key)) return;
          seenKeywords.add(key);
          keywordQueue.push({ keyword, mode });
        };

        pushKeyword(item?.productCode, "code");
        if (Array.isArray(item?.lookupKeywords)) {
          item.lookupKeywords.forEach((entry) => pushKeyword(entry, "hint"));
        }
        pushKeyword(item?.name, "name");

        const preferredGearCategories = new Set(["chuot", "ban-phim", "pad", "tai-nghe", "gaming-gear"]);

        for (const query of keywordQueue) {
          const response = await fetchProducts({
            search: query.keyword,
            status: "active",
            limit: 24,
            page: 1,
            sortBy: "created_at",
            sortOrder: "desc",
          });

          const candidates = Array.isArray(response?.data) ? response.data : [];
          if (candidates.length === 0) continue;

          let matched = null;

          if (query.mode === "code") {
            const codeKey = normalizeCode(query.keyword);
            matched = candidates.find((candidate) => {
              const candidateCode = normalizeCode(candidate?.product_code || candidate?.productCode || "");
              return candidateCode && candidateCode === codeKey;
            });
          }

          if (!matched && (query.mode === "name" || query.mode === "hint")) {
            const nameKey = normalizeText(query.keyword);
            matched = candidates.find((candidate) => {
              const candidateName = normalizeText(candidate?.name || "");
              return candidateName === nameKey || candidateName.includes(nameKey) || nameKey.includes(candidateName);
            });
          }

          if (!matched && section.id === "gaming-gear") {
            matched = candidates.find((candidate) =>
              preferredGearCategories.has(normalizeText(candidate?.category_slug || candidate?.category_name || ""))
            );
          }

          if (!matched) {
            matched = candidates.find((candidate) => Number(candidate?.id || 0) > 0) || null;
          }

          const matchedId = Number(matched?.id || 0);
          if (matchedId > 0) {
            navigate(`/product/${matchedId}`);
            return;
          }
        }

        if (String(item?.href || "").startsWith("/product/")) {
          navigate(item.href);
          return;
        }

        navigate(`/products?search=${encodeURIComponent(String(item?.name || "").trim())}`);
      } catch {
        navigate(`/products?search=${encodeURIComponent(String(item?.name || "").trim())}`);
      } finally {
        setOpeningItemId("");
      }
    },
    [navigate, openingItemId]
  );

  useEffect(() => {
    setOffset(0);
  }, [section.items.length]);

  useEffect(() => {
    const trackNode = trackRef.current;
    if (!trackNode || !hasItems) {
      setItemStepPx(0);
      return undefined;
    }

    const updateStep = () => {
      const firstCard = trackNode.querySelector(".home-card");
      if (!firstCard) {
        setItemStepPx(0);
        return;
      }

      const style = window.getComputedStyle(trackNode);
      const gap = Number.parseFloat(style.columnGap || style.gap || "0") || 0;
      const width = firstCard.getBoundingClientRect().width || 0;
      setItemStepPx(width + gap);
    };

    updateStep();
    window.addEventListener("resize", updateStep);

    return () => {
      window.removeEventListener("resize", updateStep);
    };
  }, [hasItems, section.items.length]);

  useEffect(() => {
    if (!hasItems) return undefined;

    const intervalId = setInterval(autoplayStep, autoplayMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [autoplayMs, autoplayStep, hasItems, sectionSeed]);

  useEffect(() => {
    if (trackRef.current && hasItems) {
      if (itemStepPx > 0) {
        trackRef.current.style.transform = `translateX(-${offset * itemStepPx}px)`;
        return;
      }

      const totalItems = section.items.length * 2 || 1;
      const shiftPercent = 100 / totalItems;
      trackRef.current.style.transform = `translateX(-${offset * shiftPercent}%)`;
    }
  }, [hasItems, itemStepPx, offset, section.items.length]);

  return (
    <section className="home-row carousel-container">
      <div className="home-row__header">
        <div className="home-row__title">
          <h2>{section.title}</h2>
          <span>{section.note}</span>
        </div>

        <div className="home-row__brands">
          {section.brands.map((brand) => (
            <Link key={brand} to={buildBrandFilterLink(section, brand)} className="home-row__brand">
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
          aria-label="Trước"
        >
          {"<"}
        </button>

        <div className="home-row__viewport">
          <div className="home-row__grid carousel-track row-stagger" ref={trackRef}>
            {loopItems.map((item, idx) => (
              <Link
                key={`${item.id}-${idx}`}
                to={item.href || "/products"}
                className="home-card"
                onClick={(event) => handleCardClick(event, item)}
              >
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

export default function Home() {
  const [rowSections, setRowSections] = useState(FALLBACK_ROW_SECTIONS);
  const [audioSection, setAudioSection] = useState(FALLBACK_AUDIO_SECTION);
  const visibleRowSections = useMemo(
    () => rowSections.filter((section) => String(section?.id || "").trim().toLowerCase() !== "gaming-gear"),
    [rowSections]
  );

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

        const nextRows = FALLBACK_ROW_SECTIONS.map((section, index) => {
          if (String(section.id || "").trim().toLowerCase() === "gaming-gear") {
            return section;
          }
          return mergeApiSection(section, responses[index] || []);
        });

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
        label: "PC BÁN CHẠY",
        href: "/products?title=PC%20GAMING",
        image: rowSections[0]?.items?.[0]?.image || FALLBACK_ROW_SECTIONS[0]?.items?.[0]?.image,
      },
      {
        label: "CHUỘT GAMING",
        href: "/products?title=CHUOT",
        image: rowSections[1]?.items?.[0]?.image || FALLBACK_ROW_SECTIONS[1]?.items?.[0]?.image,
      },
      {
        label: "BÀN PHÍM HE",
        href: "/products?title=BAN%20PHIM",
        image: rowSections[2]?.items?.[0]?.image || FALLBACK_ROW_SECTIONS[2]?.items?.[0]?.image,
      },
      {
        label: "MÀN HÌNH",
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

  return (
    <main className="home-page" data-reveal>
      <div className="home-shell">
        <section className="home-hero-block" data-reveal>
          <div className="home-hero-grid row-stagger">
            <Link to="/products" className="home-hero-card home-hero-card--main">
              <img src={homeHeroBanners.main} alt="Sửa chữa và nâng cấp PC chuyên nghiệp" />
              <div className="home-hero-card__overlay">
                <h2>Sửa chữa và nâng cấp PC chuyên nghiệp</h2>
                <p>Dịch vụ kỹ thuật tận tâm cho gaming setup và workstation.</p>
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

          <nav className="home-hero-tabs row-stagger" aria-label="Danh mục nhanh">
            {heroTabs.map((tab) => (
              <Link key={tab.label} to={tab.href} className="home-hero-tabs__item">
                {tab.label}
              </Link>
            ))}
          </nav>

          <div className="home-category-line row-stagger" data-reveal>
            <div className="home-category-line__heading">
              <span>DEAL HOT HÔM NAY</span>
              <h3>DANH MỤC NỔI BẬT</h3>
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
            <img src={homePromoBanners[0]} alt="Tự build bộ PC theo nhu cầu" />
          </Link>
          <Link to="/products" className="home-banner-pair__item">
            <img src={homePromoBanners[1]} alt="Ghế gaming giảm giá sốc" />
          </Link>
        </section>

        {visibleRowSections.map((section, index) => (
          <ProductRow
            key={section.id}
            section={section}
            autoplayDirection={index % 2 === 0 ? "forward" : "reverse"}
          />
        ))}

        <ProductRow
          key={audioSection.id}
          section={audioSection}
          autoplayDirection={visibleRowSections.length % 2 === 0 ? "forward" : "reverse"}
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
          <h2>Nhận thông báo ưu đãi sớm nhất</h2>
          <p>Đừng bỏ lỡ các đợt flash sale và linh kiện hiếm. Đăng ký nhận tin ngay hôm nay nhé.</p>

          <form className="home-newsletter__form">
            <input type="email" placeholder="Email của bạn" />
            <button type="submit">ĐĂNG KÝ</button>
          </form>
        </section>
      </div>
    </main>
  );
}


