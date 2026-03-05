const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/jwt');
const { findUserById } = require('../models/userModel');

const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.slice(7);
  const decoded = verifyToken(token);

  const user = await findUserById(decoded.id);

  if (!user || !user.is_active) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  next();
});

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    return next(error);
  }

  return next();
};

module.exports = {
  requireAuth,
  requireRole,
};
