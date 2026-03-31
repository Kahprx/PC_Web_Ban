const asyncHandler = require('../utils/asyncHandler');

// Tạm dùng danh sách tĩnh để tránh phụ thuộc bảng DB chưa có
const samplePromotions = [
  {
    id: 1,
    title: 'Giảm 10% cho đơn PC trên 30 triệu',
    code: 'PC30',
    discountType: 'percent',
    value: 10,
    minOrder: 30_000_000,
    expiresAt: null,
  },
  {
    id: 2,
    title: 'Freeship nội thành',
    code: 'FREESHIP',
    discountType: 'shipping',
    value: 0,
    minOrder: 1_000_000,
    expiresAt: null,
  },
];

/**
 * GET /api/promotions
 * Trả về danh sách mã khuyến mãi demo
 */
const getPromotions = asyncHandler(async (_req, res) => {
  res.status(200).json({ data: samplePromotions });
});

module.exports = {
  getPromotions,
};
