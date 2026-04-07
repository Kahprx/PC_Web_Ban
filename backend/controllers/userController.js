const bcrypt = require("bcrypt");
const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const httpError = require("../utils/httpError");
const { signToken } = require("../utils/jwt");
const { sendPasswordResetEmail } = require("../utils/mailer");
const {
  createUser,
  findUserByEmail,
  findUserById,
  findUserWithPasswordById,
  updateUserProfile,
  updateUserPassword,
} = require("../models/userModel");
const {
  createPasswordResetToken,
  findValidPasswordResetToken,
  consumePasswordResetToken,
} = require("../models/passwordResetTokenModel");

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body || {};

  if (!fullName || !email || !password) {
    throw httpError(400, "fullName, email va password la bat buoc");
  }
  if (!isValidEmail(email)) {
    throw httpError(400, "Email khong hop le");
  }
  if (String(password).length < 6) {
    throw httpError(400, "Mat khau toi thieu 6 ky tu");
  }

  const existing = await findUserByEmail(String(email).toLowerCase().trim());
  if (existing) {
    throw httpError(400, "Email da ton tai");
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(String(password), rounds);

  const user = await createUser({
    fullName: String(fullName).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    role: "user",
  });

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    message: "Dang ky thanh cong",
    data: { user, token },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw httpError(400, "email va password la bat buoc");
  }

  const user = await findUserByEmail(String(email).toLowerCase().trim());
  if (!user || !user.is_active) {
    throw httpError(401, "Sai tai khoan hoac mat khau");
  }

  const matched = await bcrypt.compare(String(password), String(user.password_hash || ""));
  if (!matched) {
    throw httpError(401, "Sai tai khoan hoac mat khau");
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    message: "Dang nhap thanh cong",
    data: {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || null,
        birth_date: user.birth_date || null,
        default_shipping_address: user.default_shipping_address || null,
        delivery_note: user.delivery_note || null,
        role: user.role,
      },
      token,
    },
  });
});

const profile = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    throw httpError(404, "Khong tim thay nguoi dung");
  }

  res.status(200).json({ data: user });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, email, phone, birthDate, defaultShippingAddress, deliveryNote } = req.body || {};

  const safeName = String(fullName || "").trim();
  const safeEmail = String(email || "").trim().toLowerCase();
  const safePhone = String(phone || "").trim();
  const safeBirthDate = String(birthDate || "").trim();
  const safeAddress = String(defaultShippingAddress || "").trim();
  const safeNote = String(deliveryNote || "").trim();

  if (!safeName) {
    throw httpError(400, "Ho ten la bat buoc");
  }
  if (!safeEmail || !isValidEmail(safeEmail)) {
    throw httpError(400, "Email khong hop le");
  }
  if (safePhone && !/^(0|\+84)[0-9]{9,10}$/.test(safePhone)) {
    throw httpError(400, "So dien thoai khong hop le");
  }
  if (safeBirthDate && Number.isNaN(new Date(safeBirthDate).getTime())) {
    throw httpError(400, "Ngay sinh khong hop le");
  }

  const existed = await findUserByEmail(safeEmail);
  if (existed && Number(existed.id) !== Number(req.user.id)) {
    throw httpError(400, "Email da ton tai");
  }

  const updated = await updateUserProfile({
    id: req.user.id,
    fullName: safeName,
    email: safeEmail,
    phone: safePhone || null,
    birthDate: safeBirthDate || null,
    defaultShippingAddress: safeAddress || null,
    deliveryNote: safeNote || null,
  });

  if (!updated) {
    throw httpError(404, "Khong tim thay nguoi dung");
  }

  res.status(200).json({
    message: "Cap nhat ho so thanh cong",
    data: updated,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    throw httpError(400, "currentPassword va newPassword la bat buoc");
  }
  if (String(newPassword).length < 6) {
    throw httpError(400, "Mat khau moi toi thieu 6 ky tu");
  }

  const user = await findUserWithPasswordById(req.user.id);
  if (!user) {
    throw httpError(404, "Khong tim thay nguoi dung");
  }

  const matched = await bcrypt.compare(String(currentPassword), String(user.password_hash || ""));
  if (!matched) {
    throw httpError(400, "Mat khau hien tai khong dung");
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(String(newPassword), rounds);
  await updateUserPassword({ id: req.user.id, passwordHash });

  res.status(200).json({
    message: "Doi mat khau thanh cong",
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const rawEmail = req.body?.email ?? req.query?.email ?? "";
  const safeEmail = String(rawEmail).trim().toLowerCase();
  let previewResetUrl = null;

  if (safeEmail && !isValidEmail(safeEmail)) {
    throw httpError(400, "Email khong hop le");
  }

  if (safeEmail) {
    const user = await findUserByEmail(safeEmail);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

      await createPasswordResetToken({
        userId: user.id,
        token,
        expiresAt,
      });

      const frontendBaseUrl = String(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
      const resetUrl = `${frontendBaseUrl}/reset-password?token=${token}`;
      const isProduction = String(process.env.NODE_ENV || "").toLowerCase() === "production";

      if (!isProduction) {
        previewResetUrl = resetUrl;
      }

      try {
        await sendPasswordResetEmail({ to: user.email, resetUrl });
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        throw httpError(
          500,
          "Khong the gui email dat lai mat khau. Kiem tra EMAIL_USER dung tai khoan Gmail da tao app password, EMAIL_PASS, EMAIL_SERVICE/EMAIL_HOST va bat 2FA."
        );
      }
    }
  }

  res.status(200).json({
    message: "Neu email ton tai, he thong da gui link dat lai mat khau.",
    data: previewResetUrl ? { previewResetUrl } : null,
  });
});

const verifyResetPasswordToken = asyncHandler(async (req, res) => {
  const token = String(req.params.token || "").trim();
  if (!token) {
    throw httpError(400, "Token khong hop le");
  }

  const tokenRow = await findValidPasswordResetToken(token);
  if (!tokenRow) {
    throw httpError(404, "Token khong hop le hoac da het han");
  }

  res.status(200).json({ message: "Token hop le" });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  const safeToken = String(token || "").trim();
  const safePassword = String(password || "").trim();

  if (!safeToken || !safePassword) {
    throw httpError(400, "Token va password la bat buoc");
  }
  if (safePassword.length < 6) {
    throw httpError(400, "Mat khau moi toi thieu 6 ky tu");
  }

  const tokenRow = await findValidPasswordResetToken(safeToken);
  if (!tokenRow) {
    throw httpError(400, "Token khong hop le hoac da het han");
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(safePassword, rounds);
  await updateUserPassword({
    id: tokenRow.user_id,
    passwordHash,
  });

  await consumePasswordResetToken(safeToken);

  res.status(200).json({
    message: "Da dat lai mat khau thanh cong.",
  });
});

module.exports = {
  register,
  login,
  profile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetPasswordToken,
  resetPassword,
};
