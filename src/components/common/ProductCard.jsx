import { Link } from "react-router-dom";
import { formatCurrency } from "../../data/storeData";
import "./ProductCard.css";

export default function ProductCard({
  product,
  buttonLabel = "THEM VAO GIO HANG",
  compact = false,
}) {
  if (!product) return null;

  return (
    <article className={`product-card ${compact ? "is-compact" : ""}`}>
      <Link to={`/product/${product.id}`} className="product-card-image-wrap">
        <img src={product.image} alt={product.name} className="product-card-image" />
      </Link>

      <div className="product-card-body">
        <p className="product-card-type">{product.type}</p>

        <Link to={`/product/${product.id}`} className="product-card-name">
          {product.name}
        </Link>

        <p className="product-card-spec">
          {product.specs.cpu} | {product.specs.ram} | {product.specs.vga}
        </p>

        <p className="product-card-price">{formatCurrency(product.price)}</p>

        <button type="button" className="product-card-button">
          {buttonLabel}
        </button>
      </div>
    </article>
  );
}