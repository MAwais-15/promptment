const express = require('express')
const router  = express.Router()
const { protect } = require('../middleware/auth')
const upload  = require('../middleware/upload')
const User    = require('../models/User')
const { Review } = require('../models/Notification')
const asyncHandler = require('../middleware/async');

// GET /api/users/:id/public
router.get('/:id/public', asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) return next(new AppError('User not found.', 404))
  res.json({ success: true, user: user.toPublicJSON() })
}))

// PUT /api/users/profile
router.put('/profile', protect, upload.single('avatar'), asyncHandler(async (req, res) => {
  const { name, bio, skills, city, university, availability } = req.body
  const updates = {}
  if (name)         updates.name         = name
  if (bio)          updates.bio          = bio
  if (skills)       updates.skills       = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())
  if (city)         updates.city         = city
  if (university)   updates.university   = university
  if (availability !== undefined) updates.availability = availability === 'true'

  if (req.file) {
    updates.avatar = { url: req.file.path, publicId: req.file.filename }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
  res.json({ success: true, user: user.toPublicJSON() })
}))

// POST /api/users/:id/reviews
router.post('/:id/reviews', protect, asyncHandler(async (req, res, next) => {
  const { assignmentId, rating, comment } = req.body
  const reviewee = await User.findById(req.params.id)
  if (!reviewee) return next(new AppError('User not found.', 404))

  const existing = await Review.findOne({ assignment: assignmentId })
  if (existing) return next(new AppError('You already reviewed this assignment.', 400))

  const review = await Review.create({
    assignment: assignmentId,
    reviewer:   req.user._id,
    reviewee:   req.params.id,
    rating,
    comment,
  })

  reviewee.updateRating(rating)
  await reviewee.save()

  res.status(201).json({ success: true, review })
}))

// GET /api/users/:id/reviews
router.get('/:id/reviews', asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.id })
    .populate('reviewer', 'name avatar')
    .populate('assignment', 'title')
    .sort('-createdAt')
    .limit(20)
  res.json({ success: true, reviews })
}))

module.exports = router
