const nodemailer = require("nodemailer");

const normalizeSecret = (value = "") =>
  String(value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\s+/g, "");

const extractEmailAddress = (value = "") => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const bracketMatch = raw.match(/<([^>]+)>/);
  if (bracketMatch?.[1]) {
    return String(bracketMatch[1]).trim();
  }
  return raw;
};

const EMAIL_HOST = String(process.env.EMAIL_HOST || "").trim();
const EMAIL_SERVICE =
  String(process.env.EMAIL_SERVICE || "").trim().toLowerCase() ||
  (EMAIL_HOST.toLowerCase().includes("gmail") ? "gmail" : "");
const EMAIL_PORT = Number(process.env.EMAIL_PORT || 587);
const EMAIL_SECURE = String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true";
const EMAIL_USER = extractEmailAddress(process.env.EMAIL_USER || "");
const EMAIL_PASS = normalizeSecret(process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD || "");
const EMAIL_FROM = String(process.env.EMAIL_FROM || EMAIL_USER || "no-reply@pc-store.local").trim();

let transporter;
let verifyPromise = null;

if ((EMAIL_SERVICE || EMAIL_HOST) && EMAIL_USER && EMAIL_PASS) {
  const transportConfig = EMAIL_SERVICE
    ? { service: EMAIL_SERVICE }
    : {
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_SECURE,
      };

  transporter = nodemailer.createTransport({
    ...transportConfig,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT || 15000),
    greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT || 15000),
    socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT || 20000),
  });
}

const ensureMailerConfigured = () => {
  if (!transporter) {
    throw new Error(
      "Email service chua duoc cau hinh day du. Can EMAIL_USER + EMAIL_PASS va EMAIL_SERVICE hoac EMAIL_HOST."
    );
  }
};

const ensureMailerReady = async () => {
  ensureMailerConfigured();

  if (!verifyPromise) {
    verifyPromise = transporter.verify().catch((error) => {
      verifyPromise = null;
      throw error;
    });
  }

  await verifyPromise;
};

const buildMailHtml = ({ title, body, actionText, actionUrl }) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.5;">
      <h2 style="margin-top: 0;">${title}</h2>
      <p>${body}</p>
      ${
        actionText && actionUrl
          ? `<p><a href="${actionUrl}" style="display: inline-block; padding: 10px 18px; background: #2f5fff; color: #fff; text-decoration: none; border-radius: 6px;">${actionText}</a></p>`
          : ""
      }
      <p style="color:#666; font-size:0.95rem;">Nếu bạn không yêu cầu thay đổi mật khẩu, bạn có thể bỏ qua email này.</p>
    </div>
  `;
};

const sendMail = async ({ to, subject, text, html }) => {
  await ensureMailerReady();

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};

const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const subject = "Yêu cầu đặt lại mật khẩu";
  const text = `Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu. Mở liên kết sau để thiết lập lại: ${resetUrl}`;
  const html = buildMailHtml({
    title: "Đặt lại mật khẩu PC Store",
    body: "Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.",
    actionText: "Đặt lại mật khẩu ngay",
    actionUrl: resetUrl,
  });

  await sendMail({ to, subject, text, html });
};

module.exports = {
  sendMail,
  sendPasswordResetEmail,
};
