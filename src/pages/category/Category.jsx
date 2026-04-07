import { Navigate, useLocation, useParams } from "react-router-dom";

const toTitleFromSlug = (slug) =>
  String(slug || "")
    .replace(/-/g, " ")
    .trim();

export default function Category() {
  const { slug = "" } = useParams();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  if (!params.get("title")) {
    params.set("title", toTitleFromSlug(slug) || "sản phẩm");
  }

  return <Navigate to={`/products?${params.toString()}`} replace />;
}

