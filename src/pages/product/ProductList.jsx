import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchCategories, fetchProducts, toAbsoluteImageUrl } from "../../services/productService";
import { notifyError } from "../../utils/notify";
import { formatVnd } from "../../utils/currency";
import "./ProductList.css";

const PAGE_SIZE = 9;
const PAGE_WINDOW_SIZE = 5;
const PRICE_MIN = 0;
const PRICE_MAX = 500_000_000;
const FALLBACK_PRODUCT_IMAGE = "/vite.svg";

const CATEGORY_GROUP_BY_TITLE = {
  gaming: ["gaming-gear", "chuot", "ban-phim", "tai-nghe"],
  "gaming gear": ["gaming-gear", "chuot", "ban-phim", "tai-nghe"],
  "gaming-gear": ["gaming-gear", "chuot", "ban-phim", "tai-nghe"],
  gear: ["gaming-gear", "chuot", "ban-phim", "tai-nghe"],
  laptop: ["laptop"],
  "man hinh": ["man-hinh"],
  monitor: ["man-hinh"],
  "ban phim": ["ban-phim"],
  keyboard: ["ban-phim"],
  chuot: ["chuot"],
  mouse: ["chuot"],
  "tai nghe": ["tai-nghe"],
  "tai-nghe": ["tai-nghe"],
  "am thanh": ["tai-nghe"],
  audio: ["tai-nghe"],
  "pc gaming": ["pc-gaming"],
  "pc-gaming": ["pc-gaming"],
};

const CATEGORY_CONTEXT_BY_TITLE = {
  gaming: { mode: "group", slug: "gaming-gear", categoryGroup: "gaming-gear", label: "Gaming Gear" },
  "gaming gear": { mode: "group", slug: "gaming-gear", categoryGroup: "gaming-gear", label: "Gaming Gear" },
  "gaming-gear": { mode: "group", slug: "gaming-gear", categoryGroup: "gaming-gear", label: "Gaming Gear" },
  gear: { mode: "group", slug: "gaming-gear", categoryGroup: "gaming-gear", label: "Gaming Gear" },
  "man hinh": { mode: "slug", slug: "man-hinh", label: "Man hinh" },
  monitor: { mode: "slug", slug: "man-hinh", label: "Man hinh" },
  "ban phim": { mode: "slug", slug: "ban-phim", label: "Ban phim" },
  keyboard: { mode: "slug", slug: "ban-phim", label: "Ban phim" },
  chuot: { mode: "slug", slug: "chuot", label: "Chuot" },
  mouse: { mode: "slug", slug: "chuot", label: "Chuot" },
  "tai nghe": { mode: "slug", slug: "tai-nghe", label: "Tai nghe" },
  "tai-nghe": { mode: "slug", slug: "tai-nghe", label: "Tai nghe" },
  "am thanh": { mode: "slug", slug: "tai-nghe", label: "Tai nghe" },
  audio: { mode: "slug", slug: "tai-nghe", label: "Tai nghe" },
  laptop: { mode: "slug", slug: "laptop", label: "Laptop" },
  "pc gaming": { mode: "slug", slug: "pc-gaming", label: "PC Gaming" },
  "pc-gaming": { mode: "slug", slug: "pc-gaming", label: "PC Gaming" },
};

const CATEGORY_DISPLAY_NAME_MAP = {
  "tat ca": "Tat ca",
  "ban phim": "Ban phim",
  "ban-phim": "Ban phim",
  chuot: "Chuot",
  laptop: "Laptop",
  "man hinh": "Man hinh",
  "man-hinh": "Man hinh",
  "pc gaming": "PC Gaming",
  "pc-gaming": "PC Gaming",
  "tai nghe": "Tai nghe",
  "tai-nghe": "Tai nghe",
  "gaming gear": "Gaming Gear",
  "gaming-gear": "Gaming Gear",
  "linh kien": "Linh kien",
  "linh-kien": "Linh kien",
};

