import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchMyOrderById } from "../../services/orderService";
import { confirmOrderPaymentDemo, fetchOrderPaymentStatus } from "../../services/paymentService";
import { toAbsoluteImageUrl } from "../../services/productService";
import { formatVnd } from "../../utils/currency";
import { notifyError, notifySuccess } from "../../utils/notify";
import { toPaymentMethodLabel } from "../../utils/payment";
import "../shared/PageBlocks.css";

const MOMO_QR_IMAGE_PATH = "/payment-qr/momo-qr.png";
const BANK_QR_IMAGE_PATH = "/payment-qr/bank-qr.png";
const BANK_ACCOUNT_NAME = "QUACH MANH KHA";
const BANK_ACCOUNT_NO = "0001165164898";
const DEFAULT_PRODUCT_IMAGE = "/vite.svg";
const ONLINE_METHODS = new Set(["momo", "banking", "card", "installment"]);
const SUCCESS_PAYMENT_STATUS = new Set(["paid", "success", "completed", "succeeded", "ok", "00", "0"]);
const SUCCESS_ORDER_STATUS = new Set(["processing", "shipping", "completed"]);

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const normalizeOrderItem = (item, index) => {
  const quantity = Math.max(1, toSafeNumber(item?.quantity ?? item?.qty ?? 1, 1));
  const unitPrice = toSafeNumber(item?.unit_price ?? item?.unitPrice ?? item?.price, 0);
  const lineTotalRaw = toSafeNumber(item?.line_total ?? item?.lineTotal, NaN);
  const lineTotal = Number.isFinite(lineTotalRaw) ? lineTotalRaw : unitPrice * quantity;
  const name = String(item?.product_name ?? item?.name ?? `Sản phẩm #${index + 1}`).trim() || `Sản phẩm #${index + 1}`;
  const imageRaw = item?.image_url || item?.image || item?.thumbnail || item?.product?.image_url || item?.product?.image || "";
  const image = toAbsoluteImageUrl(String(imageRaw).trim()) || DEFAULT_PRODUCT_IMAGE;

  return {
    id: item?.id ?? `${item?.product_id ?? item?.productId ?? "item"}-${index + 1}`,
    name,
    quantity,
    lineTotal,
    image,
  };
};

const parseShippingAddress = (rawAddress = "") => {
  const raw = String(rawAddress || "").trim();
  if (!raw) {
    return { fullName: "-", phone: "-", address: "-" };
  }

  const parts = raw.split(" - ").map((item) => item.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return {
      fullName: parts[0],
      phone: parts[1],
      address: parts.slice(2).join(" - "),
    };
  }

  return {
    fullName: "-",
    phone: "-",
    address: raw,
  };
};

