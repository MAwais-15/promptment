const asyncHandler = require("express-async-handler");
const AppError = require('../utils/AppError');
const crypto = require('crypto')
const jwt    = require('jsonwebtoken')
const User   = require('../models/User')
const { sendEmail } = require('../utils/email')
const { logActivity } = require('../utils/activityLogger')

// â”€â”€â”€ Helper: send token response â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const sendTokenResponse = (user, statusCode, res) => {
  const token        = user.generateToken()
  const refreshToken = user.generateRefreshToken()

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: user.toPublicJSON(),
  })
}

// â”€â”€â”€ POST /api/auth/register â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, city, referralCode } = req.body

  // prevent admin self-registration and invalid roles
  if (role === 'admin') {
    return next(new AppError('Cannot register as admin.', 403))
  }
  if (role && !['student', 'executor'].includes(role)) {
    return next(new AppError('Invalid role specified.', 400))
  }

  const existing = await User.findOne({ email })
  if (existing) return next(new AppError('Email already registered.', 400))

  const userData = { name, email, password, role: role || 'student', city }

  // Handle referral
  if (referralCode) {
    const referrer = await User.findOne({ referralCode })
    if (referrer) {
      userData.referredBy = referrer._id
      // Bonus: add 100 PKR to referrer
      await User.findByIdAndUpdate(referrer._id, {
        $inc: { walletBalance: 100, referralCount: 1 },
      })
    }
  }

  const user = await User.create(userData)

  // Send welcome email (fire and forget)
  sendEmail({
    to:      user.email,
    subject: 'Welcome to Promptment!',
    template: 'welcome',
    data: { name: user.name },
  }).catch(() => {})

  await logActivity({
    actorName: user.name,
    actor:     user._id,
    action:    'User Registered',
    target:    user.email,
    type:      'success',
  })

  sendTokenResponse(user, 201, res)
})

// â”€â”€â”€ POST /api/auth/login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return next(new AppError('Please provide email and password.', 400))
  }

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid email or password.', 401))
  }

  if (user.banned) {
    return next(new AppError(`Account banned: ${user.banReason || 'Policy violation.'}`, 403))
  }

  await logActivity({
    actor:  user._id,
    actorName: user.name,
    action: 'User Login',
    target: user.email,
    type:   'info',
    ip:     req.ip,
  })

  sendTokenResponse(user, 200, res)
})

// â”€â”€â”€ GET /api/auth/me â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ success: true, user: user.toPublicJSON() })
})

// â”€â”€â”€ POST /api/auth/refresh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body
  if (!refreshToken) return next(new AppError('No refresh token provided.', 401))

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
    const user    = await User.findById(decoded.id)
    if (!user) return next(new AppError('User not found.', 401))
    sendTokenResponse(user, 200, res)
  } catch {
    return next(new AppError('Invalid or expired refresh token.', 401))
  }
})

// â”€â”€â”€ POST /api/auth/forgot-password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    // don't reveal existence
    return res.json({ success: true, message: 'If that email exists, a reset link was sent.' })
  }

  const resetToken = user.generatePasswordReset()
  await user.save({ validateBeforeSave: false })

  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`

  await sendEmail({
    to:      user.email,
    subject: 'Reset Your Promptment Password',
    template: 'resetPassword',
    data: { name: user.name, resetUrl, expiresIn: '10 minutes' },
  })

  res.json({ success: true, message: 'Password reset email sent.' })
})

// â”€â”€â”€ POST /api/auth/reset-password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body

  if (!token) {
    return next(new AppError('Reset token is required.', 400))
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex')
  const user   = await User.findOne({
    passwordResetToken:  hashed,
    passwordResetExpire: { $gt: Date.now() },
  })

  if (!user) return next(new AppError('Invalid or expired reset token.', 400))

  user.password            = password
  user.passwordResetToken  = undefined
  user.passwordResetExpire = undefined
  await user.save()

  await logActivity({
    actor:  user._id,
    action: 'Password Reset',
    target: user.email,
    type:   'success',
  })

  sendTokenResponse(user, 200, res)
})

// â”€â”€â”€ PUT /api/auth/change-password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user._id).select('+password')

  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect.', 401))
  }

  user.password = newPassword
  await user.save()

  res.json({ success: true, message: 'Password changed successfully.' })
})




