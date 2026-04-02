import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchCart } from "../../services/cartService";
import { createOrder } from "../../services/orderService";
import { notifyError, notifySuccess } from "../../utils/notify";
import { formatVnd } from "../../utils/currency";
import "../shared/PageBlocks.css";

const CheckoutSchema = Yup.object({
  fullName: Yup.string().trim().min(2, "Ho ten toi thieu 2 ky tu").required("Ho ten la bat buoc"),
  phone: Yup.string()
    .trim()
    .matches(/^(0|\+84)[0-9]{9,10}$/, "So dien thoai khong hop le")
    .required("So dien thoai la bat buoc"),
  email: Yup.string().trim().email("Email khong hop le").required("Email la bat buoc"),
  shippingAddress: Yup.string().trim().min(10, "Dia chi toi thieu 10 ky tu").required("Dia chi la bat buoc"),
  paymentMethod: Yup.string().oneOf(["cod", "banking"]).required("Phuong thuc thanh toan la bat buoc"),
});

const mapApiCartItems = (items = []) =>
  items.map((item) => ({
    id: item.id ?? item.cart_item_id ?? item.product_id,
    productId: item.product_id ?? item.productId ?? item.id,
    name: item.product_name ?? item.name ?? `Product ${item.product_id || ""}`,
    image: item.image_url || item.image || "",
    price: Number(item.price ?? item.unit_price ?? 0),
    qty: Number(item.quantity ?? item.qty ?? 1),
  }));

export default function Checkout() {
  const navigate = useNavigate();
  const { token, session } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const apiItems = await fetchCart(token);
        setItems(mapApiCartItems(apiItems));
      } catch (error) {
        notifyError(error, "Khong tai duoc gio hang");
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [token]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0),
    [items]
  );

  const shippingFee = subtotal >= 30_000_000 ? 0 : items.length > 0 ? 45_000 : 0;
  const total = subtotal + shippingFee;

  const orderItems = items.map((item) => ({
    productId: item.productId,
    quantity: item.qty,
  }));

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Checkout workspace</p>
          <h1 className="page-title">Xac nhan thong tin va dat hang.</h1>
          <p className="page-subtitle">Form checkout da duoc chuyen sang Formik + Yup va goi API tao don that.</p>

          <div className="page-hero-actions">
            <span className="page-inline-code">Checkout API</span>
            <Link to="/cart" className="page-btn-outline">
              Quay lai gio hang
            </Link>
          </div>
        </div>
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Shipping profile</p>
                <h2>Thong tin nhan hang</h2>
              </div>
            </div>

            <Formik
              initialValues={{
                fullName: session?.name || "",
                phone: "",
                email: session?.email || "",
                shippingAddress: "",
                paymentMethod: "cod",
              }}
              validationSchema={CheckoutSchema}
              onSubmit={async (values, { setSubmitting }) => {
                try {
                  if (!token) {
                    throw new Error("Can dang nhap de dat hang");
                  }

                  if (orderItems.length === 0) {
                    throw new Error("Gio hang dang trong");
                  }

                  const shippingAddress = `${values.fullName} - ${values.phone} - ${values.shippingAddress}`;

                  const result = await createOrder(
                    {
                      items: orderItems,
                      shippingAddress,
                      paymentMethod: values.paymentMethod,
                    },
                    token
                  );

                  notifySuccess("Tao don hang thanh cong");
                  navigate("/confirm", {
                    replace: true,
                    state: {
                      order: result?.data || null,
                    },
                  });
                } catch (error) {
                  notifyError(error, "Dat hang that bai");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {({ isSubmitting }) => (
                <Form className="page-form">
                  <div className="page-form-grid">
                    <div className="page-field">
                      <label>Ho va ten</label>
                      <Field name="fullName" type="text" placeholder="Nguyen Van A" />
                      <ErrorMessage name="fullName" component="div" className="auth-note is-error" />
                    </div>

                    <div className="page-field">
                      <label>So dien thoai</label>
                      <Field name="phone" type="text" placeholder="09xxxxxxxx" />
                      <ErrorMessage name="phone" component="div" className="auth-note is-error" />
                    </div>

                    <div className="page-field">
                      <label>Email lien he</label>
                      <Field name="email" type="email" placeholder="you@example.com" />
                      <ErrorMessage name="email" component="div" className="auth-note is-error" />
                    </div>

                    <div className="page-field">
                      <label>Thanh toan</label>
                      <Field as="select" name="paymentMethod">
                        <option value="cod">Thanh toan khi nhan hang</option>
                        <option value="banking">Chuyen khoan</option>
                      </Field>
                      <ErrorMessage name="paymentMethod" component="div" className="auth-note is-error" />
                    </div>

                    <div className="page-field full">
                      <label>Dia chi nhan hang</label>
                      <Field as="textarea" rows={3} name="shippingAddress" placeholder="So nha, duong, quan/huyen, tinh/thanh" />
                      <ErrorMessage name="shippingAddress" component="div" className="auth-note is-error" />
                    </div>
                  </div>

                  <div className="page-actions" style={{ marginTop: "14px" }}>
                    <button type="submit" className="page-btn" disabled={isSubmitting || loading || items.length === 0}>
                      {isSubmitting ? "DANG DAT HANG..." : "XAC NHAN DAT HANG"}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </section>
        </div>

        <aside className="page-stack">
          <section className="page-summary-card">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Order summary</p>
                <h2>Don hang</h2>
              </div>
            </div>

            {loading ? <p>Dang tai gio hang...</p> : null}

            <div className="page-item-list" style={{ marginTop: "14px" }}>
              {items.map((item) => (
                <article key={item.id} className="page-item-row">
                  <div className="page-item-thumb">
                    <img src={item.image} alt={item.name} />
                  </div>

                  <div>
                    <h3>{item.name}</h3>
                    <p>So luong: {item.qty}</p>
                  </div>

                  <div className="page-item-side">
                    <strong>{formatVnd(item.price * item.qty)}</strong>
                  </div>
                </article>
              ))}
            </div>

            <div className="page-summary-list" style={{ marginTop: "14px" }}>
              <div className="page-summary-line">
                <p>Tam tinh</p>
                <span>{formatVnd(subtotal)}</span>
              </div>
              <div className="page-summary-line">
                <p>Van chuyen</p>
                <span>{shippingFee === 0 ? "Mien phi" : formatVnd(shippingFee)}</span>
              </div>
            </div>

            <div className="page-summary-total">
              <p>Tong thanh toan</p>
              <strong>{formatVnd(total)}</strong>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
