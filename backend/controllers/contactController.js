const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { sendMail } = require("../utils/mailer");

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());

const submitContact = asyncHandler(async (req, res) => {
  const safeName = String(req.body?.fullName || "").trim();
  const safeEmail = String(req.body?.email || "").trim().toLowerCase();
  const safePhone = String(req.body?.phone || "").trim();
  const safeSubject = String(req.body?.subject || "Liên hệ từ website").trim();
  const safeMessage = String(req.body?.message || "").trim();

  if (!safeName) {
    throw httpError(400, "Vui lòng nhập họ và tên");
  }
  if (!safeEmail || !isValidEmail(safeEmail)) {
    throw httpError(400, "Email không hợp lệ");
  }
  if (!safeMessage || safeMessage.length < 10) {
    throw httpError(400, "Nội dung liên hệ cần ít nhất 10 ký tự");
  }

  const ticketCode = `LH-${Date.now()}`;
  const supportMailbox = String(process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || "support@kahgaming.vn");

  const plainTextLines = [
    `Mã liên hệ: ${ticketCode}`,
    `Họ tên: ${safeName}`,
    `Email: ${safeEmail}`,
    `Số điện thoại: ${safePhone || "-"}`,
    `Chủ đề: ${safeSubject}`,
    `Nội dung: ${safeMessage}`,
  ];

  const html = `
    <div style="font-family: Arial, sans-serif; color: #222; line-height: 1.55;">
      <h2 style="margin: 0 0 10px;">Yêu cầu liên hệ mới</h2>
      <p><strong>Mã liên hệ:</strong> ${ticketCode}</p>
      <p><strong>Họ tên:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Số điện thoại:</strong> ${safePhone || "-"}</p>
      <p><strong>Chủ đề:</strong> ${safeSubject}</p>
      <p><strong>Nội dung:</strong></p>
      <p style="white-space: pre-line;">${safeMessage}</p>
    </div>
  `;

  try {
    await sendMail({
      to: supportMailbox,
      subject: `[${ticketCode}] ${safeSubject}`,
      text: plainTextLines.join("\n"),
      html,
    });
  } catch (error) {
    console.error("Failed to send contact email:", error);
  }

  res.status(200).json({
    message: "Đã ghi nhận liên hệ. Đội ngũ sẽ phản hồi sớm.",
    data: {
      ticketCode,
      receivedAt: new Date().toISOString(),
      email: safeEmail,
    },
  });
});

module.exports = {
  submitContact,
};
