import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductCard from "../../components/common/ProductCard";
import {
  brandFilters,
  categoryTiles,
  gpuFilters,
  priceRanges,
  products,
  uiBanners,
} from "../../data/storeData";
import "./Category.css";

const PAGE_SIZE = 12;

const matchGpuFilter = (product, gpuKey) => {
  if (gpuKey === "all") return true;

  const vga = product.specs.vga.toUpperCase();

  if (gpuKey === "RTX5000") return vga.includes("RTX 50");
  if (gpuKey === "RTX4000") return vga.includes("RTX 40");
  if (gpuKey === "RTX3000") return vga.includes("RTX 30");
  if (gpuKey === "RX") return vga.includes("RX");

  return true;
};

export default function Category() {
  const { slug = "pc-gaming" } = useParams();

  const [brand, setBrand] = useState("all");
  const [rangeKey, setRangeKey] = useState("all");
  const [gpuKey, setGpuKey] = useState("all");
  const [page, setPage] = useState(1);

  const currentCategory =
    categoryTiles.find((tile) => tile.slug === slug) ?? categoryTiles[0];

  const filteredProducts = useMemo(() => {
    const selectedRange =
      priceRanges.find((range) => range.key === rangeKey) ?? priceRanges[0];

    return products.filter((product) => {
      const matchCategory = product.slug === slug;
      const matchBrand = brand === "all" ? true : product.brand === brand;
      const matchPrice =
        product.price >= selectedRange.min && product.price < selectedRange.max;
      const matchGpu = matchGpuFilter(product, gpuKey);

      return matchCategory && matchBrand && matchPrice && matchGpu;
    });
  }, [brand, gpuKey, rangeKey, slug]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleProducts = filteredProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const applyFilter = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="category-page">
      <div className="category-shell">
        <aside className="category-sidebar">
          <section className="category-panel">
            <h3>Danh Muc</h3>
            <div className="category-link-list">
              {categoryTiles.map((tile) => (
                <Link
                  key={tile.slug}
                  to={`/category/${tile.slug}`}
                  className={tile.slug === slug ? "is-active" : ""}
                >
                  {tile.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="category-panel">
            <h3>Khoang gia</h3>
            <div className="category-filter-list">
              {priceRanges.map((range) => (
                <button
                  key={range.key}
                  type="button"
                  className={range.key === rangeKey ? "is-active" : ""}
                  onClick={() => applyFilter(setRangeKey, range.key)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </section>

          <section className="category-panel">
            <h3>GPU</h3>
            <div className="category-filter-list">
              {gpuFilters.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={option.key === gpuKey ? "is-active" : ""}
                  onClick={() => applyFilter(setGpuKey, option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          <section className="category-panel">
            <h3>Thuong hieu</h3>
            <div className="category-filter-list">
              {brandFilters.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={option.key === brand ? "is-active" : ""}
                  onClick={() => applyFilter(setBrand, option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="category-sidebar-actions">
              <button type="button">Ap dung</button>
              <button type="button" onClick={() => {
                setBrand("all");
                setRangeKey("all");
                setGpuKey("all");
                setPage(1);
              }}>
                Xoa loc
              </button>
            </div>
          </section>

          <article className="category-sidebar-banner">
            {uiBanners.categorySidebar && <img src={uiBanners.categorySidebar} alt="Sidebar promotion" />}
          </article>
        </aside>

        <main className="category-main">
          <section className="category-headline">
            <h1>{currentCategory.label}</h1>
            <p>{currentCategory.description}</p>
            <span>{filteredProducts.length} san pham</span>
          </section>

          <section className="category-quick-row">
            {categoryTiles.slice(0, 3).map((tile) => (
              <Link key={tile.slug} to={`/category/${tile.slug}`}>
                <img src={tile.icon} alt={tile.label} />
                <p>{tile.label}</p>
              </Link>
            ))}
          </section>

          <section className="category-grid-box">
            <div className="category-grid">
              {visibleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {visibleProducts.length === 0 && (
              <div className="category-empty">Khong tim thay san pham phu hop bo loc.</div>
            )}

            <div className="category-pagination">
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
