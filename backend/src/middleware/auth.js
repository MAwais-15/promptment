const jwt  = require('jsonwebtoken')
const User = require('../models/User')

// ─── Protect — verify JWT ─────────────────────────────────
exports.protect = async (req, res, next) => {
  let token

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies?.promptment_token) {
    token = req.cookies.promptment_token
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select('-password -passwordResetToken -emailVerifyToken')
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' })
    }

    if (user.banned) {
      return res.status(403).json({
        success: false,
        message: `Your account has been banned. Reason: ${user.banReason || 'Policy violation.'}`,
      })
    }

    if (!user.active) {
      return res.status(403).json({ success: false, message: 'Your account is deactivated.' })
    }

    // update last seen (fire-and-forget)
    User.findByIdAndUpdate(user._id, { lastSeen: new Date() }).exec()

    req.user = user
    next()
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Session expired. Please log in again.'
      : 'Invalid token. Please log in again.'
    return res.status(401).json({ success: false, message: msg })
  }
}

// ─── Authorize — role check ───────────────────────────────
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized for this action.`,
    })
  }
  next()
}

// ─── Optional Auth — attach user if token present ─────────
exports.optionalAuth = async (req, res, next) => {
  let token
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) return next()

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')
  } catch { /* ignore */ }
  next()
}
