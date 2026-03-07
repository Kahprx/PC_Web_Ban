import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  createProduct,
  fetchCategories,
  fetchProductById,
  toAbsoluteImageUrl,
  updateProduct,
  uploadProductImage,
} from "../../services/productService";
import "./AdminPages.css";

const initialForm = {
  name: "",
  categoryId: "",
  price: "",
  stockQty: "0",
  status: "active",
  imageUrl: "",
  description: "",
};

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();

  const isEditMode = useMemo(() => Boolean(id), [id]);

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const formStats = useMemo(
    () => [
      {
        label: "Che do",
        value: isEditMode ? "Edit" : "Create",
        note: isEditMode ? "Dang cap nhat SKU ton tai." : "Dang tao SKU moi cho catalog.",
      },
      {
        label: "Danh muc",
        value: categories.length,
        note: "So danh muc backend dang co san de map san pham.",
      },
      {
        label: "Upload",
        value: uploading ? "Dang xu ly" : "San sang",
        note: "Anh co the upload len backend hoac nhap URL truc tiep.",
      },
      {
        label: "Quyen CRUD",
        value: token ? "Admin auth" : "Can dang nhap",
        note: "Form nay yeu cau token backend de luu thay doi that.",
      },
    ],
    [categories.length, isEditMode, token, uploading]
  );

  useEffect(() => {
    const loadBase = async () => {
      try {
        const categoryData = await fetchCategories();
        setCategories(categoryData);
      } catch (err) {
        setError(err?.message || "Không tải được danh mục.");
      }
    };

    loadBase();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const product = await fetchProductById(id);

        if (!product) {
          setError("Không tìm thấy sản phẩm để chỉnh sửa.");
          return;
        }

        setForm({
          name: product.name || "",
          categoryId: String(product.category_id || ""),
          price: String(product.price || ""),
          stockQty: String(product.stock_qty ?? 0),
          status: product.status || "active",
          imageUrl: product.image_url || "",
          description: product.description || "",
        });
      } catch (err) {
        setError(err?.message || "Không tải được thông tin sản phẩm.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, isEditMode]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!token) {
      setError("Bạn cần đăng nhập admin backend để upload ảnh.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const result = await uploadProductImage(file, token);
      if (result?.imageUrl) {
        handleChange("imageUrl", result.imageUrl);
      }
    } catch (err) {
      setError(err?.message || "Upload ảnh thất bại.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError("Bạn cần đăng nhập admin backend để thao tác CRUD.");
      return;
    }

    if (!form.name.trim()) {
      setError("Tên sản phẩm là bắt buộc.");
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      setError("Giá sản phẩm không hợp lệ.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        price: Number(form.price),
        stockQty: Number(form.stockQty || 0),
        status: form.status,
        imageUrl: form.imageUrl || null,
        description: form.description || null,
      };

      if (isEditMode) {
        await updateProduct(id, payload, token);
      } else {
        await createProduct(payload, token);
      }

      navigate("/admin/products", { replace: true });
    } catch (err) {
      setError(err?.message || "Lưu sản phẩm thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-header">
          <div>
            <p className="admin-kicker">Product editor</p>
            <h1>{isEditMode ? `Cap nhat san pham #${id}` : "Tao san pham moi"}</h1>
            <p>
              Toi giu nguyen luong CRUD backend, nhung dua man form nay ve cung he
              giao dien admin moi de no khong bi tach khoi dashboard va order manager.
            </p>
          </div>

          <div className="admin-hero-actions">
            <button
              type="button"
              className="admin-link-button-outline"
              onClick={() => navigate("/admin/products")}
            >
              Ve danh sach san pham
            </button>
          </div>
        </div>
      </section>

      <section className="admin-overview-grid">
        {formStats.map((item) => (
          <article key={item.label} className="admin-overview-card">
            <p>{item.label}</p>
            <strong>{item.value}</strong>
            <span>{item.note}</span>
          </article>
        ))}
      </section>

      <section className="admin-form">
        <h2>{isEditMode ? `Cập nhật sản phẩm #${id}` : "Tạo sản phẩm mới"}</h2>
        <p>Nhap thong tin co ban, map danh muc va preview anh truoc khi luu.</p>

        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <div className="admin-form-field">
            <label>Tên sản phẩm</label>
            <input
              type="text"
              placeholder="Nhập tên sản phẩm"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              disabled={loading}
            />
          </div>

          <div className="admin-form-field">
            <label>Danh mục</label>
            <select
              value={form.categoryId}
              onChange={(event) => handleChange("categoryId", event.target.value)}
              disabled={loading}
            >
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form-field">
            <label>Giá bán</label>
            <input
              type="number"
              min="0"
              placeholder="39990000"
              value={form.price}
              onChange={(event) => handleChange("price", event.target.value)}
              disabled={loading}
            />
          </div>

          <div className="admin-form-field">
            <label>Số lượng tồn</label>
            <input
              type="number"
              min="0"
              placeholder="10"
              value={form.stockQty}
              onChange={(event) => handleChange("stockQty", event.target.value)}
              disabled={loading}
            />
          </div>

          <div className="admin-form-field">
            <label>Trạng thái</label>
            <select
              value={form.status}
              onChange={(event) => handleChange("status", event.target.value)}
              disabled={loading}
            >
              <option value="active">Đang bán</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
          </div>

          <div className="admin-form-field">
            <label>Upload ảnh sản phẩm</label>
            <input type="file" accept="image/*" onChange={handleUploadImage} disabled={loading || uploading} />
            {uploading && <small>Đang upload ảnh...</small>}
          </div>

          <div className="admin-form-field full">
            <label>URL ảnh</label>
            <input
              type="text"
              placeholder="/uploads/ten-anh.jpg hoặc URL đầy đủ"
              value={form.imageUrl}
              onChange={(event) => handleChange("imageUrl", event.target.value)}
              disabled={loading}
            />
          </div>

          {form.imageUrl && (
            <div className="admin-form-field full">
              <label>Preview ảnh</label>
              <div className="admin-image-preview">
                <img src={toAbsoluteImageUrl(form.imageUrl)} alt="Preview" />
              </div>
            </div>
          )}

          <div className="admin-form-field full">
            <label>Mô tả ngắn</label>
            <textarea
              rows={4}
              placeholder="Mô tả sản phẩm"
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="admin-form-field full">
              <p className="admin-inline-error">{error}</p>
            </div>
          )}

          <div className="admin-form-field full">
            <div className="admin-toolbar">
              <button type="submit" className="admin-btn" disabled={loading || uploading}>
                {loading ? "ĐANG LƯU..." : isEditMode ? "LƯU CẬP NHẬT" : "TẠO SẢN PHẨM"}
              </button>
              <button
                type="button"
                className="admin-btn-outline"
                onClick={() => navigate("/admin/products")}
                disabled={loading || uploading}
              >
                HỦY
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
