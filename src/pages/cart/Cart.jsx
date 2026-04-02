import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency, products } from "../../data/storeData";
import { useAuth } from "../../context/AuthContext";
import {
  clearCartApi,
  fetchCart,
  removeCartItemApi,
  updateCartItemApi,
} from "../../services/cartService";
import "../shared/PageBlocks.css";

const initialCartItems = products.slice(0, 3).map((product, index) => ({
  ...product,
  qty: index === 1 ? 2 : 1,
  deliveryNote: index === 0 ? "Co san tai showroom, co the giao trong ngay." : "Hang du kho, du kien giao 1 - 3 ngay.",
}));

const serviceNotes = [
  {
    title: "Lap rap + cable management",
    text: "Kiem tra tuong thich, di day gon va test nhanh truoc khi giao.",
  },
  {
    title: "Bao hanh 1 doi 1 theo linh kien",
    text: "Nhan ho tro tiep nhan bao hanh va doi chieu serial ngay tai cua hang.",
  },
  {
    title: "Call xac nhan cau hinh",
    text: "CSKH goi lai truoc khi dong goi de tranh sai phien ban linh kien.",
  },
  {
    title: "Nang cap thanh combo",
    text: "Co the ghep them man hinh, gear va phan mem de tang gia tri don.",
  },
];

export default function Cart() {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDemo, setIsDemo] = useState(true);

  const mapApiCartItems = (items = []) =>
    items.map((item) => ({
      id: item.id ?? item.cart_item_id ?? item.product_id,
      productId: item.product_id ?? item.productId ?? item.id,
      name: item.product_name ?? item.name ?? `Product ${item.product_id || ""}`,
      image: item.image_url || item.image || "",
      price: Number(item.price ?? item.unit_price ?? 0),
      qty: Number(item.quantity ?? item.qty ?? 1),
      deliveryNote:
        item.stock_qty > 0 ? "Co san, giao nhanh" : "Dat truoc, giao 1 - 3 ngay",
      type: "SAN PHAM",
      specs: item.specs || {},
    }));

  const loadCart = async () => {
    if (!token) {
      setIsDemo(true);
      setCartItems(initialCartItems);
      setError("");
      return;
    }

    setLoading(true);
    try {
      const apiItems = await fetchCart(token);
      setCartItems(mapApiCartItems(apiItems));
      setIsDemo(false);
      setError("");
    } catch (err) {
      setError(err?.message || "Khong tai duoc cart tu API. Dang dung du lieu demo.");
      setIsDemo(true);
      setCartItems(initialCartItems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const updateQty = (id, delta) => {
    if (isDemo || !token) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
        )
      );
      return;
    }

    const target = cartItems.find((item) => item.id === id);
    if (!target) return;

    const nextQty = Math.max(1, target.qty + delta);

    updateCartItemApi({ cartItemId: id, quantity: nextQty }, token)
      .then(loadCart)
      .catch((err) => setError(err?.message || "Cap nhat so luong that bai"));
  };

  const removeItem = (id) => {
    if (isDemo || !token) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }

    removeCartItemApi(id, token)
      .then(loadCart)
      .catch((err) => setError(err?.message || "Xoa khoi gio that bai"));
  };

  const clearCart = () => {
    if (isDemo || !token) {
      setCartItems([]);
      return;
    }

    clearCartApi(token)
      .then(loadCart)
      .catch((err) => setError(err?.message || "Xoa gio hang that bai"));
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0
  );
  const shippingFee = subtotal >= 30_000_000 ? 0 : cartItems.length > 0 ? 45_000 : 0;
  const setupSupport = cartItems.length > 0 ? 0 : 0;
  const memberDiscount = subtotal >= 60_000_000 ? 750_000 : subtotal >= 30_000_000 ? 300_000 : 0;
  const total = Math.max(0, subtotal + shippingFee + setupSupport - memberDiscount);

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Cart workspace</p>
          <h1 className="page-title">Gio hang can ro gia tri don va thao tac nhanh.</h1>
          <p className="page-subtitle">
            Toi da doi gio hang tu bang don gian sang bo cuc card co thong tin cau
            hinh, so luong, dich vu di kem va bang tong ket de nguoi dung de chot
            don hon.
          </p>

          <div className="page-hero-actions">
            <span className="page-inline-code">Cart demo</span>
            <Link to="/products" className="page-btn-outline">
              Xem thêm sản phẩm
            </Link>
          </div>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
