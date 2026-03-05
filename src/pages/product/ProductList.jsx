import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  brandFilters,
  categoryTiles,
  formatCurrency,
  gpuFilters,
  products,
  uiBanners,
} from "../../data/storeData";
import "./ProductList.css";

const PAGE_SIZE = 12;
const PRICE_MIN = 0;
const PRICE_MAX = 500_000_000;

const quickFilters = [
  { id: "quick-need", label: "CHỌN THEO NHU CẦU", iconIndex: 0 },
  { id: "quick-price", label: "CHỌN THEO GIÁ", iconIndex: 1 },
  { id: "quick-build", label: "BUILD CÓ SẴN", iconIndex: 2 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const matchGpuFilter = (product, gpuKey) => {
  if (gpuKey === "all") return true;

  const vga = product.specs.vga.toUpperCase();

  if (gpuKey === "RTX5000") return vga.includes("RTX 50");
  if (gpuKey === "RTX4000") return vga.includes("RTX 40");
  if (gpuKey === "RTX3000") return vga.includes("RTX 30");
  if (gpuKey === "RX") return vga.includes("RX");

  return true;
};

export default function ProductList() {
  const [search, setSearch] = useState("");
  const [categoryKey, setCategoryKey] = useState("all");
  const [brandKey, setBrandKey] = useState("all");
  const [gpuKey, setGpuKey] = useState("all");
  const [minPrice, setMinPrice] = useState(PRICE_MIN);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [page, setPage] = useState(1);

  const categoryOptions = useMemo(
    () => [{ key: "all", label: "TẤT CẢ" }, ...categoryTiles.map((tile) => ({ key: tile.slug, label: tile.label }))],
    []
  );

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchCategory = categoryKey === "all" ? true : product.slug === categoryKey;
      const matchBrand = brandKey === "all" ? true : product.brand === brandKey;
      const matchGpu = matchGpuFilter(product, gpuKey);
      const matchPrice = product.price >= minPrice && product.price <= maxPrice;
      const matchSearch =
        keyword.length === 0
          ? true
          : `${product.name} ${product.specs.cpu} ${product.specs.vga}`
              .toLowerCase()
              .includes(keyword);

      return matchCategory && matchBrand && matchGpu && matchPrice && matchSearch;
    });
  }, [brandKey, categoryKey, gpuKey, maxPrice, minPrice, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const visibleProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resetFilters = () => {
    setCategoryKey("all");
    setBrandKey("all");
    setGpuKey("all");
    setSearch("");
    setMinPrice(PRICE_MIN);
    setMaxPrice(PRICE_MAX);
    setPage(1);
  };

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

  return (
    <div className="plist-page">
      <div className="plist-shell">
        <aside className="plist-sidebar">
          <section className="plist-filter-box">
            <h3>Danh Mục</h3>
            <div className="plist-filter-option-list">
              {categoryOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`plist-filter-option ${categoryKey === option.key ? "is-active" : ""}`}
                  onClick={() => {
                    setCategoryKey(option.key);
                    setPage(1);
                  }}
                >
                  <span className="plist-filter-indicator" aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="plist-filter-box">
            <h3>Khoảng giá</h3>

            <div className="plist-price-control">
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={100_000}
                value={minPrice}
                onChange={(event) => updateMinPrice(event.target.value)}
                aria-label="Giá tối thiểu"
              />
              <input
                type="range"
                min={PRICE_MIN}
                max={PRICE_MAX}
                step={100_000}
                value={maxPrice}
                onChange={(event) => updateMaxPrice(event.target.value)}
                aria-label="Giá tối đa"
              />
            </div>

            <div className="plist-price-input-row">
              <input
                type="number"
                min={PRICE_MIN}
                max={PRICE_MAX}
                value={minPrice}
                onChange={(event) => updateMinPrice(event.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                min={PRICE_MIN}
                max={PRICE_MAX}
                value={maxPrice}
                onChange={(event) => updateMaxPrice(event.target.value)}
              />
            </div>
          </section>

          <section className="plist-filter-box">
            <h3>GPU</h3>
            <div className="plist-filter-option-list">
              {gpuFilters.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`plist-filter-option ${gpuKey === option.key ? "is-active" : ""}`}
                  onClick={() => {
                    setGpuKey(option.key);
                    setPage(1);
                  }}
                >
                  <span className="plist-filter-indicator" aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>

            <div className="plist-filter-action-row">
              <button type="button" className="btn-apply" onClick={() => setPage(1)}>
                ÁP DỤNG
              </button>
              <button type="button" className="btn-clear" onClick={resetFilters}>
                XÓA LỌC
              </button>
            </div>
          </section>

          <section className="plist-filter-box">
            <h3>Thương hiệu</h3>
            <div className="plist-filter-option-list">
              {brandFilters.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`plist-filter-option ${brandKey === option.key ? "is-active" : ""}`}
                  onClick={() => {
                    setBrandKey(option.key);
                    setPage(1);
                  }}
                >
                  <span className="plist-filter-indicator" aria-hidden="true" />
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <p className="plist-side-label">Trang sản phẩm</p>

          <article className="plist-sidebar-banner">
            {uiBanners.productListSidebar && <img src={uiBanners.productListSidebar} alt="Build PC" />}
          </article>
        </aside>

        <main className="plist-main">
          <header className="plist-main-header">
            <h1>TRANG SẢN PHẨM</h1>
            <div className="plist-header-actions">
              <input
                type="text"
                value={search}
                placeholder="Tìm theo tên sản phẩm..."
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
              <span>
                {visibleProducts.length}/{filteredProducts.length} sản phẩm
              </span>
            </div>
          </header>

          <section className="plist-quick-filter-row">
            {quickFilters.map((quick) => {
              const icon = categoryTiles[quick.iconIndex]?.icon;
              return (
                <button key={quick.id} type="button" className="plist-quick-filter-card">
                  {icon && <img src={icon} alt={quick.label} />}
                  <p>{quick.label}</p>
                </button>
              );
            })}
          </section>

          <section className="plist-grid-box">
            <div className="plist-grid">
              {visibleProducts.map((product) => (
                <article key={product.id} className="plist-card">
                  <Link to={`/product/${product.id}`} className="plist-card-image">
                    <img src={product.image} alt={product.name} />
                  </Link>

                  <p className="plist-card-type">{product.type}</p>

                  <Link to={`/product/${product.id}`} className="plist-card-name">
                    {product.name}
                  </Link>

                  <p className="plist-card-price">{formatCurrency(product.price)}</p>

                  <Link to={`/product/${product.id}`} className="plist-card-button">
                    THÊM VÀO GIỎ HÀNG
                  </Link>
                </article>
              ))}
            </div>

            {visibleProducts.length === 0 && (
              <div className="plist-empty">Không có sản phẩm phù hợp bộ lọc hiện tại.</div>
            )}

            <div className="plist-pagination">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage === 1}
              >
                {'<'}
              </button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === safePage ? "is-active" : ""}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage === totalPages}
              >
                {'>'}
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