export default function Confirm() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();

  const [order, setOrder] = useState(location.state?.order || null);
  const [paymentSnapshot, setPaymentSnapshot] = useState(null);
  const [momoImageMissing, setMomoImageMissing] = useState(false);
  const [bankImageMissing, setBankImageMissing] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [confirmingDemo, setConfirmingDemo] = useState(false);

  const orderIdFromQuery = String(searchParams.get("orderId") || "").trim();
  const resolvedOrderId = String(order?.id ?? orderIdFromQuery ?? "").trim();
  const numericOrderId = Number(resolvedOrderId);
  const hasApiOrderId = Number.isFinite(numericOrderId) && numericOrderId > 0;

  const paymentMethod = normalizeText(order?.payment_method || paymentSnapshot?.paymentMethod || "cod");
  const isOnlinePayment = ONLINE_METHODS.has(paymentMethod);
  const isMomo = paymentMethod === "momo";
  const isBankTransfer = ["banking", "card", "installment"].includes(paymentMethod);

  const paymentStatus = normalizeText(paymentSnapshot?.paymentStatus || order?.payment_status || "pending");
  const orderStatus = normalizeText(paymentSnapshot?.orderStatus || order?.status || "pending");
  const isPaymentConfirmed =
    !isOnlinePayment || SUCCESS_PAYMENT_STATUS.has(paymentStatus) || SUCCESS_ORDER_STATUS.has(orderStatus);

  const orderCode = useMemo(() => {
    if (!resolvedOrderId) return "ORDER-N/A";
    if (String(resolvedOrderId).startsWith("ORDER-")) return String(resolvedOrderId);
    return `ORDER-${resolvedOrderId}`;
  }, [resolvedOrderId]);

  const total = toSafeNumber(order?.total_amount ?? order?.total, 0);
  const shippingInfo = useMemo(() => parseShippingAddress(order?.shipping_address), [order?.shipping_address]);

  const items = useMemo(
    () => (Array.isArray(order?.items) ? order.items : []).map((item, index) => normalizeOrderItem(item, index)),
    [order?.items]
  );

  const momoCode = useMemo(() => {
    const rawId = String(resolvedOrderId).replace(/[^a-z0-9]/gi, "").toUpperCase().slice(-10) || "NA";
    return `MOMO-${rawId}-${Math.round(total)}`;
  }, [resolvedOrderId, total]);

  const fallbackMomoQrUrl = useMemo(() => {
    const payload = `KAHGAMING|${momoCode}|${Math.round(total)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payload)}`;
  }, [momoCode, total]);

  const bankCode = useMemo(() => {
    const rawId = String(resolvedOrderId).replace(/[^a-z0-9]/gi, "").toUpperCase().slice(-10) || "NA";
    return `BANK-${rawId}-${Math.round(total)}`;
  }, [resolvedOrderId, total]);

  const fallbackBankQrUrl = useMemo(() => {
    const amount = Math.max(0, Math.round(total));
    const addInfo = encodeURIComponent(`${bankCode} ${orderCode}`);
    const accountName = encodeURIComponent(BANK_ACCOUNT_NAME);
    return `https://img.vietqr.io/image/MB-${BANK_ACCOUNT_NO}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
  }, [bankCode, orderCode, total]);

  const momoQrSrc = momoImageMissing ? fallbackMomoQrUrl : MOMO_QR_IMAGE_PATH;
  const bankQrSrc = bankImageMissing ? fallbackBankQrUrl : BANK_QR_IMAGE_PATH;

  const syncFromApi = useCallback(async () => {
    if (!hasApiOrderId) return;

    try {
      setLoadingSync(true);

      const [paymentRes, orderRes] = await Promise.all([
        fetchOrderPaymentStatus(numericOrderId, token),
        token ? fetchMyOrderById(numericOrderId, token) : Promise.resolve(null),
      ]);

      if (paymentRes?.data) {
        setPaymentSnapshot(paymentRes.data);
        if (paymentRes.data.order) {
          setOrder(paymentRes.data.order);
        }
      }

      if (orderRes?.data) {
        setOrder(orderRes.data);
      }
    } catch (error) {
      notifyError(error, "Không đồng bộ được trạng thái thanh toán");
    } finally {
      setLoadingSync(false);
    }
  }, [hasApiOrderId, numericOrderId, token]);

  const handleConfirmDemo = useCallback(async () => {
    if (!hasApiOrderId || !token) return;

    try {
      setConfirmingDemo(true);
      await confirmOrderPaymentDemo(numericOrderId, paymentMethod, token);
      await syncFromApi();
      notifySuccess("Đã nhận callback thanh toán (demo)");
    } catch (error) {
      notifyError(error, "Không thể xác nhận thanh toán demo");
    } finally {
      setConfirmingDemo(false);
    }
  }, [hasApiOrderId, numericOrderId, paymentMethod, syncFromApi, token]);

  useEffect(() => {
    if (!hasApiOrderId) return;
    syncFromApi();
  }, [hasApiOrderId, syncFromApi]);

  useEffect(() => {
    if (!hasApiOrderId || !isOnlinePayment || isPaymentConfirmed) return undefined;

    const interval = window.setInterval(() => {
      syncFromApi();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [hasApiOrderId, isOnlinePayment, isPaymentConfirmed, syncFromApi]);

  useEffect(() => {
    if (isOnlinePayment && isPaymentConfirmed) {
      notifySuccess("Ngân hàng đã xác nhận thanh toán thành công");
    }
  }, [isOnlinePayment, isPaymentConfirmed]);

  const headingTitle = isPaymentConfirmed
    ? "Đơn hàng đã được xác nhận thành công."
    : "Đơn hàng đã tạo, đang chờ xác nhận thanh toán.";
  const headingSubtitle = isPaymentConfirmed
    ? "Đơn của bạn đã được hệ thống xác nhận. Bạn có thể theo dõi chi tiết giao hàng bên dưới."
    : "Form sẽ tự chuyển trạng thái ngay khi backend nhận callback xác nhận từ ngân hàng/ví điện tử.";

  return (
    <div className="page-shell">
      <section className="page-hero-card">
        <div className="page-hero-copy">
          <p className="page-eyebrow">Order Placed</p>
          <h1 className="page-title">{headingTitle}</h1>
          <p className="page-subtitle">{headingSubtitle}</p>

          <div className="page-hero-actions">
            <span className="page-inline-code">{orderCode}</span>
            <Link to="/orders" className="page-btn">
              Xem lịch sử đơn hàng
            </Link>
            <Link to="/products" className="page-btn-outline">
              Tiếp tục mua hàng
            </Link>
            {isOnlinePayment && !isPaymentConfirmed ? (
              <button type="button" className="page-btn-outline" onClick={syncFromApi} disabled={loadingSync}>
                {loadingSync ? "Đang kiểm tra..." : "Kiểm tra thanh toán"}
              </button>
            ) : null}
            {isOnlinePayment && !isPaymentConfirmed && token ? (
              <button type="button" className="page-btn-outline" onClick={handleConfirmDemo} disabled={confirmingDemo}>
                {confirmingDemo ? "Đang xác nhận..." : "Tôi đã chuyển khoản (demo)"}
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="page-layout-2-1">
        <div className="page-stack">
          {isMomo && !isPaymentConfirmed ? (
            <section className="page-panel">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-kicker">MoMo Payment</p>
                  <h2>Mã thanh toán MoMo</h2>
                </div>
              </div>

              <div className="page-payment-cta" style={{ marginTop: "14px" }}>
                <div className="page-payment-qr">
                  <img
                    src={momoQrSrc}
                    alt="MoMo QR"
                    onError={() => {
                      if (!momoImageMissing) setMomoImageMissing(true);
                    }}
                  />
                </div>

                <div className="page-payment-note">
                  <p>Mã thanh toán</p>
                  <strong className="page-payment-code">{momoCode}</strong>
                  <span>Tài khoản: QUACH MANH KHA - ******764</span>
                  <span>Số tiền: {formatVnd(total)}</span>
                  <span>Nội dung: {orderCode}</span>
                </div>
              </div>
            </section>
          ) : null}

          {isBankTransfer && !isPaymentConfirmed ? (
            <section className="page-panel">
              <div className="page-panel-header">
                <div>
                  <p className="page-panel-kicker">Bank Transfer</p>
                  <h2>Mã QR ngân hàng</h2>
                </div>
              </div>

              <div className="page-payment-cta" style={{ marginTop: "14px" }}>
                <div className="page-payment-qr">
                  <img
                    src={bankQrSrc}
                    alt="Bank QR"
                    onError={() => {
                      if (!bankImageMissing) setBankImageMissing(true);
                    }}
                  />
                </div>

                <div className="page-payment-note">
                  <p>Thông tin chuyển khoản</p>
                  <strong className="page-payment-code">{bankCode}</strong>
                  <span>Ngân hàng: MB Bank</span>
                  <span>Chủ tài khoản: {BANK_ACCOUNT_NAME}</span>
                  <span>Số tài khoản: {BANK_ACCOUNT_NO}</span>
                  <span>Số tiền: {formatVnd(total)}</span>
                  <span>Nội dung: {orderCode}</span>
                </div>
              </div>
            </section>
          ) : null}

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Order Snapshot</p>
                <h2>Thông tin đơn hàng</h2>
              </div>
            </div>

            <div className="page-meta-grid" style={{ marginTop: "14px" }}>
              <article className="page-meta-card">
                <p>Mã đơn</p>
                <strong>{orderCode}</strong>
              </article>
              <article className="page-meta-card">
                <p>Tổng thanh toán</p>
                <strong>{formatVnd(total)}</strong>
              </article>
              <article className="page-meta-card">
                <p>Thanh toán</p>
                <strong>{toPaymentMethodLabel(paymentMethod)}</strong>
              </article>
              <article className="page-meta-card">
                <p>Trạng thái</p>
                <strong>{isPaymentConfirmed ? "Đã xác nhận" : "Chờ xác nhận thanh toán"}</strong>
              </article>
            </div>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Delivery Snapshot</p>
                <h2>Chi tiết đơn giao</h2>
              </div>
            </div>

            <div className="page-checklist" style={{ marginTop: "14px" }}>
              <div className="page-checklist-row">
                <p>Người nhận</p>
                <span>{shippingInfo.fullName}</span>
              </div>
              <div className="page-checklist-row">
                <p>Số điện thoại</p>
                <span>{shippingInfo.phone}</span>
              </div>
              <div className="page-checklist-row">
                <p>Địa chỉ giao</p>
                <span>{shippingInfo.address}</span>
              </div>
              <div className="page-checklist-row">
                <p>Tình trạng giao</p>
                <span>{isPaymentConfirmed ? "Đã xác nhận, chuẩn bị giao hàng" : "Đang chờ xác nhận thanh toán"}</span>
              </div>
            </div>
          </section>

          <section className="page-panel">
            <div className="page-panel-header">
              <div>
                <p className="page-panel-kicker">Items</p>
                <h2>Sản phẩm trong đơn</h2>
              </div>
            </div>

            <div className="page-item-list" style={{ marginTop: "14px" }}>
              {items.length === 0 ? <p>Không có sản phẩm để hiển thị.</p> : null}

              {items.map((item) => (
                <article key={item.id} className="page-item-row">
                  <div className="page-item-thumb">
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                  </div>

                  <div className="page-item-main">
                    <h3 title={item.name}>{item.name}</h3>
                    <p>Số lượng: {item.quantity}</p>
                  </div>

                  <div className="page-item-side">
                    <strong>{formatVnd(item.lineTotal)}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