<p>Sản phẩm đang giữ</p>
          <strong>{cartItems.length}</strong>
          <span>So mon dang nam trong don cho khach xac nhan.</span>
        </article>

        <article className="page-highlight-card">
          <p>Tam tinh</p>
          <strong>{formatCurrency(subtotal)}</strong>
          <span>Cap nhat theo so luong, linh kien va phan qua di kem.</span>
        </article>

        <article className="page-highlight-card">
          <p>Van chuyen</p>
          <strong>{shippingFee === 0 ? "Mien phi" : formatCurrency(shippingFee)}</strong>
          <span>Don tu 30 trieu duoc uu tien free ship noi thanh.</span>
        </article>

        <article className="page-highlight-card">
          <p>Nguon du lieu</p>
          <strong>{isDemo ? "Demo" : "API"}</strong>
          <span>{isDemo ? "Dang su dung du lieu mau" : "Da ket noi API cart"}</span>
        </article>
      </section>

      {loading && (
        <section className="page-panel" style={{ marginTop: "12px" }}>
          <p>Dang tai du lieu gio hang...</p>
        </section>
      )}

      {error && (
        <section className="page-panel" style={{ marginTop: "12px" }}>
          <p style={{ color: "#d14343" }}>{error}</p>
        </section>
      )}

      {cartItems.length === 0 ? (
        <>
          <section className="page-empty-state">
            <p className="page-panel-kicker">Cart empty</p>
            <h2>Chua co san pham nao trong gio.</h2>
            <p>
              Ban co the quay lai danh muc san pham hoac vao Build PC de chon nhanh
              mot cau hinh phu hop nhu cau.
            </p>

            <div className="page-actions">
              <Link to="/products" className="page-btn">
                Di den san pham
              </Link>
              <Link to="/build-pc" className="page-btn-outline">
                Tu van Build PC
              </Link>
            </div>
          </section>

          <section className="page-support-card">
            <h2 className="page-title">Can sale goi lai de len cau hinh?</h2>
            <p className="page-subtitle">
              Neu ban chua chac ve main, VGA, PSU hay man hinh, trang Build PC va team
              tu van co the giup gom combo trong mot luot.
            </p>

            <div className="page-actions">
              <Link to="/build-pc" className="page-btn-outline">
                Mo cong cu Build PC
              </Link>
            </div>
          </section>
        </>
      ) : (
        <section className="page-layout-2-1">
          <div className="page-stack">
            <section className="page-panel">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-kicker">Cart items</p>
                  <h2>Danh sach san pham dang dat</h2>
                </div>
                <p>{cartItems.reduce((sum, item) => sum + item.qty, 0)} mon dang duoc giu cho don nay.</p>
              </div>

              <div className="page-cart-list" style={{ marginTop: "12px" }}>
                {cartItems.map((item) => (
                  <article key={item.id} className="page-cart-card">
                    <div className="page-cart-thumb">
                      <img src={item.image} alt={item.name} />
                    </div>

                    <div className="page-cart-content">
                      <div className="page-cart-head">
                        <div>
                          <h3>{item.name}</h3>
                          {item.specs?.cpu || item.specs?.vga ? (
                            <p>
                              {item.specs.cpu} | {item.specs.vga}
                            </p>
                          ) : (
                            <p>Thong so dang cap nhat</p>
                          )}
                          <div className="page-pill-row" style={{ marginTop: "8px" }}>
                            <span className="page-pill">{item.type}</span>
                            <span className="page-pill is-soft">{item.deliveryNote}</span>
                          </div>
                        </div>

                        <div className="page-cart-price">
                          <strong>{formatCurrency(item.price * item.qty)}</strong>
<span>{formatCurrency(item.price)} / sản phẩm</span>
                        </div>
                      </div>

                      <div className="page-cart-meta">
                        <div className="page-qty-control">
                          <button type="button" onClick={() => updateQty(item.id, -1)}>
                            -
                          </button>
                          <span>{item.qty}</span>
                          <button type="button" onClick={() => updateQty(item.id, 1)}>
                            +
                          </button>
                        </div>

                        <div className="page-cart-actions">
                          <Link to={`/product/${item.productId ?? item.id}`} className="page-ghost-btn">
                            Xem chi tiet
                          </Link>
                          <button type="button" className="page-ghost-btn" onClick={() => removeItem(item.id)}>
                            Xoa khoi gio
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="page-panel">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-kicker">Included services</p>
                  <h2>Dich vu va ghi chu di kem</h2>
                </div>
              </div>

              <div className="page-tip-grid" style={{ marginTop: "12px" }}>
                {serviceNotes.map((note) => (
                  <article key={note.title} className="page-tip-card">
                    <strong>{note.title}</strong>
                    <p>{note.text}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <div className="page-stack">
            <section className="page-summary-card page-sticky">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-kicker">Order summary</p>
                  <h2>Tong ket don hang</h2>
                </div>
              </div>

              <div className="page-summary-list" style={{ marginTop: "14px" }}>
                <div className="page-summary-line">
<p>Tạm tính sản phẩm</p>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="page-summary-line">
                  <p>Van chuyen</p>
                  <span>{shippingFee === 0 ? "Mien phi" : formatCurrency(shippingFee)}</span>
                </div>
                <div className="page-summary-line">
                  <p>Ho tro lap dat</p>
                  <span>{formatCurrency(setupSupport)}</span>
                </div>
                <div className="page-summary-line">
                  <p>Uu dai thanh vien</p>
                  <span>- {formatCurrency(memberDiscount)}</span>
                </div>
              </div>

              <div className="page-summary-total">
                <p>Grand total</p>
                <strong>{formatCurrency(total)}</strong>
                <span>
                  Gia tri nay la ban demo FE. Luong checkout / order that van chua
                  noi full voi API.
                </span>
              </div>

              <div className="page-checklist" style={{ marginTop: "12px" }}>
                <div className="page-checklist-row">
                  <p>Uu tien goi xac nhan</p>
                  <span>Trong 15 - 30 phut</span>
                </div>
                <div className="page-checklist-row">
                  <p>Trang thai giao nhanh</p>
                  <span>Ap dung noi thanh</span>
                </div>
              </div>

              <div className="page-actions" style={{ marginTop: "14px" }}>
                <Link to="/checkout" className="page-btn">
                  Sang checkout
                </Link>
                <Link to="/build-pc" className="page-btn-outline">
                  Chinh lai cau hinh
                </Link>
                <button type="button" className="page-btn-outline" onClick={clearCart}>
                  Xoa gio hang
                </button>
              </div>
            </section>
          </div>
        </section>
      )}
    </div>
  );
}
