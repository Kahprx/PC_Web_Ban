const express = require('express');
const path = require('path');
const upload = require('../middlewares/uploadMiddleware');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload product image (admin)
 *     tags: [Upload]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Upload success
 *       400:
 *         description: Invalid file
 */
router.post('/image', requireAuth, requireRole('admin'), upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'File ảnh là bắt buộc' });
    return;
  }

  const imageUrl = `/uploads/${path.basename(req.file.filename)}`;

  res.status(201).json({
    message: 'Upload thành công',
    data: {
      filename: req.file.filename,
      imageUrl,
    },
  });
});

module.exports = router;
