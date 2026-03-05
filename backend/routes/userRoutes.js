const express = require('express');
const { register, login, profile } = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register user
 *     tags: [Users]
 */
router.post('/register', register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Users]
 */
router.post('/login', login);

router.get('/me', requireAuth, profile);

module.exports = router;
