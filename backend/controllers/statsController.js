  const asyncHandler = require('../utils/asyncHandler');
const { getOrderStatistics } = require('../models/orderModel');

const getOverview = asyncHandler(async (_req, res) => {
  const stats = await getOrderStatistics();

  res.status(200).json({
    data: stats,
  });
});

module.exports = {
  getOverview,
};
