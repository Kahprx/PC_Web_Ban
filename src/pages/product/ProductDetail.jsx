import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../../components/common/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { addToCartApi } from "../../services/cartService";
import { fetchProductById, toAbsoluteImageUrl } from "../../services/productService";
import { fetchProductRating } from "../../services/reviewService";
import {
  articleCards,
  comboItems,
  formatCurrency,
  getProductById,
  getRelatedProducts,
  products,
  uiBanners,
} from "../../data/storeData";
import "./ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const { token } = useAuth();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [rating, setRating] = useState({ avgRating: 0, totalReviews: 0 });

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
      name: data.name,
      price: Number(data.price ?? 0),
      oldPrice: Number(data.price ?? 0) * 1.1,
      brand: data.brand || data.category_name || "PC STORE",
      type: data.category_name || "PC",
      description: data.description,
      image: normalizedImage,
      gallery,
      specs: {
        cpu: data.cpu || data.specs?.cpu || "CPU dang cap nhat",
        mainboard: data.mainboard || data.specs?.mainboard || "Mainboard dang cap nhat",
        ram: data.ram || data.specs?.ram || "RAM dang cap nhat",
        vga: data.vga || data.specs?.vga || "VGA dang cap nhat",
        ssd: data.ssd || data.specs?.ssd || "SSD dang cap nhat",
        hdd: data.hdd || data.specs?.hdd || "HDD dang cap nhat",
        psu: data.psu || data.specs?.psu || "PSU dang cap nhat",
        case: data.case || data.specs?.case || "CASE dang cap nhat",
        cooler: data.cooler || data.specs?.cooler || "COOLER dang cap nhat",
      },
    };
  };

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
        const fallback = getProductById(id);
        if (mounted) {
          setProduct(fallback);
          setError(err?.message ? `Fallback demo: ${err.message}` : "Dang dung du lieu demo");
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

  const safeDefaultImage = product?.gallery?.[0] ?? product?.image ?? "";
  const displayImage = product?.gallery?.includes(activeImage) ? activeImage : safeDefaultImage;

  const relatedProducts = useMemo(
    () => getRelatedProducts(product?.id ?? id, 8),
    [product?.id, id]
  );

  const viewedProducts = useMemo(() => {
    const currentId = product?.id ?? -1;
    return products.filter((item) => item.id !== currentId).slice(0, 6);
  }, [product]);

  const handleAddToCart = async () => {
    if (!product?.id) return;
    if (!token) {
      setError("Vui long dang nhap de them gio hang.");
      return;
    }

    setInfo("");
    setError("");

    try {
      await addToCartApi({ productId: product.id, quantity: 1 }, token);
      setInfo("Da them vao gio hang (API).");
    } catch (err) {
      setError(err?.message || "Them gio hang that bai.");
    }
  };

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-shell">
          <div className="pd-empty">Dang tai du lieu san pham...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pd-page">
        <div className="pd-shell">
          <div className="pd-empty">Khong tim thay san pham.</div>
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
              <span>Xem ngay bo anh chi tiet + video lap rap</span>
            </div>
          </article>

          <article className="pd-summary-box">
            <h1>{product.name}</h1>
            <p className="pd-meta">
              Ma SP: PC-{String(Number(product.id ?? 0) + 1).padStart(4, "0")} | Thuong hieu: {product.brand}
            </p>

            <div className="pd-price-row">
              <strong>{formatCurrency(product.price)}</strong>
              <span>{formatCurrency(product.oldPrice)}</span>
            </div>

            <div className="pd-action-row">
              <button type="button" className="primary" onClick={handleAddToCart}>
                Mua ngay
              </button>
              <button type="button">Tra gop 0%</button>
              <button type="button">Tu van build</button>
            </div>

            <button type="button" className="pd-cart-btn" onClick={handleAddToCart}>
              Them vao gio hang
            </button>

            {info && <p className="pd-meta" style={{ color: "#1f7a1f", marginTop: "6px" }}>{info}</p>}
            {error && <p className="pd-meta" style={{ color: "#d14343", marginTop: "6px" }}>{error}</p>}

            <section className="pd-promo-box">
              <h3>Khuyen mai</h3>
              <ul>
                <li>Tang key ban quyen Office ban quyen.</li>
                <li>Uu dai giam gia kem man hinh va gear.</li>
                <li>Ho tro cai dat driver + test game mien phi.</li>
              </ul>
            </section>

            <section className="pd-spec-box">
              <h3>Thong so ky thuat</h3>
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
          </article>

          <aside className="pd-ad-box">
            {uiBanners.productDetailSidebar && <img src={uiBanners.productDetailSidebar} alt="Khuyen mai" />}
          </aside>
        </section>

        <section className="pd-combo-box">
          <h2>Mua them combo</h2>
          <div className="pd-combo-grid">
            {comboItems.slice(0, 4).map((item) => (
              <article key={item.id} className="pd-combo-card">
                <div className="pd-combo-image">
                  <img src={item.image} alt={item.name} />
                </div>
                <p>{item.name}</p>
                <span>{formatCurrency(item.price)}</span>
                <button type="button">Them ngay</button>
              </article>
            ))}
          </div>
        </section>

        <section className="pd-related-box">
          <header>
            <h2>San pham tuong tu</h2>
          </header>

          <div className="pd-related-wrap">
            <button type="button" className="pd-arrow">
              {"<"}
            </button>
            <div className="pd-related-grid">
              {relatedProducts.map((item) => (
                <ProductCard
                  key={`related-${item.id}`}
                  product={item}
                  compact
                  buttonLabel="Xem chi tiet"
                />
              ))}
            </div>
            <button type="button" className="pd-arrow">
              {">"}
            </button>
          </div>
        </section>

        <section className="pd-info-grid">
          <article className="pd-news-box">
            <h2>Tin tuc ve cong nghe</h2>
            <div className="pd-news-list">
              {articleCards.map((article) => (
                <article key={article.id} className="pd-news-item">
                  <img src={article.image} alt={article.title} />
                  <div>
                    <p>{article.title}</p>
                    <span>Tu van cau hinh + benchmark</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="pd-review-box">
            <h2>Binh luan va danh gia</h2>
            <p className="pd-score">
              {rating.avgRating.toFixed(1)}/5
            </p>
            <p className="pd-score-note">{rating.totalReviews} danh gia tu API</p>
            <button type="button">Danh gia ngay</button>
          </article>
        </section>

        <section className="pd-bottom-grid">
          <article className="pd-viewed-box">
            <header>
              <h2>San pham da xem</h2>
            </header>

            <div className="pd-viewed-wrap">
              <button type="button" className="pd-arrow">
                {"<"}
              </button>
              <div className="pd-viewed-grid">
                {viewedProducts.map((item) => (
                  <ProductCard key={`view-${item.id}`} product={item} compact />
                ))}
              </div>
              <button type="button" className="pd-arrow">
                {">"}
              </button>
            </div>
          </article>

          <article className="pd-qa-box">
            <h2>Hoi va dap</h2>
            <p>Nhan vien ky thuat se tra loi trong 5 phut.</p>
            <button type="button">Hoi ngay</button>
          </article>
        </section>
      </div>
    </div>
  );
}
