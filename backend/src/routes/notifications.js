// ─── notifications.js ────────────────────────────────────
const express = require('express')
const router  = express.Router()
const { protect } = require('../middleware/auth')
const { Notification } = require('../models/Notification')
const asyncHandler = require('../middleware/async');
const { AppError } = require('../middleware/errorHandler');

router.get('/', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Notification.countDocuments({ recipient: req.user._id })
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort('-createdAt').skip(skip).limit(Number(limit))
  res.json({ success: true, total, notifications })
}))

router.get('/unread-count', protect, asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ recipient: req.user._id, read: false })
  res.json({ success: true, count })
}))

router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { read: true, readAt: new Date() }
  )
  res.json({ success: true })
}))

router.put('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true, readAt: new Date() })
  res.json({ success: true })
}))

module.exports = router
