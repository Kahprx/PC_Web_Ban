const express = require('express');
const { getOverview } = require('../controllers/statsController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/stats/overview:
 *   get:
 *     summary: Get order statistics overview
 *     tags: [Stats]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics
 *       401:
 *         description: Unauthorized
 */
router.get('/overview', requireAuth, requireRole('admin'), getOverview);

module.exports = router;
