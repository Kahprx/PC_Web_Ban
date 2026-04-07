import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../context/AuthContext";
import {
  createProduct,
  fetchCategories,
  fetchProductById,
  toAbsoluteImageUrl,
  updateProduct,
  uploadProductImage,
} from "../../services/productService";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./AdminPages.css";

const ProductSchema = Yup.object({
  name: Yup.string().trim().min(3, "Tên tối thiểu 3 ký tự").required("Tên sản phẩm là bắt buộc"),
  categoryId: Yup.string().required("Danh mục là bắt buộc"),
  price: Yup.number().min(0, "Giá phải >= 0").required("Giá là bắt buộc"),
  stockQty: Yup.number().min(0, "Tồn kho phải >= 0").required("Tồn kho là bắt buộc"),
  status: Yup.string().oneOf(["active", "inactive"]).required("Trạng thái là bắt buộc"),
  imageUrl: Yup.string().trim().required("URL ảnh là bắt buộc"),
  description: Yup.string().trim().min(10, "Mô tả tối thiểu 10 ký tự").required("Mô tả là bắt buộc"),
});

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

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initialValues, setInitialValues] = useState(initialForm);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((error) => notifyError(error, "Không tải được danh mục"));
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        const product = await fetchProductById(id);

        if (!product) {
          notifyError("Không tìm thấy sản phẩm");
          return;
        }

        setInitialValues({
          name: product.name || "",
          categoryId: String(product.category_id || ""),
          price: String(product.price || ""),
          stockQty: String(product.stock_qty ?? 0),
          status: product.status || "active",
          imageUrl: product.image_url || "",
          description: product.description || "",
        });
      } catch (error) {
        notifyError(error, "Không tải được thông tin sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, isEditMode]);

  if (loading && isEditMode) {
    return (
      <div className="admin-page">
        <section className="admin-surface">
          <p>Đang tải dữ liệu...</p>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero-header">
          <div>
            <p className="admin-kicker">Product editor</p>
            <h1>{isEditMode ? `Cập nhật sản phẩm #${id}` : "Tạo sản phẩm mới"}</h1>
            <p>Toàn bộ text trong form đã được chuẩn hóa để dễ đọc và dễ thao tác.</p>
          </div>
        </div>
      </section>

      <section className="admin-form">
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={ProductSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              if (!token) {
                throw new Error("Cần đăng nhập admin backend để thao tác");
              }

              const payload = {
                name: values.name.trim(),
                categoryId: Number(values.categoryId),
                price: Number(values.price),
                stockQty: Number(values.stockQty || 0),
                status: values.status,
                imageUrl: values.imageUrl,
                description: values.description,
              };

              if (isEditMode) {
                await updateProduct(id, payload, token);
                notifySuccess("Cập nhật sản phẩm thành công");
              } else {
                await createProduct(payload, token);
                notifySuccess("Tạo sản phẩm thành công");
              }

              navigate("/admin/products", { replace: true });
            } catch (error) {
              notifyError(error, "Lưu sản phẩm thất bại");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="admin-form-grid">
              <div className="admin-form-field">
                <label>Tên sản phẩm</label>
                <Field name="name" type="text" placeholder="Nhập tên sản phẩm" />
                <ErrorMessage name="name" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field">
                <label>Danh mục</label>
                <Field as="select" name="categoryId">
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="categoryId" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field">
                <label>Giá bán</label>
                <Field name="price" type="number" min="0" />
                <ErrorMessage name="price" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field">
                <label>Số lượng tồn</label>
                <Field name="stockQty" type="number" min="0" />
                <ErrorMessage name="stockQty" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field">
                <label>Trạng thái</label>
                <Field as="select" name="status">
                  <option value="active">Đang bán</option>
                  <option value="inactive">Tạm ẩn</option>
                </Field>
                <ErrorMessage name="status" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field">
                <label>Upload ảnh sản phẩm</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    try {
                      if (!token) {
                        throw new Error("Cần đăng nhập admin backend để upload ảnh");
                      }

                      setUploading(true);
                      const result = await uploadProductImage(file, token);
                      if (result?.imageUrl) {
                        setFieldValue("imageUrl", result.imageUrl);
                        notifySuccess("Upload ảnh thành công");
                      }
                    } catch (error) {
                      notifyError(error, "Upload ảnh thất bại");
                    } finally {
                      setUploading(false);
                      event.target.value = "";
                    }
                  }}
                />
                {uploading ? <small>Đang upload...</small> : null}
              </div>

              <div className="admin-form-field full">
                <label>URL ảnh</label>
                <Field name="imageUrl" type="text" placeholder="/uploads/ten-anh.jpg" />
                <ErrorMessage name="imageUrl" component="small" className="admin-inline-error" />
              </div>

              {values.imageUrl ? (
                <div className="admin-form-field full">
                  <label>Xem trước ảnh</label>
                  <div className="admin-image-preview">
                    <img src={toAbsoluteImageUrl(values.imageUrl)} alt="Preview" />
                  </div>
                </div>
              ) : null}

              <div className="admin-form-field full">
                <label>Mô tả ngắn</label>
                <Field as="textarea" rows={4} name="description" placeholder="Mô tả sản phẩm" />
                <ErrorMessage name="description" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field full">
                <div className="admin-toolbar">
                  <button type="submit" className="admin-btn" disabled={isSubmitting || uploading}>
                    {isSubmitting ? "ĐANG LƯU..." : isEditMode ? "LƯU CẬP NHẬT" : "TẠO SẢN PHẨM"}
                  </button>
                  <button type="button" className="admin-btn-outline" onClick={() => navigate("/admin/products")}>
                    HỦY
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </section>
    </div>
  );
}




