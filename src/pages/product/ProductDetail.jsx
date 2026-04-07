import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductCard from "../../components/common/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { addToCartApi, fetchCart } from "../../services/cartService";
import { fetchMyPurchasedItems } from "../../services/orderService";
import { fetchProductById, fetchProducts, toAbsoluteImageUrl } from "../../services/productService";
import { fetchProductRating } from "../../services/reviewService";
import { articleCards, comboItems, formatCurrency, uiBanners } from "../../data/storeData";
import { notifyError } from "../../utils/notify";
import "./ProductDetail.css";

const FALLBACK_SPEC = {
  cpu: "CPU đang cập nhật",
  mainboard: "Mainboard đang cập nhật",
  ram: "RAM đang cập nhật",
  vga: "VGA đang cập nhật",
  ssd: "SSD đang cập nhật",
  hdd: "HDD đang cập nhật",
  psu: "PSU đang cập nhật",
  case: "CASE đang cập nhật",
  cooler: "COOLER đang cập nhật",
};

const COMBO_PAGE_SIZE = 4;
const RELATED_PAGE_SIZE = 5;
const VIEWED_PAGE_SIZE = 5;

const DETAIL_LABEL_MAP = {
  sku: "SKU",
  source: "Nguồn",
  cores: "Số nhân",
  type: "Loại",
  part: "Nhóm linh kiện",
  laptop_type: "Loai laptop",
  macbook_type: "Loai macbook",
  dong: "Dòng sản phẩm",
  chip: "Chip",
  cpu_core: "CPU Core",
  gpu_core: "GPU Core",
  ram: "RAM",
  ssd: "SSD",
  hdd: "HDD",
  man_hinh: "Màn hình",
  mau: "Màu sắc",
  nam: "Năm",
};

const toTitleWords = (value) =>
  String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .split(/\s+/g)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const normalizeDetailLabel = (raw) => {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  return DETAIL_LABEL_MAP[key] || toTitleWords(raw);
};

const parseDescriptionDetails = (description) => {
  const segments = String(description || "")
    .split(/\r?\n|\|/g)
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  const rows = [];
  const seen = new Set();

  segments.forEach((segment) => {
    const match = segment.match(/^([^:]{2,40})\s*:\s*(.+)$/);
    if (!match) return;

    const rawLabel = String(match[1] || "").trim();
    const value = String(match[2] || "").trim();
    if (!rawLabel || !value) return;

    const dedupeKey = rawLabel.toLowerCase().replace(/\s+/g, "_");
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    rows.push({
      id: dedupeKey,
      label: normalizeDetailLabel(rawLabel),
      value,
      isLink: /^https?:\/\//i.test(value),
    });
  });

  return rows.slice(0, 14);
};

const normalizeSpecDetails = (specDetails) => {
  if (!Array.isArray(specDetails)) return [];

  return specDetails
    .map((item, index) => {
      const key = String(item?.key || item?.spec_key || "").trim();
      const value = String(item?.value || item?.spec_value || "").trim();
      if (!key || !value) return null;

      return {
        id: `spec-${key.toLowerCase().replace(/\s+/g, "_")}-${index + 1}`,
        label: normalizeDetailLabel(key),
        value,
        isLink: /^https?:\/\//i.test(value),
      };
    })
    .filter(Boolean);
};

