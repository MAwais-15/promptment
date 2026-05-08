const express  = require('express')
const router   = express.Router()
const { protect } = require('../middleware/auth')
const upload   = require('../middleware/upload')
const asyncHandler = require('../middleware/async');
const { AppError } = require('../middleware/errorHandler');
const cloudinary = require('../middleware/upload').cloudinary

// ─── POST /api/uploads/avatar ─────────────────────────────
router.post('/avatar',
  protect,
  upload.single('avatar'),
  asyncHandler(async (req, res, next) => {
    if (!req.file) return next(new AppError('No file uploaded.', 400))
    res.json({
      success: true,
      url:      req.file.path,
      publicId: req.file.filename,
    })
  })
)

// ─── POST /api/uploads/files ──────────────────────────────
router.post('/files',
  protect,
  upload.array('files', 5),
  asyncHandler(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return next(new AppError('No files uploaded.', 400))
    }
    const files = req.files.map(f => ({
      name:     f.originalname,
      url:      f.path,
      publicId: f.filename,
      size:     f.size,
      mimeType: f.mimetype,
    }))
    res.json({ success: true, files })
  })
)

// ─── DELETE /api/uploads/:publicId ────────────────────────
router.delete('/:publicId',
  protect,
  asyncHandler(async (req, res, next) => {
    const { publicId } = req.params
    await cloudinary.uploader.destroy(publicId)
    res.json({ success: true, message: 'File deleted.' })
  })
)

module.exports = router
