const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const {
  createSessionIfMissing,
  listMessagesBySession,
  listChatSessionsForAdmin,
  createMessage,
} = require("../models/supportChatModel");

const normalizeText = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

const sanitizeSessionId = (value = "") =>
  String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);

const buildBotReply = (content = "") => {
  const text = normalizeText(content);

  if (!text) {
    return "KAH xin chao. Ban can tu van build PC hay ho tro don hang?";
  }
  if (/(build|cau hinh|pc gaming|linh kien|cpu|vga|ram|ssd|hdd|nguon|mainboard)/.test(text)) {
    return "Minh da ghi nhan nhu cau build PC. Ban gui them tam gia va muc dich (gaming/do hoa/stream) de minh de xuat nhanh.";
  }
  if (/(bao hanh|warranty|ma don|don hang|status|trang thai)/.test(text)) {
    return "Voi van de bao hanh/don hang, ban vui long gui ma don. He thong se doi chieu va phan hoi trong khung gio ho tro.";
  }
  if (/(gia|khuyen mai|giam gia|tra gop|0%|thanh toan)/.test(text)) {
    return "Ban co the dat hang voi COD, chuyen khoan, Vi MoMo hoac tra gop 0%. Neu can, minh gui goi toi uu theo ngan sach ngay.";
  }
  if (/(giao hang|ship|van chuyen|bao lau|bao gio)/.test(text)) {
    return "KAH ho tro giao nhanh noi thanh. Ban de lai khu vuc giao hang de minh tinh thoi gian chinh xac.";
  }
  return "KAH da nhan tin nhan cua ban. Nhan vien se tiep nhan va phan hoi som, ban co the gui them thong tin chi tiet neu can.";
};

const createSession = asyncHandler(async (req, res) => {
  const rawSessionId = req.body?.sessionId || "";
  let sessionId = sanitizeSessionId(rawSessionId);

  if (!sessionId) {
    const random = crypto.randomBytes(8).toString("hex");
    sessionId = `sc-${Date.now()}-${random}`;
  }

  await createSessionIfMissing(sessionId);

  res.status(201).json({
    message: "Tao phien chat thanh cong",
    data: { sessionId },
  });
});

const getMessages = asyncHandler(async (req, res) => {
  const sessionId = sanitizeSessionId(req.params.sessionId || "");
  if (!sessionId) {
    throw httpError(400, "sessionId khong hop le");
  }

  await createSessionIfMissing(sessionId);
  const items = await listMessagesBySession(sessionId);

  res.status(200).json({
    data: items,
  });
});

const sendMessage = asyncHandler(async (req, res) => {
  const sessionId = sanitizeSessionId(req.body?.sessionId || "");
  const message = String(req.body?.message || "").trim();
  const userName = String(req.body?.name || "").trim();
  const userEmail = String(req.body?.email || "").trim().toLowerCase();

  if (!sessionId) {
    throw httpError(400, "sessionId khong hop le");
  }
  if (!message) {
    throw httpError(400, "Noi dung tin nhan la bat buoc");
  }
  if (userEmail && !isValidEmail(userEmail)) {
    throw httpError(400, "Email khong hop le");
  }

  await createSessionIfMissing(sessionId);

  const userMessage = await createMessage({
    sessionId,
    role: "user",
    userName: userName || null,
    userEmail: userEmail || null,
    message,
  });

  const botMessage = await createMessage({
    sessionId,
    role: "bot",
    message: buildBotReply(message),
  });

  res.status(201).json({
    message: "Gui tin nhan thanh cong",
    data: {
      userMessage,
      botMessage,
    },
  });
});

const getAdminSessions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(Number(req.query.limit || 20), 100));
  const search = String(req.query.search || "").trim();

  const result = await listChatSessionsForAdmin({ page, limit, search });

  res.status(200).json({
    data: result.items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    },
  });
});

const getAdminSessionMessages = asyncHandler(async (req, res) => {
  const sessionId = sanitizeSessionId(req.params.sessionId || "");
  if (!sessionId) {
    throw httpError(400, "sessionId khong hop le");
  }

  await createSessionIfMissing(sessionId);
  const items = await listMessagesBySession(sessionId, 300);

  res.status(200).json({ data: items });
});

const sendAdminMessage = asyncHandler(async (req, res) => {
  const sessionId = sanitizeSessionId(req.body?.sessionId || "");
  const message = String(req.body?.message || "").trim();

  if (!sessionId) {
    throw httpError(400, "sessionId khong hop le");
  }

  if (!message) {
    throw httpError(400, "Noi dung tin nhan la bat buoc");
  }

  await createSessionIfMissing(sessionId);

  const adminName =
    String(req.user?.fullName || req.user?.full_name || req.user?.email || "Admin").trim() || "Admin";
  const adminEmail = String(req.user?.email || "").trim().toLowerCase() || null;

  const adminMessage = await createMessage({
    sessionId,
    role: "admin",
    userName: adminName,
    userEmail: adminEmail,
    message,
  });

  res.status(201).json({
    message: "Admin da gui tin nhan thanh cong",
    data: adminMessage,
  });
});

module.exports = {
  createSession,
  getMessages,
  sendMessage,
  getAdminSessions,
  getAdminSessionMessages,
  sendAdminMessage,
};
