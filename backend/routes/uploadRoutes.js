const express = require('express');
const path = require('path');
const upload = require('../middlewares/uploadMiddleware');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

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
