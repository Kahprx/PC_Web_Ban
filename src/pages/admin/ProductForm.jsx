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
  name: Yup.string().trim().min(3, "Ten toi thieu 3 ky tu").required("Ten san pham la bat buoc"),
  categoryId: Yup.string().required("Danh muc la bat buoc"),
  price: Yup.number().min(0, "Gia phai >= 0").required("Gia la bat buoc"),
  stockQty: Yup.number().min(0, "Ton kho phai >= 0").required("Ton kho la bat buoc"),
  status: Yup.string().oneOf(["active", "inactive"]).required("Trang thai la bat buoc"),
  imageUrl: Yup.string().trim().required("URL anh la bat buoc"),
  description: Yup.string().trim().min(10, "Mo ta toi thieu 10 ky tu").required("Mo ta la bat buoc"),
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
      .catch((error) => notifyError(error, "Khong tai duoc danh muc"));
  }, []);

  useEffect(() => {
    if (!isEditMode) return;

    const loadProduct = async () => {
      try {
        setLoading(true);
        const product = await fetchProductById(id);

        if (!product) {
          notifyError("Khong tim thay san pham");
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
        notifyError(error, "Khong tai duoc thong tin san pham");
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
          <p>Dang tai du lieu...</p>
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
            <h1>{isEditMode ? `Cap nhat san pham #${id}` : "Tao san pham moi"}</h1>
            <p>Toan bo text trong form da duoc chuan hoa de de doc va de thao tac.</p>
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
                throw new Error("Can dang nhap admin backend de thao tac");
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
                notifySuccess("Cap nhat san pham thanh cong");
              } else {
                await createProduct(payload, token);
                notifySuccess("Tao san pham thanh cong");
              }

              navigate("/admin/products", { replace: true });
            } catch (error) {
              notifyError(error, "Luu san pham that bai");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="admin-form-grid">
              <div className="admin-form-field">
                <label>Ten san pham</label>
                <Field name="name" type="text" placeholder="Nhap ten san pham" />
                <ErrorMessage name="name" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field">
                <label>Danh muc</label>
                <Field as="select" name="categoryId">
                  <option value="">Chon danh muc</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="categoryId" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field">
                <label>Gia ban</label>
                <Field name="price" type="number" min="0" />
                <ErrorMessage name="price" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field">
                <label>So luong ton</label>
                <Field name="stockQty" type="number" min="0" />
                <ErrorMessage name="stockQty" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field">
                <label>Trang thai</label>
                <Field as="select" name="status">
                  <option value="active">Dang ban</option>
                  <option value="inactive">Tam an</option>
                </Field>
                <ErrorMessage name="status" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field">
                <label>Upload anh san pham</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    try {
                      if (!token) {
                        throw new Error("Can dang nhap admin backend de upload anh");
                      }

                      setUploading(true);
                      const result = await uploadProductImage(file, token);
                      if (result?.imageUrl) {
                        setFieldValue("imageUrl", result.imageUrl);
                        notifySuccess("Upload anh thanh cong");
                      }
                    } catch (error) {
                      notifyError(error, "Upload anh that bai");
                    } finally {
                      setUploading(false);
                      event.target.value = "";
                    }
                  }}
                />
                {uploading ? <small>Dang upload...</small> : null}
              </div>

              <div className="admin-form-field full">
                <label>URL anh</label>
                <Field name="imageUrl" type="text" placeholder="/uploads/ten-anh.jpg" />
                <ErrorMessage name="imageUrl" component="small" className="admin-inline-error" />
              </div>

              {values.imageUrl ? (
                <div className="admin-form-field full">
                  <label>Xem truoc anh</label>
                  <div className="admin-image-preview">
                    <img src={toAbsoluteImageUrl(values.imageUrl)} alt="Preview" />
                  </div>
                </div>
              ) : null}

              <div className="admin-form-field full">
                <label>Mo ta ngan</label>
                <Field as="textarea" rows={4} name="description" placeholder="Mo ta san pham" />
                <ErrorMessage name="description" component="small" className="admin-inline-error" />
              </div>

              <div className="admin-form-field full">
                <div className="admin-toolbar">
                  <button type="submit" className="admin-btn" disabled={isSubmitting || uploading}>
                    {isSubmitting ? "DANG LUU..." : isEditMode ? "LUU CAP NHAT" : "TAO SAN PHAM"}
                  </button>
                  <button type="button" className="admin-btn-outline" onClick={() => navigate("/admin/products")}>
                    HUY
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
