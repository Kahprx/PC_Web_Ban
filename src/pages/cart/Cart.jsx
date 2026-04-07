import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../data/storeData";
import { useAuth } from "../../context/AuthContext";
import {
  clearCartApi,
  fetchCart,
  removeCartItemApi,
  updateCartItemApi,
} from "../../services/cartService";
import "../shared/PageBlocks.css";

const mapApiCartItems = (items = []) =>
  items.map((item) => ({
    id: item.id ?? item.cart_item_id ?? item.product_id,
    productId: item.product_id ?? item.productId ?? item.id,
    name: item.product_name ?? item.name ?? `Product ${item.product_id || ""}`,
    image: item.image_url || item.image || "",
    price: Number(item.price ?? item.unit_price ?? 0),
    qty: Number(item.quantity ?? item.qty ?? 1),
    deliveryNote:
      Number(item.stock_qty || 0) > 0
        ? "Có sẵn, giao nhanh"
        : "Đặt trước, giao 1 - 3 ngày",
    specs: item.specs || {},
  }));

export default function Cart() {
  const { token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isGuest = !token;

  const loadCart = async () => {
    setLoading(true);
    try {
      const items = await fetchCart(token);
      setCartItems(mapApiCartItems(items));
      setError("");
    } catch (err) {
      setError(err?.message || "Không tải được giỏ hàng.");
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
        0
      ),
    [cartItems]
  );

  const shippingFee = subtotal >= 30_000_000 ? 0 : cartItems.length > 0 ? 45_000 : 0;
  const memberDiscount =
    subtotal >= 60_000_000 ? 750_000 : subtotal >= 30_000_000 ? 300_000 : 0;
  const total = Math.max(0, subtotal + shippingFee - memberDiscount);

  const updateQty = (id, delta) => {
    const target = cartItems.find((item) => String(item.id) === String(id));
    if (!target) return;

    const nextQty = Math.max(1, Number(target.qty || 1) + delta);

    updateCartItemApi({ cartItemId: id, quantity: nextQty }, token)
      .then(loadCart)
      .catch((err) => setError(err?.message || "Cập nhật số lượng thất bại."));
  };

  const removeItem = (id) => {
    removeCartItemApi(id, token)
      .then(loadCart)
      .catch((err) => setError(err?.message || "Xóa sản phẩm thất bại."));
  };

  const clearCart = () => {
    clearCartApi(token)
      .then(loadCart)
      .catch((err) => setError(err?.message || "Xóa giỏ hàng thất bại."));
  };

  return (
    <div className="page-shell cart-page">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Giỏ hàng</p>
          <h1 className="page-title">Kiểm tra nhanh trước khi thanh toán.</h1>
          <p className="page-subtitle">
            Giao diện đã rút gọn: chỉ giữ sản phẩm, số lượng và tổng tiền để thao tác nhanh hơn.
          </p>

          <div className="page-hero-actions">
            <span className="page-inline-code">{isGuest ? "Khách vãng lai" : "Đồng bộ API"}</span>
            <Link to="/products" className="page-btn-outline">
              Tiếp tục mua hàng
            </Link>
          </div>
        </div>
      </section>

      <section className="page-highlight-grid">
        <article className="page-highlight-card">
          <p>Sản phẩm</p>
          <strong>{totalItems}</strong>
          <span>Số lượng sản phẩm trong giỏ hiện tại.</span>
        </article>
        <article className="page-highlight-card">
          <p>Tạm tính</p>
          <strong>{formatCurrency(subtotal)}</strong>
          <span>Giá trị trước phí vận chuyển và ưu đãi.</span>
        </article>
        <article className="page-highlight-card">
          <p>Tổng thanh toán</p>
          <strong>{formatCurrency(total)}</strong>
          <span>Đã bao gồm phí vận chuyển và ưu đãi thành viên.</span>
        </article>
      </section>

      {loading ? (
        <section className="page-panel">
          <p>Đang tải dữ liệu giỏ hàng...</p>
        </section>
      ) : null}

      {error ? (
        <section className="page-panel">
          <p style={{ color: "#d14343", margin: 0 }}>{error}</p>
        </section>
      ) : null}

      {cartItems.length === 0 ? (
        <section className="page-empty-state">
          <p className="page-panel-kicker">Giỏ hàng trống</p>
          <h2>Bạn chưa có sản phẩm nào trong giỏ.</h2>
          <p>
            Hãy quay lại trang sản phẩm hoặc Build PC để chọn nhanh một cấu hình phù hợp.
          </p>

          <div className="page-actions">
            <Link to="/products" className="page-btn">
              Đi đến sản phẩm
            </Link>
            <Link to="/build-pc" className="page-btn-outline">
              Mở Build PC
            </Link>
          </div>
        </section>
      ) : (
        <section className="page-layout-2-1">
          <div className="page-stack">
            <section className="page-panel">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-kicker">Cart items</p>
                  <h2>Sản phẩm trong giỏ</h2>
                </div>
                <p>{totalItems} sản phẩm</p>
              </div>

              <div className="page-cart-list" style={{ marginTop: "12px" }}>
                {cartItems.map((item) => {
                  const specSummary = [item.specs?.cpu, item.specs?.ram, item.specs?.vga]
                    .filter(Boolean)
                    .join(" | ");

                  return (
                    <article key={item.id} className="page-cart-card">
                      <div className="page-cart-thumb">
                        <img src={item.image} alt={item.name} />
                      </div>

                      <div className="page-cart-content">
                        <div className="page-cart-head">
                          <div>
                            <h3>{item.name}</h3>
                            <p>{specSummary || "Thông số đang cập nhật."}</p>
                            <div className="page-pill-row" style={{ marginTop: "8px" }}>
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
                              Chi tiết
                            </Link>
                            <button
                              type="button"
                              className="page-ghost-btn"
                              onClick={() => removeItem(item.id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="page-stack">
            <section className="page-summary-card page-sticky">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-kicker">Order summary</p>
                  <h2>Tóm tắt đơn hàng</h2>
                </div>
              </div>

              <div className="page-summary-list" style={{ marginTop: "14px" }}>
                <div className="page-summary-line">
                  <p>Tạm tính</p>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="page-summary-line">
                  <p>Vận chuyển</p>
                  <span>{shippingFee === 0 ? "Miễn phí" : formatCurrency(shippingFee)}</span>
                </div>
                <div className="page-summary-line">
                  <p>Ưu đãi thành viên</p>
                  <span>- {formatCurrency(memberDiscount)}</span>
                </div>
              </div>

              <div className="page-summary-total">
                <p>Tổng thanh toán</p>
                <strong>{formatCurrency(total)}</strong>
                <span>Miễn phí vận chuyển cho đơn từ 30.000.000 VND.</span>
              </div>

              <div className="page-actions" style={{ marginTop: "14px" }}>
                <Link to="/checkout" className="page-btn">
                  Tiến hành thanh toán
                </Link>
                <Link to="/products" className="page-btn-outline">
                  Mua thêm
                </Link>
                <button type="button" className="page-btn-outline" onClick={clearCart}>
                  Xóa giỏ hàng
                </button>
              </div>
            </section>
          </div>
        </section>
      )}
    </div>
  );
}
