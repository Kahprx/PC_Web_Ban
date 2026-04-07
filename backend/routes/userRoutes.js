const express = require('express');
const {
  register,
  login,
  profile,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyResetPasswordToken,
  resetPassword,
} = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password]
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Register success
 *       400:
 *         description: Validation error
 */
router.post('/register', register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login success
 *       401:
 *         description: Unauthorized
 */
router.post('/login', login);
router.get('/forgot-password', forgotPassword);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', verifyResetPasswordToken);
router.post('/reset-password', resetPassword);

router.get('/me', requireAuth, profile);
router.put('/me', requireAuth, updateProfile);
router.put('/change-password', requireAuth, changePassword);

module.exports = router;
