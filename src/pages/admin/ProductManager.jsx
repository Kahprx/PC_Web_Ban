import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteProduct,
  fetchProducts,
  toAbsoluteImageUrl,
} from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import { formatVnd } from "../../utils/currency";

import iconCategory from "../../assets/images/PC/ICON/category.png";
import iconSearch from "../../assets/images/PC/ICON/search.png";
import iconEdit from "../../assets/images/PC/ICON/edit.png";
import iconDelete from "../../assets/images/PC/ICON/delete.png";

import "./AdminPages.css";

const recentCustomers = [
  { id: "#21050213", name: "Nguyễn Văn A", total: 6_942_000, status: "pending" },
  { id: "#21050214", name: "Trần Văn B", total: 12_390_000, status: "shipping" },
  { id: "#21050215", name: "Lê Minh C", total: 24_990_000, status: "done" },
  { id: "#21050216", name: "Phan Hải D", total: 4_200_000, status: "pending" },
];

const customerStatusMap = {
  pending: { label: "CHỜ XỬ LÝ", tone: "pending" },
  shipping: { label: "ĐANG GIAO", tone: "shipping" },
  done: { label: "HOÀN THÀNH", tone: "done" },
};

const formatPrice = (value) => formatVnd(value);

const resolveProductStatus = (product) => {
  if (Number(product.stock_qty) <= 0) {
    return { label: "HẾT HÀNG", tone: "out-stock" };
  }

  if (String(product.status || "").toLowerCase() === "inactive") {
    return { label: "TẠM ẨN", tone: "importing" };
  }

  return { label: "CÒN HÀNG", tone: "in-stock" };
};

