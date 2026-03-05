const express = require('express');
const { getOverview } = require('../controllers/statsController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/overview', requireAuth, requireRole('admin'), getOverview);

module.exports = router;