const CATEGORY_FOCUS_FILTERS = {
  "gaming-gear": [
    { id: "gear-mouse", label: "Chuot gaming" },
    { id: "gear-keyboard", label: "Ban phim gaming" },
    { id: "gear-audio", label: "Tai nghe gaming" },
    { id: "gear-wireless", label: "Gear khong day" },
  ],
  "man-hinh": [
    { id: "monitor-oled", label: "Man OLED" },
    { id: "monitor-240hz", label: "Man 240Hz+" },
    { id: "monitor-graphic", label: "Man do hoa" },
    { id: "monitor-mainstream", label: "Man pho thong" },
    { id: "monitor-fhd", label: "Full HD" },
    { id: "monitor-ips", label: "IPS" },
  ],
  "ban-phim": [
    { id: "keyboard-he", label: "Rapid Trigger / HE" },
    { id: "keyboard-wireless", label: "Ban phim khong day" },
    { id: "keyboard-layout-75", label: "Layout 75%" },
    { id: "keyboard-tkl", label: "TKL / 87 phim" },
  ],
  chuot: [
    { id: "mouse-wireless", label: "Chuot khong day" },
    { id: "mouse-ultralight", label: "Chuot sieu nhe" },
    { id: "mouse-esport", label: "Chuot eSports" },
  ],
  laptop: [
    { id: "laptop-gaming", label: "Laptop gaming" },
    { id: "laptop-creator", label: "Laptop do hoa" },
  ],
  "pc-gaming": [
    { id: "pc-rtx50", label: "PC RTX 50 Series" },
    { id: "pc-rtx40", label: "PC RTX 40 Series" },
    { id: "pc-ryzen", label: "PC AMD Ryzen" },
  ],
  "tai-nghe": [
    { id: "audio-iem", label: "Tai nghe IEM" },
    { id: "audio-wireless", label: "Tai nghe khong day" },
    { id: "audio-gaming", label: "Tai nghe gaming" },
  ],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const toCategoryDisplayName = (value, fallback = "") => {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  const normalized = normalizeText(raw).replace(/\s+/g, " ");
  const normalizedSlug = normalized.replace(/\s+/g, "-");
  return CATEGORY_DISPLAY_NAME_MAP[normalized] || CATEGORY_DISPLAY_NAME_MAP[normalizedSlug] || raw;
};

const isValidProduct = (product) => {
  const name = String(product?.name || "").trim();
  if (name.length < 2) return false;

  const price = Number(product?.price || 0);
  if (!Number.isFinite(price) || price <= 0) return false;

  return true;
};

const resolveImageUrl = (path) => {
  const raw = String(path || "").trim();
  if (!raw) return FALLBACK_PRODUCT_IMAGE;
  return toAbsoluteImageUrl(raw);
};

export default function ProductList() {
  const pageRef = useRef(null);
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(() => String(searchParams.get("search") || ""));
  const [categoryId, setCategoryId] = useState(() => String(searchParams.get("categoryId") || "all"));
  const [ignoreTitleFilter, setIgnoreTitleFilter] = useState(false);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [page, setPage] = useState(1);
  const [pageWindowStart, setPageWindowStart] = useState(1);
  const [focusFilterId, setFocusFilterId] = useState("all");

  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const queryTitle = useMemo(() => String(searchParams.get("title") || "").trim(), [searchParams]);
  const normalizedQueryTitle = useMemo(() => normalizeText(queryTitle), [queryTitle]);
  const activeCategoryContext = useMemo(
    () => CATEGORY_CONTEXT_BY_TITLE[normalizedQueryTitle] || null,
    [normalizedQueryTitle]
  );

  const apiCategoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        id: String(category.id),
        apiCategoryId: Number(category.id),
        displayName:
          toCategoryDisplayName(category.slug) || toCategoryDisplayName(category.name) || String(category.name || "").trim(),
      })),
    [categories]
  );

  const contextCategoryOptions = useMemo(() => {
    if (!activeCategoryContext) return [];

    const contextSlug = String(activeCategoryContext.slug || "").trim().toLowerCase();
    if (!contextSlug) return [];

    const focusPreset = CATEGORY_FOCUS_FILTERS[contextSlug] || [];
    const matchedApiCategory = apiCategoryOptions.find(
      (item) =>
        normalizeText(item.slug || "") === normalizeText(contextSlug) ||
        normalizeText(item.name || "") === normalizeText(contextSlug)
    );

    const matchedApiCategoryId = Number(matchedApiCategory?.apiCategoryId || 0);
    const resolvedApiCategoryId = matchedApiCategoryId > 0 ? matchedApiCategoryId : undefined;

    const rootOption =
      activeCategoryContext.mode === "group"
        ? {
            id: `context-${contextSlug}-root`,
            name: activeCategoryContext.label,
            displayName: activeCategoryContext.label,
            slug: contextSlug,
            categoryGroup: activeCategoryContext.categoryGroup,
          }
        : {
            id: `context-${contextSlug}-root`,
            name: activeCategoryContext.label,
            displayName: activeCategoryContext.label,
            slug: contextSlug,
            apiCategoryId: resolvedApiCategoryId,
          };

    const focusOptions = focusPreset.map((focusItem) => ({
      id: `context-${contextSlug}-${focusItem.id}`,
      name: focusItem.label,
      displayName: focusItem.label,
      slug: contextSlug,
      presetFocusFilterId: focusItem.id,
      ...(activeCategoryContext.mode === "group"
        ? { categoryGroup: activeCategoryContext.categoryGroup }
        : { apiCategoryId: resolvedApiCategoryId }),
    }));

    return [rootOption, ...focusOptions];
  }, [activeCategoryContext, apiCategoryOptions]);

  const hasContextCategoryOptions = contextCategoryOptions.length > 0;

  const categoryOptions = useMemo(() => {
    const baseOptions = [{ id: "all", name: "Tat ca", displayName: "Tat ca" }];
    if (hasContextCategoryOptions) {
      return [...baseOptions, ...contextCategoryOptions];
    }
    return [...baseOptions, ...apiCategoryOptions];
  }, [apiCategoryOptions, contextCategoryOptions, hasContextCategoryOptions]);

  useEffect(() => {
    if (!categoryOptions.some((option) => String(option.id) === String(categoryId))) {
      setCategoryId("all");
    }
  }, [categoryId, categoryOptions]);

  const selectedCategory = useMemo(
    () => categoryOptions.find((option) => String(option.id) === String(categoryId)) || null,
    [categoryId, categoryOptions]
  );

  const selectedCategoryName = useMemo(
    () => selectedCategory?.displayName || selectedCategory?.name || "",
    [selectedCategory]
  );

  const selectedCategorySlug = useMemo(
    () => String(selectedCategory?.slug || "").trim().toLowerCase(),
    [selectedCategory]
  );

  const focusOptions = useMemo(() => {
    if (String(categoryId) === "all") return [];
    if (hasContextCategoryOptions) return [];
    if (selectedCategory?.presetFocusFilterId) return [];

    const preset = CATEGORY_FOCUS_FILTERS[selectedCategorySlug] || [];
    if (preset.length === 0) return [];
    return [{ id: "all", label: "Tat ca" }, ...preset];
  }, [categoryId, hasContextCategoryOptions, selectedCategory?.presetFocusFilterId, selectedCategorySlug]);

  const activeFocusFilter = useMemo(() => {
    if (focusOptions.length === 0) return null;
    return focusOptions.find((item) => item.id === focusFilterId) || focusOptions[0];
  }, [focusFilterId, focusOptions]);

  const activeFocusFilterId = activeFocusFilter?.id || "all";

  const pageTitle = useMemo(() => {
    if (ignoreTitleFilter && String(categoryId) === "all") {
      return "SAN PHAM MUON MUA";
    }

    const customTitle = String(searchParams.get("title") || "").trim();
    if (selectedCategoryName && String(categoryId) !== "all") {
      return String(selectedCategoryName).toUpperCase();
    }
    if (customTitle) return toCategoryDisplayName(customTitle, customTitle).toUpperCase();
    return "SAN PHAM MUON MUA";
  }, [categoryId, ignoreTitleFilter, searchParams, selectedCategoryName]);

  const inferredCategoryGroup = useMemo(() => {
    if (selectedCategory?.categoryGroup) {
      return selectedCategory.categoryGroup;
    }
    if (ignoreTitleFilter || categoryId !== "all") return "";
    if (activeCategoryContext?.mode === "group") {
      return String(activeCategoryContext.categoryGroup || "");
    }
    return "";
  }, [activeCategoryContext, categoryId, ignoreTitleFilter, selectedCategory?.categoryGroup]);

  const inferredCategoryIds = useMemo(() => {
    if (!queryTitle) return [];

    const normalizedTitle = normalizeText(queryTitle);
    const aliasSlugs = CATEGORY_GROUP_BY_TITLE[normalizedTitle] || [];

    const inferredByAlias = categories
      .filter((category) => aliasSlugs.includes(String(category.slug || "").toLowerCase()))
      .map((category) => Number(category.id));

    if (inferredByAlias.length > 0) {
      return inferredByAlias;
    }

    const inferredByName = categories
      .filter((category) => {
        const name = normalizeText(category.name);
        const slug = normalizeText(category.slug);
        return (
          name.includes(normalizedTitle) ||
          normalizedTitle.includes(name) ||
          slug.includes(normalizedTitle) ||
          normalizedTitle.includes(slug)
        );
      })
      .map((category) => Number(category.id));

    return inferredByName;
  }, [categories, queryTitle]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((error) => notifyError(error, "Khong tai duoc danh muc"));
  }, []);

  useEffect(() => {
    const nextSearch = String(searchParams.get("search") || "");
    const nextCategoryId = String(searchParams.get("categoryId") || "all");
    setSearch(nextSearch);
    setCategoryId(nextCategoryId);
    setIgnoreTitleFilter(false);
    setFocusFilterId("all");
    setPage(1);
    setPageWindowStart(1);
  }, [searchParams]);

  useEffect(() => {
    setFocusFilterId("all");
  }, [categoryId]);

  const pageWindowEnd = useMemo(
    () => Math.min(totalPages, pageWindowStart + PAGE_WINDOW_SIZE - 1),
    [pageWindowStart, totalPages]
  );

  const visiblePageNumbers = useMemo(() => {
    if (totalPages <= 0) return [];
    const length = Math.max(0, pageWindowEnd - pageWindowStart + 1);
    return Array.from({ length }, (_, index) => pageWindowStart + index);
  }, [pageWindowEnd, pageWindowStart, totalPages]);

  const shiftPageWindowBack = () => {
    setPageWindowStart((prev) => Math.max(1, prev - (PAGE_WINDOW_SIZE - 1)));
  };

  const shiftPageWindowNext = () => {
    const maxStart = Math.max(1, totalPages - PAGE_WINDOW_SIZE + 1);
    setPageWindowStart((prev) => Math.min(maxStart, prev + (PAGE_WINDOW_SIZE - 1)));
  };

  const handlePageSelect = (pageNumber) => {
    setPage(pageNumber);

    setPageWindowStart((prev) => {
      const maxStart = Math.max(1, totalPages - PAGE_WINDOW_SIZE + 1);
      const end = Math.min(totalPages, prev + PAGE_WINDOW_SIZE - 1);

      if (pageNumber === end && end < totalPages) {
        return Math.min(maxStart, pageNumber);
      }

      if (pageNumber === prev && prev > 1) {
        return Math.max(1, prev - (PAGE_WINDOW_SIZE - 1));
      }

      return prev;
    });
  };

  useEffect(() => {
    const maxStart = Math.max(1, totalPages - PAGE_WINDOW_SIZE + 1);
    setPageWindowStart((prev) => {
      let next = Math.min(prev, maxStart);
      const end = Math.min(totalPages, next + PAGE_WINDOW_SIZE - 1);

      if (page < next) {
        next = Math.max(1, page);
      } else if (page > end) {
        next = Math.min(maxStart, page);
      }

      return Math.max(1, next);
    });
  }, [page, totalPages]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        setLoading(true);

        const selectedApiCategoryId = Number(selectedCategory?.apiCategoryId || 0);
        const selectedPresetFocus = String(selectedCategory?.presetFocusFilterId || "");
        const fallbackCategoryId = Number.parseInt(String(categoryId), 10);
        const hasDirectCategoryId =
          categoryId !== "all" && !selectedCategory?.categoryGroup && Number.isFinite(fallbackCategoryId) && fallbackCategoryId > 0;

        const effectiveCategoryId =
          selectedApiCategoryId > 0
            ? String(selectedApiCategoryId)
            : hasDirectCategoryId
            ? String(fallbackCategoryId)
            : inferredCategoryIds.length === 1
            ? String(inferredCategoryIds[0])
            : "";

        const effectiveFocusFilter = selectedPresetFocus || (activeFocusFilterId !== "all" ? activeFocusFilterId : "");

        const response = await fetchProducts({
          search,
          categoryId: effectiveCategoryId,
          categoryGroup: inferredCategoryGroup,
          focusFilter: effectiveFocusFilter,
          categoryIds:
            !ignoreTitleFilter && !inferredCategoryGroup && categoryId === "all" && inferredCategoryIds.length > 1
              ? inferredCategoryIds.join(",")
              : "",
          minPrice,
          maxPrice,
          page,
          limit: PAGE_SIZE,
          sortBy,
          sortOrder,
          status: "active",
        });

        const safeProducts = (response?.data || []).filter(isValidProduct);

        setProducts(safeProducts);
        setTotalItems(response?.pagination?.total || safeProducts.length);
        setTotalPages(response?.pagination?.totalPages || 1);
      } catch (error) {
        notifyError(error, "Khong tai duoc danh sach san pham");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [
    search,
    categoryId,
    activeFocusFilterId,
    ignoreTitleFilter,
    inferredCategoryGroup,
    inferredCategoryIds,
    minPrice,
    maxPrice,
    page,
    sortBy,
    sortOrder,
    selectedCategory?.apiCategoryId,
    selectedCategory?.categoryGroup,
    selectedCategory?.presetFocusFilterId,
  ]);

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
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    revealElements.forEach((element) => revealObserver.observe(element));

    return () => revealObserver.disconnect();
  }, []);

  const updateMinPrice = (value) => {
    const next = clamp(Number(value) || PRICE_MIN, PRICE_MIN, PRICE_MAX);
    if (next > maxPrice) {
      setMaxPrice(next);
    }
    setMinPrice(next);
    setPage(1);
  };

  const updateMaxPrice = (value) => {
    const next = clamp(Number(value) || PRICE_MAX, PRICE_MIN, PRICE_MAX);
    if (next < minPrice) {
      setMinPrice(next);
    }
    setMaxPrice(next);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setCategoryId("all");
    setIgnoreTitleFilter(true);
    setFocusFilterId("all");
    setSortBy("created_at");
    setSortOrder("desc");
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setPage(1);
  };

  return (
    <div className="plist-page" ref={pageRef}>
      <div className="plist-shell">
        <aside className="plist-sidebar plist-reveal is-visible" data-reveal>
          <section className="plist-filter-box plist-reveal is-visible" data-reveal>
            <h3>Danh muc</h3>
            <div className="plist-filter-option-list">
              {categoryOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`plist-filter-option ${String(categoryId) === String(option.id) ? "is-active" : ""}`}
                  onClick={() => {
                    setCategoryId(String(option.id));
                    setIgnoreTitleFilter(String(option.id) === "all");
                    setFocusFilterId("all");
                    setPage(1);
                  }}
                >
                  <span className="plist-filter-indicator" aria-hidden="true" />
                  {option.displayName || option.name}
                </button>
              ))}
            </div>
          </section>

          {focusOptions.length > 0 ? (
            <section className="plist-filter-box plist-reveal is-visible" data-reveal>
              <h3>Danh muc con</h3>
              <p className="plist-focus-caption">Loc nhanh theo {String(selectedCategoryName || "").toLowerCase()}</p>
              <div className="plist-filter-option-list">
                {focusOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`plist-filter-option ${activeFocusFilter?.id === option.id ? "is-active" : ""}`}
                    onClick={() => {
                      setFocusFilterId(option.id);
                      setPage(1);
                    }}
                  >
                    <span className="plist-filter-indicator" aria-hidden="true" />
                    {option.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="plist-filter-box plist-reveal is-visible" data-reveal>
            <h3>Khoang gia</h3>
            <div className="plist-price-control">
              <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={100_000} value={minPrice} onChange={(event) => updateMinPrice(event.target.value)} />
              <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={100_000} value={maxPrice} onChange={(event) => updateMaxPrice(event.target.value)} />
            </div>

            <div className="plist-price-input-row">
              <input type="number" min={PRICE_MIN} max={PRICE_MAX} value={minPrice} onChange={(event) => updateMinPrice(event.target.value)} />
              <span>-</span>
              <input type="number" min={PRICE_MIN} max={PRICE_MAX} value={maxPrice} onChange={(event) => updateMaxPrice(event.target.value)} />
            </div>
          </section>

          <section className="plist-filter-box plist-reveal is-visible" data-reveal>
            <h3>Sap xep</h3>
            <div className="plist-filter-option-list">
              <div className="plist-select-wrap">
                <select
                  className="plist-select"
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="created_at">Moi nhat</option>
                  <option value="price">Gia</option>
                  <option value="name">Ten</option>
                </select>
              </div>
              <div className="plist-select-wrap">
                <select
                  className="plist-select"
                  value={sortOrder}
                  onChange={(event) => {
                    setSortOrder(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="desc">Giam dan</option>
                  <option value="asc">Tang dan</option>
                </select>
              </div>
            </div>

            <div className="plist-filter-action-row">
              <button type="button" className="btn-apply" onClick={() => setPage(1)}>
                AP DUNG
              </button>
              <button type="button" className="btn-clear" onClick={resetFilters}>
                XOA LOC
              </button>
            </div>
          </section>
        </aside>

        <main className="plist-main plist-reveal" data-reveal>
          <header className="plist-main-header plist-reveal" data-reveal>
            <h1>{pageTitle}</h1>
            <div className="plist-header-actions">
              <input
                type="text"
                value={search}
                placeholder="Tim theo ten san pham..."
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
              <span>
                {products.length}/{totalItems} san pham
              </span>
            </div>
          </header>

          <section className="plist-grid-box plist-reveal" data-reveal>
            {loading ? <div className="plist-empty">Dang tai danh sach san pham...</div> : null}

            {!loading ? (
              <div className="plist-grid">
                {products.map((product, index) => (
                  <article key={product.id} className="plist-card" style={{ "--stagger": index + 1 }}>
                    <Link to={`/product/${product.id}`} className="plist-card-image">
                      <img
                        src={resolveImageUrl(product.image_url)}
                        alt={product.name}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                        }}
                      />
                    </Link>

                    <p className="plist-card-type">{toCategoryDisplayName(product.category_name, "SAN PHAM")}</p>

                    <Link to={`/product/${product.id}`} className="plist-card-name">
                      {product.name}
                    </Link>

                    <p className="plist-card-code">{String(product.product_code || "").trim() || "SP-N/A"}</p>

                    <p className="plist-card-price">{formatVnd(product.price)}</p>

                    <Link to={`/product/${product.id}`} className="plist-card-button">
                      XEM CHI TIET
                    </Link>
                  </article>
                ))}
              </div>
            ) : null}

            {!loading && products.length === 0 ? <div className="plist-empty">Khong co san pham phu hop bo loc hien tai.</div> : null}

            <div className="plist-pagination">
              <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
                {"<"}
              </button>

              {pageWindowStart > 1 ? (
                <>
                  <button type="button" onClick={() => handlePageSelect(1)}>
                    1
                  </button>
                  <button type="button" onClick={shiftPageWindowBack}>
                    ...
                  </button>
                </>
              ) : null}

              {visiblePageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={pageNumber === page ? "is-active" : ""}
                  onClick={() => handlePageSelect(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              {pageWindowEnd < totalPages ? (
                <>
                  <button type="button" onClick={shiftPageWindowNext}>
                    ...
                  </button>
                  <button type="button" onClick={() => handlePageSelect(totalPages)}>
                    {totalPages}
                  </button>
                </>
              ) : null}

              <button type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page === totalPages}>
                {">"}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
