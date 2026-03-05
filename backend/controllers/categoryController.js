const asyncHandler = require('../utils/asyncHandler');
const { listCategories } = require('../models/categoryModel');

const getCategories = asyncHandler(async (_req, res) => {
  const categories = await listCategories();
  res.status(200).json({ data: categories });
});

module.exports = {
  getCategories,
};