export default function ProductManager() {
  const { token } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const productQueryStatus = useMemo(() => {
    if (statusFilter === "all") return "";
    return statusFilter;
  }, [statusFilter]);

  const productStats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter((item) => Number(item.stock_qty) <= 0).length;
    const hidden = products.filter((item) => String(item.status || "").toLowerCase() === "inactive").length;
    const active = total - outOfStock - hidden;

    return {
      total,
      active: Math.max(active, 0),
      hidden,
      outOfStock,
    };
  }, [products]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await fetchProducts({
        search,
        status: productQueryStatus,
        page: 1,
        limit: 50,
      });

      setProducts(result?.data || []);
    } catch (err) {
      setError(err?.message || "Không tải được danh sách sản phẩm.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [productQueryStatus, search]);

  useEffect(() => {
    const handle = setTimeout(() => {
      loadProducts();
    }, 250);

    return () => clearTimeout(handle);
  }, [loadProducts]);

  const handleDelete = async (id) => {
    if (!token) {
      setError("Bạn đang ở local demo account. Hãy đăng xuất và đăng nhập admin backend (ví dụ: tk2 / 123456 hoặc admin@kahstore.vn / Admin@123).");
      return;
    }

    const confirmed = window.confirm("Bạn chắc chắn muốn xóa sản phẩm này?");
    if (!confirmed) return;

    try {
      await deleteProduct(id, token);
      await loadProducts();
    } catch (err) {
      setError(err?.message || "Xóa sản phẩm thất bại.");
    }
  };

  return (
    <div className="admin-page admin-product-page">
      <section className="admin-hero">
        <div className="admin-hero-header">
          <div>
            <p className="admin-kicker">Catalog control</p>
            <h1>Quản lý sản phẩm</h1>
            <p>
              Màn này đã được đồng bộ với hệ UI admin mới: có hero, overview cards và
              khu CRUD rõ ràng hơn thay vì chỉ còn bảng dữ liệu thô.
            </p>
          </div>

          <div className="admin-hero-actions">
            <Link to="/admin/products/create" className="admin-link-button">
              Thêm sản phẩm
            </Link>
            <button type="button" className="admin-link-button-outline" onClick={loadProducts}>
              Làm mới danh sách
            </button>
          </div>
        </div>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-overview-card">
          <p>Tổng SKU</p>
          <strong>{productStats.total}</strong>
          <span>Số sản phẩm hiện có trong danh sách quản trị.</span>
        </article>
        <article className="admin-overview-card">
          <p>Đang bán</p>
          <strong>{productStats.active}</strong>
          <span>Ưu tiên các SKU còn hàng và đang active trên hệ thống.</span>
        </article>
        <article className="admin-overview-card">
          <p>Tạm ẩn</p>
          <strong>{productStats.hidden}</strong>
          <span>Các mục đang inactive hoặc chưa sẵn sàng hiển thị storefront.</span>
        </article>
        <article className="admin-overview-card">
          <p>Hết hàng</p>
          <strong>{productStats.outOfStock}</strong>
          <span>SKU cần nhập lại hoặc chuyển trạng thái hiển thị phù hợp.</span>
        </article>
      </section>

      <section className="admin-product-panel">
          <div className="admin-surface-head">
            <div>
              <h2>Bộ lọc và bảng sản phẩm</h2>
              <p>Tìm kiếm, lọc trạng thái và thực hiện CRUD trực tiếp trên bảng.</p>
            </div>
          </div>

        <div className="admin-product-filters">
          <label className="admin-product-search" aria-label="Tìm kiếm sản phẩm">
            <img src={iconSearch} alt="Search" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select className="admin-filter-select" defaultValue="all-category" disabled>
            <option value="all-category">Tất cả danh mục</option>
          </select>

          <label className="admin-status-filter" aria-label="Lọc trạng thái">
            <span>Trạng thái :</span>
            <select
              className="admin-filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang bán</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
          </label>

          <button type="button" className="admin-grid-button" aria-label="Refresh" onClick={loadProducts}>
            <img src={iconCategory} alt="Grid" />
          </button>
        </div>

        {error && <p className="admin-inline-error">{error}</p>}

        <div className="admin-product-table-wrap">
          <table className="admin-product-table">
            <thead>
              <tr>
                <th>ẢNH</th>
                <th>TÊN SẢN PHẨM</th>
                <th>TỔNG TIỀN</th>
                <th>TRẠNG THÁI</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="admin-table-empty">Đang tải dữ liệu...</td>
                </tr>
              )}

              {!loading && products.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-table-empty">Không có sản phẩm.</td>
                </tr>
              )}

              {!loading &&
                products.map((item) => {
                  const status = resolveProductStatus(item);

                  return (
                    <tr key={item.id}>
                      <td className="admin-col-thumb">
                        <div className="admin-product-thumb">
                          <img
                            src={toAbsoluteImageUrl(item.image_url) || "https://via.placeholder.com/56x56?text=N/A"}
                            alt={item.name}
                            loading="lazy"
                          />
                        </div>
                      </td>

                      <td className="admin-col-name">{item.name}</td>
                      <td className="admin-col-price">{formatPrice(item.price)}</td>
                      <td>
                        <span className={`admin-status-pill ${status.tone}`}>{status.label}</span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <Link to={`/admin/products/edit/${item.id}`} className="admin-action-button" aria-label="Sửa">
                            <img src={iconEdit} alt="Sửa" />
                          </Link>
                          <button
                            type="button"
                            className="admin-action-button"
                            aria-label="Xóa"
                            onClick={() => handleDelete(item.id)}
                          >
                            <img src={iconDelete} alt="Xóa" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-product-panel">
        <div className="admin-surface-head">
          <div>
            <h2>Thông tin khách hàng gần đây</h2>
            <p>Khối phụ để tham chiếu nhanh các đơn phát sinh quanh catalog.</p>
          </div>
        </div>

        <div className="admin-product-table-wrap">
          <table className="admin-product-table admin-customer-table">
            <thead>
              <tr>
                <th>MA</th>
                <th>KHÁCH</th>
                <th>TỔNG TIỀN</th>
                <th>TRẠNG THÁI</th>
                <th>HÀNH ĐỘNG</th>
              </tr>
            </thead>

            <tbody>
              {recentCustomers.map((customer) => {
                const status = customerStatusMap[customer.status];

                return (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td className="admin-col-name">{customer.name}</td>
                    <td className="admin-col-price">{formatPrice(customer.total)}</td>
                    <td>
                      <span className={`admin-status-pill ${status.tone}`}>{status.label}</span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button type="button" className="admin-action-button" aria-label="Sửa" disabled>
                          <img src={iconEdit} alt="Sửa" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}



