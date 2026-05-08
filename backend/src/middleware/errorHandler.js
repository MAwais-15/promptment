const logger = require('../utils/logger')

// ─── Global Error Handler ─────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log
  logger.error(`${err.name}: ${err.message} | ${req.method} ${req.originalUrl}`)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = `Resource not found with id: ${err.value}`
    return res.status(404).json({ success: false, message: error.message })
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0]
    error.message = `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Field'} already exists.`
    return res.status(400).json({ success: false, message: error.message })
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const msgs = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ success: false, message: msgs.join('. ') })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.' })
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: `File too large. Max ${process.env.MAX_FILE_SIZE_MB || 20}MB.` })
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ success: false, message: 'Too many files. Max 5 files.' })
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, message: 'Unexpected file field.' })
  }

  const statusCode = error.statusCode || err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler

// ─── Async wrapper ────────────────────────────────────────
exports.asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// ─── Custom AppError ──────────────────────────────────────
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AppError'
    Error.captureStackTrace(this, this.constructor)
  }
}

exports.AppError = AppError
