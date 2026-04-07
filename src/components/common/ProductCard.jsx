import { Link } from "react-router-dom";
import { formatCurrency } from "../../data/storeData";
import "./ProductCard.css";

export default function ProductCard({
  product,
  buttonLabel = "THÊM VÀO GIỎ HÀNG",
  compact = false,
  onButtonClick,
}) {
  if (!product) return null;
  const specs = product.specs || {};
  const productImage = product.image || product.image_url || "";
  const productType = product.type || product.category_name || "SẢN PHẨM";
  const specSummary = [specs.cpu, specs.ram, specs.vga].filter(Boolean).join(" | ");

  return (
    <article className={`product-card ${compact ? "is-compact" : ""}`}>
      <Link to={`/product/${product.id}`} className="product-card-image-wrap">
        <img src={productImage} alt={product.name} className="product-card-image" />
      </Link>

      <div className="product-card-body">
        <p className="product-card-type">{productType}</p>

        <Link to={`/product/${product.id}`} className="product-card-name">
          {product.name}
        </Link>

        <p className="product-card-spec">{specSummary || "Thông số đang cập nhật"}</p>

        <p className="product-card-price">{formatCurrency(product.price)}</p>

        <button
          type="button"
          className="product-card-button"
          onClick={() => onButtonClick?.(product)}
        >
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}
