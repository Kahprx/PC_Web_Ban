const bcrypt = require('bcrypt');
const asyncHandler = require('../utils/asyncHandler');
const httpError = require('../utils/httpError');
const { signToken } = require('../utils/jwt');
const { createUser, findUserByEmail, findUserById } = require('../models/userModel');

const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body || {};

  if (!fullName || !email || !password) {
    throw httpError(400, 'fullName, email và password là bắt buộc');
  }

  if (!isValidEmail(email)) {
    throw httpError(400, 'Email không hợp lệ');
  }

  if (String(password).length < 6) {
    throw httpError(400, 'Mật khẩu tối thiểu 6 ký tự');
  }

  const existing = await findUserByEmail(String(email).toLowerCase().trim());
  if (existing) {
    throw httpError(400, 'Email đã tồn tại');
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash(String(password), rounds);

  const user = await createUser({
    fullName: String(fullName).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    role: 'user',
  });

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    message: 'Register thành công',
    data: {
      user,
      token,
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw httpError(400, 'email và password là bắt buộc');
  }

  const user = await findUserByEmail(String(email).toLowerCase().trim());

  if (!user || !user.is_active) {
    throw httpError(401, 'Sai tài khoản hoặc mật khẩu');
  }

  const matched = await bcrypt.compare(String(password), user.password_hash);

  if (!matched) {
    throw httpError(401, 'Sai tài khoản hoặc mật khẩu');
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json({
    message: 'Đăng nhập thành công',
    data: {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
});

const profile = asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);

  if (!user) {
    throw httpError(404, 'Không tìm thấy user');
  }

  res.status(200).json({
    data: user,
  });
});

module.exports = {
  register,
  login,
  profile,
};