const mergeDetailRows = (specRows, description, productCode) => {
  const merged = [];
  const seen = new Set();

  const sku = String(productCode || "").trim();
  const baseRows = sku
    ? [{ id: "sku", label: "SKU", value: sku, isLink: false }, ...specRows]
    : [...specRows];

  [...baseRows, ...parseDescriptionDetails(description)].forEach((row) => {
    const dedupeKey = `${String(row.label || "").toLowerCase()}|${String(row.value || "").toLowerCase()}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    merged.push(row);
  });

  return merged.slice(0, 20);
};

const uniqueById = (items) => {
  const seen = new Set();

  return (Array.isArray(items) ? items : []).filter((item) => {
    const key = String(item?.id ?? "").trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const getPageCount = (length, pageSize) => {
  const safeSize = Math.max(1, Number(pageSize || 1));
  const total = Math.ceil(Number(length || 0) / safeSize);
  return total > 0 ? total : 1;
};

const slicePageItems = (items, page, pageSize) => {
  const safeList = Array.isArray(items) ? items : [];
  if (safeList.length === 0) return [];

  const totalPages = getPageCount(safeList.length, pageSize);
  const safePage = ((Number(page || 0) % totalPages) + totalPages) % totalPages;
  const start = safePage * pageSize;
  return safeList.slice(start, start + pageSize);
};

const shuffleItems = (items) => {
  const cloned = Array.isArray(items) ? [...items] : [];

  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[randomIndex]] = [cloned[randomIndex], cloned[i]];
  }

  return cloned;
};

const pickRandomItems = (items, limit) =>
  shuffleItems(items).slice(0, Math.max(0, Number(limit || 0)));

const playAddToCartTone = () => {
  if (typeof window === "undefined") return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.14);
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.22);
    oscillator.onended = () => ctx.close().catch(() => {});
  } catch {
    // no-op
  }
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getComboSearchKeywords = (product) => {
  const text = normalizeText(`${product?.name || ""} ${product?.type || ""}`);

  if (text.includes("laptop") || text.includes("macbook")) {
    return ["chuột", "bàn phím", "tai nghe", "màn hình", "ssd"];
  }

  if (text.includes("màn hình") || text.includes("monitor")) {
    return ["bàn phím", "chuột", "tai nghe", "pc", "laptop"];
  }

  if (
    text.includes("chuột") ||
    text.includes("bàn phím") ||
    text.includes("tai nghe") ||
    text.includes("gear")
  ) {
    return ["chuột", "bàn phím", "tai nghe", "pad", "màn hình"];
  }

  if (
    text.includes("cpu") ||
    text.includes("gpu") ||
    text.includes("vga") ||
    text.includes("ram") ||
    text.includes("ssd") ||
    text.includes("hdd") ||
    text.includes("linh kiện")
  ) {
    return ["cpu", "ram", "ssd", "nguồn", "case", "màn hình"];
  }

  if (text.includes("pc")) {
    return ["màn hình", "chuột", "bàn phím", "tai nghe", "ssd"];
  }

  return ["màn hình", "chuột", "bàn phím", "tai nghe", "laptop"];
};

const toCardProduct = (item) => {
  const image = toAbsoluteImageUrl(item?.image_url || item?.image || "");

  return {
    id: item?.id,
    name: item?.name || "Sản phẩm",
    type: item?.category_name || "SẢN PHẨM",
    image,
    price: Number(item?.price || 0),
    specs: {
      cpu: item?.cpu || FALLBACK_SPEC.cpu,
      ram: item?.ram || FALLBACK_SPEC.ram,
      vga: item?.vga || FALLBACK_SPEC.vga,
    },
  };
};

const toComboItem = (item) => ({
  id: item?.id,
  name: item?.name || "Sản phẩm gợi ý",
  image: toAbsoluteImageUrl(item?.image_url || item?.image || ""),
  price: Number(item?.price || 0),
});

const toPersonalPreviewItem = (item) => ({
  id: item?.id,
  productId: Number(item?.product_id || item?.productId || item?.id || 0),
  name: item?.product_name || item?.name || "Sản phẩm",
  image: toAbsoluteImageUrl(item?.image_url || item?.image || ""),
  quantity: Number(item?.quantity || item?.qty || 1),
  price: Number(item?.unit_price || item?.price || 0),
  orderStatus: item?.order_status || "",
});

const normalizeProduct = (data) => {
  if (!data) return null;

  const baseImage = data.image_url || data.image || "";
  const normalizedImage = baseImage ? toAbsoluteImageUrl(baseImage) : "";
  const gallery = Array.isArray(data.gallery) && data.gallery.length > 0
    ? data.gallery.map((img) => toAbsoluteImageUrl(img))
    : normalizedImage
    ? [normalizedImage]
    : [];

  return {
    id: data.id,
    categoryId: Number(data.category_id || 0),
    productCode: data.product_code || data.productCode || "",
    name: data.name,
    price: Number(data.price ?? 0),
    oldPrice: Number(data.old_price ?? 0),
    brand: data.brand || data.category_name || "PC STORE",
    type: data.category_name || "PC",
    description: data.description,
    specDetails: normalizeSpecDetails(data.spec_details || data.specDetails || []),
    image: normalizedImage,
    gallery,
    specs: {
      cpu: data.cpu || data.specs?.cpu || FALLBACK_SPEC.cpu,
      mainboard: data.mainboard || data.specs?.mainboard || FALLBACK_SPEC.mainboard,
      ram: data.ram || data.specs?.ram || FALLBACK_SPEC.ram,
      vga: data.vga || data.specs?.vga || FALLBACK_SPEC.vga,
      ssd: data.ssd || data.specs?.ssd || FALLBACK_SPEC.ssd,
      hdd: data.hdd || data.specs?.hdd || FALLBACK_SPEC.hdd,
      psu: data.psu || data.specs?.psu || FALLBACK_SPEC.psu,
      case: data.case || data.specs?.case || FALLBACK_SPEC.case,
      cooler: data.cooler || data.specs?.cooler || FALLBACK_SPEC.cooler,
    },
  };
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [rating, setRating] = useState({ avgRating: 0, totalReviews: 0 });
  const [apiComboItems, setApiComboItems] = useState([]);
  const [apiRelatedProducts, setApiRelatedProducts] = useState([]);
  const [apiViewedProducts, setApiViewedProducts] = useState([]);
  const [cartPreviewItems, setCartPreviewItems] = useState([]);
  const [purchasedPreviewItems, setPurchasedPreviewItems] = useState([]);
  const [loadingPersonalData, setLoadingPersonalData] = useState(false);
  const [localComboItems, setLocalComboItems] = useState(() =>
    pickRandomItems(comboItems, 12)
  );
  const [comboPage, setComboPage] = useState(0);
  const [relatedPage, setRelatedPage] = useState(0);
  const [viewedPage, setViewedPage] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      setLoading(true);
      setInfo("");

      try {
        const apiData = await fetchProductById(id);
        if (!mounted) return;

        const normalized = normalizeProduct(apiData?.data || apiData);
        setProduct(normalized);
        setError("");
      } catch (err) {
        if (mounted) {
          setProduct(null);
          setError(err?.message || "Không tải được chi tiết sản phẩm tu API.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const loadRating = async () => {
      try {
        const r = await fetchProductRating(id);
        if (!mounted || !r) return;

        setRating({
          avgRating: Number(r.avgRating ?? r.avg_rating ?? 0),
          totalReviews: Number(r.totalReviews ?? r.total_reviews ?? 0),
        });
      } catch {
        // ignore rating errors
      }
    };

    loadProduct();
    loadRating();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadSideProducts = async () => {
      if (!product?.id) {
        setApiComboItems([]);
        setApiRelatedProducts([]);
        setApiViewedProducts([]);
        return;
      }

      try {
        const relatedParams = {
          status: "active",
          limit: 12,
          page: 1,
          sortBy: "created_at",
          sortOrder: "desc",
        };

        if (product.categoryId > 0) {
          relatedParams.categoryId = product.categoryId;
        }

        const comboKeywords = getComboSearchKeywords(product);
        const comboKeywordRequests = comboKeywords.slice(0, 3).map((keyword) =>
          fetchProducts({
            status: "active",
            search: keyword,
            limit: 20,
            page: 1,
            sortBy: "created_at",
            sortOrder: "desc",
          })
        );

        const [relatedResponse, viewedResponse, comboBaseResponse, ...comboKeywordResponses] = await Promise.all([
          fetchProducts(relatedParams),
          fetchProducts({
            status: "active",
            limit: 20,
            page: 1,
            sortBy: "created_at",
            sortOrder: "desc",
          }),
          fetchProducts({
            status: "active",
            limit: 48,
            page: 1,
            sortBy: "created_at",
            sortOrder: "desc",
          }),
          ...comboKeywordRequests,
        ]);

        if (!mounted) return;

        const relatedRaw = (relatedResponse?.data || []).filter(
          (item) => Number(item.id) !== Number(product.id)
        );
        const viewedRaw = (viewedResponse?.data || []).filter(
          (item) => Number(item.id) !== Number(product.id)
        );

        const related = uniqueById([...relatedRaw, ...viewedRaw])
          .slice(0, 12)
          .map(toCardProduct);
        const viewed = uniqueById([...viewedRaw, ...relatedRaw])
          .slice(0, 12)
          .map(toCardProduct);

        const comboKeywordRaw = comboKeywordResponses.flatMap(
          (response) => response?.data || []
        );

        const comboCandidates = uniqueById([
          ...(comboBaseResponse?.data || []),
          ...comboKeywordRaw,
          ...relatedRaw,
          ...viewedRaw,
        ]).filter((item) => {
          if (Number(item?.id) === Number(product.id)) return false;
          if (Number(item?.price || 0) <= 0) return false;
          return String(item?.name || "").trim().length > 1;
        });

        const normalizedKeywords = comboKeywords.map((keyword) =>
          normalizeText(keyword)
        );

        const comboScore = (item) => {
          const content = normalizeText(
            `${item?.name || ""} ${item?.category_name || ""}`
          );

          let score = 0;
          normalizedKeywords.forEach((keyword, index) => {
            if (content.includes(keyword)) {
              score += 6 - index;
            }
          });

          if (Number(item?.category_id || 0) !== Number(product.categoryId || 0)) {
            score += 1;
          }

          return score;
        };

        const scoredComboPool = [...comboCandidates].sort(
          (a, b) => comboScore(b) - comboScore(a)
        );
        const randomCombo = pickRandomItems(scoredComboPool.slice(0, 24), 12).map(
          toComboItem
        );

        setApiComboItems(randomCombo);
        setApiRelatedProducts(related);
        setApiViewedProducts(viewed);
      } catch {
        if (mounted) {
          setApiComboItems([]);
          setApiRelatedProducts([]);
          setApiViewedProducts([]);
        }
      }
    };

    loadSideProducts();

    return () => {
      mounted = false;
    };
  }, [product?.categoryId, product?.id]);

  useEffect(() => {
    let mounted = true;

    const loadPersonalData = async () => {
      try {
        setLoadingPersonalData(true);
        const [cartItems, purchasedResult] = await Promise.all([
          fetchCart(token),
          token
            ? fetchMyPurchasedItems(token, { limit: 12 })
            : Promise.resolve({ data: [] }),
        ]);

        if (!mounted) return;

        const normalizedCart = (cartItems || []).map(toPersonalPreviewItem);
        const normalizedPurchased = uniqueById(
          (purchasedResult?.data || []).map(toPersonalPreviewItem)
        );

        setCartPreviewItems(normalizedCart);
        setPurchasedPreviewItems(normalizedPurchased);
      } catch {
        if (!mounted) return;
        setCartPreviewItems([]);
        setPurchasedPreviewItems([]);
      } finally {
        if (mounted) {
          setLoadingPersonalData(false);
        }
      }
    };

    loadPersonalData();

    return () => {
      mounted = false;
    };
  }, [id, token]);

  const safeDefaultImage = product?.gallery?.[0] ?? product?.image ?? "";
  const displayImage = product?.gallery?.includes(activeImage) ? activeImage : safeDefaultImage;
  const displayCode = String(product?.productCode || "").trim() || `PC-${String(Number(product?.id ?? 0) + 1).padStart(4, "0")}`;

  const comboProducts = useMemo(
    () => (apiComboItems.length > 0 ? apiComboItems : localComboItems),
    [apiComboItems, localComboItems]
  );
  const relatedProducts = useMemo(() => apiRelatedProducts, [apiRelatedProducts]);
  const viewedProducts = useMemo(() => apiViewedProducts, [apiViewedProducts]);
  const comboTotalPages = useMemo(
    () => getPageCount(comboProducts.length, COMBO_PAGE_SIZE),
    [comboProducts.length]
  );
  const relatedTotalPages = useMemo(
    () => getPageCount(relatedProducts.length, RELATED_PAGE_SIZE),
    [relatedProducts.length]
  );
  const viewedTotalPages = useMemo(
    () => getPageCount(viewedProducts.length, VIEWED_PAGE_SIZE),
    [viewedProducts.length]
  );
  const visibleComboItems = useMemo(
    () => slicePageItems(comboProducts, comboPage, COMBO_PAGE_SIZE),
    [comboPage, comboProducts]
  );
  const visibleRelatedProducts = useMemo(
    () => slicePageItems(relatedProducts, relatedPage, RELATED_PAGE_SIZE),
    [relatedPage, relatedProducts]
  );
  const visibleViewedProducts = useMemo(
    () => slicePageItems(viewedProducts, viewedPage, VIEWED_PAGE_SIZE),
    [viewedPage, viewedProducts]
  );
  const detailRows = useMemo(
    () => mergeDetailRows(product?.specDetails || [], product?.description, product?.productCode),
    [product?.description, product?.specDetails, product?.productCode]
  );
  const currentProductCartQty = useMemo(() => {
    if (!product?.id) return 0;

    return cartPreviewItems
      .filter((item) => Number(item.productId) === Number(product.id))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }, [cartPreviewItems, product?.id]);
  const visibleCartPreview = useMemo(
    () => cartPreviewItems.slice(0, 4),
    [cartPreviewItems]
  );
  const visiblePurchasedPreview = useMemo(
    () => purchasedPreviewItems.slice(0, 4),
    [purchasedPreviewItems]
  );

  useEffect(() => {
    setApiComboItems([]);
    setLocalComboItems(pickRandomItems(comboItems, 12));
    setComboPage(0);
    setRelatedPage(0);
    setViewedPage(0);
  }, [id]);

  useEffect(() => {
    setComboPage((prev) => Math.min(prev, comboTotalPages - 1));
  }, [comboTotalPages]);

  useEffect(() => {
    setRelatedPage((prev) => Math.min(prev, relatedTotalPages - 1));
  }, [relatedTotalPages]);

  useEffect(() => {
    setViewedPage((prev) => Math.min(prev, viewedTotalPages - 1));
  }, [viewedTotalPages]);

  const rotatePage = (setPage, totalPages, direction) => {
    if (totalPages <= 1) return;

    setPage((prev) => {
      const next = prev + direction;
      if (next < 0) return totalPages - 1;
      if (next >= totalPages) return 0;
      return next;
    });
  };

  const handleComboAction = (item) => {
    if (item?.id) {
      navigate(`/product/${item.id}`);
      return;
    }

    const keyword = String(item?.name || "").trim();
    if (!keyword) {
      navigate("/products");
      return;
    }
    navigate(`/products?search=${encodeURIComponent(keyword)}`);
  };

  const handleOpenProductDetail = (item) => {
    if (!item?.id) return;
    navigate(`/product/${item.id}`);
  };

  const handleOpenPersonalProduct = (item) => {
    const targetId = Number(item?.productId || item?.id || 0);
    if (!Number.isFinite(targetId) || targetId <= 0) return;
    navigate(`/product/${targetId}`);
  };

  const handleAddToCart = async () => {
    if (!product?.id) return;

    setInfo("");
    setError("");

    try {
      await addToCartApi(
        {
          productId: product.id,
          quantity: 1,
          guestProduct: {
            name: product.name,
            price: product.price,
            image_url: product.image,
          },
        },
        token
      );
      setInfo(token ? "Đã thêm vào giỏ hàng." : "Đã thêm vào giỏ hàng (guest).");
      playAddToCartTone();

      const latestCart = await fetchCart(token);
      setCartPreviewItems((latestCart || []).map(toPersonalPreviewItem));
    } catch (err) {
      const message = err?.message || "Thêm giỏ hàng thất bại.";
      setError(message);
      notifyError(message);
    }
  };

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-shell">
          <div className="pd-empty">Đang tải dữ liệu sản phẩm...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pd-page">
        <div className="pd-shell">
          <div className="pd-empty">{error || "Không tìm thấy sản phẩm."}</div>
        </div>
      </div>
    );
  }

  const specRows = [
    { label: "CPU", value: product.specs.cpu },
    { label: "MAIN", value: product.specs.mainboard },
    { label: "RAM", value: product.specs.ram },
    { label: "VGA", value: product.specs.vga },
    { label: "SSD", value: product.specs.ssd },
    { label: "HDD", value: product.specs.hdd },
    { label: "PSU", value: product.specs.psu },
    { label: "CASE", value: product.specs.case },
    { label: "COOLER", value: product.specs.cooler },
  ];

  return (
    <div className="pd-page">
      <div className="pd-shell">
        <p className="pd-breadcrumb">HOME / PRODUCTS / {product.type}</p>

        <section className="pd-top-grid">
          <article className="pd-gallery-box">
            <div className="pd-main-image-wrap">
              <img
                src={displayImage || product.image}
                alt={product.name}
                className="pd-main-image"
              />
            </div>

            <div className="pd-thumb-row">
              {(product.gallery || []).slice(0, 6).map((image) => (
                <button
                  key={image}
                  type="button"
                  className={activeImage === image ? "is-active" : ""}
                  onClick={() => setActiveImage(image)}
                >
                  <img src={image} alt="Thumb" />
                </button>
              ))}
            </div>

            <div className="pd-gallery-note">
              <span>Xem ngay bộ ảnh chi tiết + video lắp ráp</span>
            </div>
          </article>

          <article className="pd-summary-box">
            <h1>{product.name}</h1>
            <p className="pd-meta">
              Mã SP: {displayCode} | Thương hiệu: {product.brand}
            </p>

            <div className="pd-price-row">
              <strong>{formatCurrency(product.price)}</strong>
              {product.oldPrice > product.price ? <span>{formatCurrency(product.oldPrice)}</span> : null}
            </div>

            <div className="pd-action-row">
              <button type="button" className="primary" onClick={handleAddToCart}>
                Mua ngay
              </button>
              <button type="button">Tra gop 0%</button>
              <button type="button">Tu van build</button>
            </div>

            <button type="button" className="pd-cart-btn" onClick={handleAddToCart}>
              Thêm vào giỏ hàng
            </button>
            {token && currentProductCartQty > 0 ? (
              <p className="pd-cart-presence">
                Sản phẩm này đã có trong giỏ: x{currentProductCartQty}
              </p>
            ) : null}

            {info && <p className="pd-meta" style={{ color: "#1f7a1f", marginTop: "6px" }}>{info}</p>}
            {error && <p className="pd-meta" style={{ color: "#d14343", marginTop: "6px" }}>{error}</p>}

            <section className="pd-personal-box">
              <header className="pd-personal-head">
                <h3>Giỏ hàng và lịch sử mua</h3>
                <button
                  type="button"
                  className="pd-personal-open-cart"
                  onClick={() => navigate("/cart")}
                >
                  Mở giỏ hàng
                </button>
              </header>

              {loadingPersonalData ? (
                <p className="pd-personal-empty">Đang đồng bộ dữ liệu giỏ hàng...</p>
              ) : (
                <div className="pd-personal-grid">
                  <section className="pd-personal-col">
                    <h4>Trong giỏ hàng ({cartPreviewItems.length})</h4>
                    <div className="pd-personal-list">
                      {visibleCartPreview.length > 0 ? (
                        visibleCartPreview.map((item) => (
                          <button
                            key={`cart-preview-${item.id}-${item.productId}`}
                            type="button"
                            className="pd-personal-item"
                            onClick={() => handleOpenPersonalProduct(item)}
                          >
                            <img src={item.image || product.image} alt={item.name} />
                            <div>
                              <p>{item.name}</p>
                              <span>
                                x{Math.max(1, Number(item.quantity || 1))} | {formatCurrency(item.price)}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="pd-personal-empty">Chưa có sản phẩm trong giỏ hàng.</p>
                      )}
                    </div>
                  </section>

                  <section className="pd-personal-col">
                    <h4>Đã mua gần đây ({token ? purchasedPreviewItems.length : 0})</h4>
                    <div className="pd-personal-list">
                      {!token ? (
                        <p className="pd-personal-empty">
                          Đăng nhập để xem lịch sử mua hàng.
                        </p>
                      ) : visiblePurchasedPreview.length > 0 ? (
                        visiblePurchasedPreview.map((item) => (
                          <button
                            key={`purchased-preview-${item.id}-${item.productId}`}
                            type="button"
                            className="pd-personal-item"
                            onClick={() => handleOpenPersonalProduct(item)}
                          >
                            <img src={item.image || product.image} alt={item.name} />
                            <div>
                              <p>{item.name}</p>
                              <span>
                                {formatCurrency(item.price)} | {item.orderStatus || "completed"}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="pd-personal-empty">Chưa có lịch sử mua hàng.</p>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </section>

            <section className="pd-promo-box">
              <h3>Khuyến mãi</h3>
              <ul>
                <li>Tặng key bản quyền Office bản quyền.</li>
                <li>Ưu đãi giảm giá kèm màn hình và gear.</li>
                <li>Hỗ trợ cài đặt driver + test game miễn phí.</li>
              </ul>
            </section>

            <section className="pd-spec-box">
              <h3>Thông số kỹ thuật</h3>
              <table>
                <tbody>
                  {specRows.map((row) => (
                    <tr key={row.label}>
                      <th>{row.label}</th>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {detailRows.length > 0 ? (
              <section className="pd-spec-box">
                <h3>Chi tiết sản phẩm</h3>
                <table className="pd-detail-table">
                  <tbody>
                    {detailRows.map((row) => (
                      <tr key={row.id}>
                        <th>{row.label}</th>
                        <td>
                          {row.isLink ? (
                            <a href={row.value} target="_blank" rel="noreferrer" className="pd-detail-link">
                              {row.value}
                            </a>
                          ) : (
                            row.value
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
          </article>

          <aside className="pd-ad-box">
            {uiBanners.productDetailSidebar && <img src={uiBanners.productDetailSidebar} alt="Khuyến mãi" />}
          </aside>
        </section>

        <section className="pd-combo-box">
          <header className="pd-section-header">
            <h2>Mua thêm combo</h2>
            <span>{comboProducts.length} sản phẩm</span>
          </header>
          <div className="pd-combo-wrap">
            <button
              type="button"
              className="pd-arrow"
              onClick={() => rotatePage(setComboPage, comboTotalPages, -1)}
              disabled={comboTotalPages <= 1}
              aria-label="Combo trước"
            >
              {"<"}
            </button>
            <div className="pd-combo-grid row-stagger">
              {visibleComboItems.length > 0 ? (
                visibleComboItems.map((item) => (
                  <article key={item.id} className="pd-combo-card">
                    <div className="pd-combo-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <p>{item.name}</p>
                    <span>{formatCurrency(item.price)}</span>
                    <button type="button" onClick={() => handleComboAction(item)}>
                      Them ngay
                    </button>
                  </article>
                ))
              ) : (
                <p className="pd-empty-note">Đang cập nhật combo.</p>
              )}
            </div>
            <button
              type="button"
              className="pd-arrow"
              onClick={() => rotatePage(setComboPage, comboTotalPages, 1)}
              disabled={comboTotalPages <= 1}
              aria-label="Combo sau"
            >
              {">"}
            </button>
          </div>
        </section>

        <section className="pd-related-box">
          <header className="pd-section-header">
            <h2>Sản phẩm tương tự</h2>
            <span>{relatedProducts.length} sản phẩm</span>
          </header>

          <div className="pd-related-wrap">
            <button
              type="button"
              className="pd-arrow"
              onClick={() => rotatePage(setRelatedPage, relatedTotalPages, -1)}
              disabled={relatedTotalPages <= 1}
              aria-label="Sản phẩm tương tự truoc"
            >
              {"<"}
            </button>
            <div className="pd-related-grid row-stagger">
              {visibleRelatedProducts.length > 0 ? (
                visibleRelatedProducts.map((item) => (
                  <ProductCard
                    key={`related-${item.id}`}
                    product={item}
                    compact
                    buttonLabel="Xem chi tiết"
                    onButtonClick={handleOpenProductDetail}
                  />
                ))
              ) : (
                <p className="pd-empty-note">Chưa có sản phẩm tương tự.</p>
              )}
            </div>
            <button
              type="button"
              className="pd-arrow"
              onClick={() => rotatePage(setRelatedPage, relatedTotalPages, 1)}
              disabled={relatedTotalPages <= 1}
              aria-label="Sản phẩm tương tự sau"
            >
              {">"}
            </button>
          </div>
        </section>

        <section className="pd-info-grid">
          <article className="pd-news-box">
            <h2>Tin tức về công nghệ</h2>
            <div className="pd-news-list">
              {articleCards.map((article) => (
                <article key={article.id} className="pd-news-item">
                  <img src={article.image} alt={article.title} />
                  <div>
                    <p>{article.title}</p>
                    <span>Tư vấn cấu hình + benchmark</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="pd-review-box">
            <h2>Bình luận và đánh giá</h2>
            <p className="pd-score">
              {rating.avgRating.toFixed(1)}/5
            </p>
            <p className="pd-score-note">{rating.totalReviews} đánh giá từ API</p>
            <button type="button">Đánh giá ngay</button>
          </article>
        </section>

        <section className="pd-bottom-grid">
          <article className="pd-viewed-box">
            <header className="pd-section-header">
              <h2>Sản phẩm đã xem</h2>
              <span>{viewedProducts.length} sản phẩm</span>
            </header>

            <div className="pd-viewed-wrap">
              <button
                type="button"
                className="pd-arrow"
                onClick={() => rotatePage(setViewedPage, viewedTotalPages, -1)}
                disabled={viewedTotalPages <= 1}
                aria-label="Sản phẩm đã xem trước"
              >
                {"<"}
              </button>
              <div className="pd-viewed-grid row-stagger">
                {visibleViewedProducts.length > 0 ? (
                  visibleViewedProducts.map((item) => (
                    <ProductCard
                      key={`view-${item.id}`}
                      product={item}
                      compact
                      buttonLabel="Xem chi tiết"
                      onButtonClick={handleOpenProductDetail}
                    />
                  ))
                ) : (
                  <p className="pd-empty-note">Chưa có sản phẩm đã xem.</p>
                )}
              </div>
              <button
                type="button"
                className="pd-arrow"
                onClick={() => rotatePage(setViewedPage, viewedTotalPages, 1)}
                disabled={viewedTotalPages <= 1}
                aria-label="Sản phẩm đã xem sau"
              >
                {">"}
              </button>
            </div>
          </article>

          <article className="pd-qa-box">
            <h2>Hỏi và đáp</h2>
            <p>Nhân viên kỹ thuật sẽ trả lời trong 5 phút.</p>
            <button type="button">Hỏi ngay</button>
          </article>
        </section>
      </div>
    </div>
  );
}



