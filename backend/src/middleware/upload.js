const multer     = require('multer')
const cloudinary = require('cloudinary').v2
const CloudinaryStorage = require('multer-storage-cloudinary')

// ─── Configure Cloudinary ────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ─── Cloudinary Storage ───────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith('image/')
    return {
      folder:        `promptment/${isImage ? 'images' : 'documents'}`,
      resource_type: isImage ? 'image' : 'raw',
      allowed_formats: ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'jpg', 'jpeg', 'png'],
      public_id:     `${Date.now()}-${file.originalname.replace(/\s/g, '_').replace(/[^\w.-]/g, '')}`,
      transformation: isImage ? [{ quality: 'auto', fetch_format: 'auto' }] : undefined,
    }
  },
})

// ─── File Filter ──────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false)
  }
}

// ─── Multer Instance ──────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize:  (parseInt(process.env.MAX_FILE_SIZE_MB) || 20) * 1024 * 1024,
    files:     5,
  },
})

module.exports = upload
module.exports.cloudinary = cloudinary
