import { apiRequest } from "./apiClient";

const GUEST_CART_KEY = "pc_store_guest_cart";
const CART_UPDATED_EVENT = "pc-store:cart-updated";

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readGuestCart = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

const emitCartUpdated = (openDrawer = false) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CART_UPDATED_EVENT, {
      detail: { openDrawer: Boolean(openDrawer) },
    })
  );
};

const normalizeGuestItem = (item) => ({
  id: item.id,
  product_id: toSafeNumber(item.product_id, 0),
  quantity: Math.max(1, toSafeNumber(item.quantity, 1)),
  product_name: String(item.product_name || "San pham"),
  price: Math.max(0, toSafeNumber(item.price, 0)),
  image_url: String(item.image_url || ""),
  stock_qty: Math.max(0, toSafeNumber(item.stock_qty, 999)),
  line_total: Math.max(0, toSafeNumber(item.price, 0)) * Math.max(1, toSafeNumber(item.quantity, 1)),
});

const mapGuestCart = (items) => items.map(normalizeGuestItem);

/**
 * Lay danh sach san pham trong gio hang
 * GET /api/cart (token) | localStorage (guest)
 */
export async function fetchCart(token) {
  if (!token) {
    return mapGuestCart(readGuestCart());
  }

  const result = await apiRequest("/api/cart", {
    method: "GET",
    token,
  });
  return result?.data || [];
}

/**
 * Them san pham vao gio hang
 * POST /api/cart/add (token) | localStorage (guest)
 */
export async function addToCartApi(
  { productId, quantity = 1, guestProduct = null },
  token
) {
  if (token) {
    const result = await apiRequest("/api/cart/add", {
      method: "POST",
      token,
      body: { productId, quantity },
    });
    emitCartUpdated(true);
    return result?.data || null;
  }

  const safeProductId = toSafeNumber(productId, 0);
  const safeQty = Math.max(1, toSafeNumber(quantity, 1));

  if (!safeProductId) {
    throw new Error("productId la bat buoc");
  }

  const items = readGuestCart();
  const idx = items.findIndex(
    (item) => toSafeNumber(item.product_id, 0) === safeProductId
  );

  if (idx >= 0) {
    const nextQty = Math.max(1, toSafeNumber(items[idx].quantity, 1) + safeQty);
    items[idx] = normalizeGuestItem({
      ...items[idx],
      quantity: nextQty,
    });
    writeGuestCart(items);
    emitCartUpdated(true);
    return items[idx];
  }

  const created = normalizeGuestItem({
    id: `guest-${safeProductId}`,
    product_id: safeProductId,
    quantity: safeQty,
    product_name: guestProduct?.name || `San pham #${safeProductId}`,
    price: toSafeNumber(guestProduct?.price, 0),
    image_url: guestProduct?.image_url || guestProduct?.image || "",
    stock_qty: 999,
  });

  const nextItems = [created, ...items];
  writeGuestCart(nextItems);
  emitCartUpdated(true);
  return created;
}

/**
 * Cap nhat so luong san pham trong gio
 * PUT /api/cart/:id (token) | localStorage (guest)
 */
export async function updateCartItemApi({ cartItemId, quantity }, token) {
  if (token) {
    const result = await apiRequest(`/api/cart/${cartItemId}`, {
      method: "PUT",
      token,
      body: { quantity },
    });
    emitCartUpdated(false);
    return result?.data || null;
  }

  const safeQty = Math.max(1, toSafeNumber(quantity, 1));
  const items = readGuestCart();
  const idx = items.findIndex((item) => String(item.id) === String(cartItemId));

  if (idx < 0) {
    throw new Error("Khong tim thay san pham trong gio");
  }

  items[idx] = normalizeGuestItem({
    ...items[idx],
    quantity: safeQty,
  });
  writeGuestCart(items);
  emitCartUpdated(false);
  return items[idx];
}

/**
 * Xoa san pham khoi gio
 * DELETE /api/cart/:id (token) | localStorage (guest)
 */
export async function removeCartItemApi(cartItemId, token) {
  if (token) {
    const result = await apiRequest(`/api/cart/${cartItemId}`, {
      method: "DELETE",
      token,
    });
    emitCartUpdated(false);
    return result || null;
  }

  const items = readGuestCart();
  const filtered = items.filter((item) => String(item.id) !== String(cartItemId));
  writeGuestCart(filtered);
  emitCartUpdated(false);
  return { id: cartItemId };
}

/**
 * Xoa toan bo gio hang
 * DELETE /api/cart (token) | localStorage (guest)
 */
export async function clearCartApi(token) {
  if (token) {
    const result = await apiRequest("/api/cart", {
      method: "DELETE",
      token,
    });
    emitCartUpdated(false);
    return result || null;
  }

  writeGuestCart([]);
  emitCartUpdated(false);
  return { message: "Guest cart cleared" };
}
