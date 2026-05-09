const mongoose  = require('mongoose')
const bcrypt    = require('bcryptjs')
const jwt       = require('jsonwebtoken')
const crypto    = require('crypto')

const userSchema = new mongoose.Schema(
  {
    // â”€â”€ Identity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'executor', 'admin'],
      default: 'student',
    },

    // â”€â”€ Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    avatar: {
      url:       { type: String, default: null },
      publicId:  { type: String, default: null },
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    skills: [{ type: String, trim: true }],

    // â”€â”€ Location (for physical assignment matching) â”€â”€â”€â”€
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    university: {
      type: String,
      trim: true,
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    // â”€â”€ Wallet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    walletBalance: {
      type:    Number,
      default: 0,
      min:     [0, 'Wallet balance cannot be negative'],
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },

    // â”€â”€ Ratings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    rating: {
      type:    Number,
      default: 0,
      min:     0,
      max:     5,
    },
    totalReviews: {
      type:    Number,
      default: 0,
    },
    ratingSum: {
      type:    Number,
      default: 0,
    },

    // â”€â”€ Referral â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    referralCode: {
      type:   String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      default: null,
    },
    referralCount: {
      type:    Number,
      default: 0,
    },

    // â”€â”€ Status & Verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    verified:     { type: Boolean, default: false },
    emailVerified:{ type: Boolean, default: false },
    active:       { type: Boolean, default: true },
    banned:       { type: Boolean, default: false },
    banReason:    { type: String,  default: null },

    // â”€â”€ Auth Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    passwordResetToken:   { type: String, select: false },
    passwordResetExpire:  { type: Date,   select: false },
    emailVerifyToken:     { type: String, select: false },
    emailVerifyExpire:    { type: Date,   select: false },

    // â”€â”€ Notification preferences â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    notifications: {
      email:  { type: Boolean, default: true },
      push:   { type: Boolean, default: true },
      chat:   { type: Boolean, default: true },
    },

    // â”€â”€ Executor-specific â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    completedAssignments: { type: Number, default: 0 },
    ongoingAssignments:   { type: Number, default: 0 },
    availability:         { type: Boolean, default: true },

    // â”€â”€ Timestamps â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
)

// â”€â”€â”€ Indexes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ city: 1 })
userSchema.index({ location: '2dsphere' })
userSchema.index({ referralCode: 1 })

// â”€â”€â”€ Virtuals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
userSchema.virtual('averageRating').get(function () {
  return this.totalReviews > 0
    ? Math.round((this.ratingSum / this.totalReviews) * 10) / 10
    : 0
})

// â”€â”€â”€ Pre-save: hash password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)

  // Generate referral code on first save
  if (!this.referralCode) {
    this.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase()
  }
  next()
})

// â”€â”€â”€ Methods â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  )
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  )
}

userSchema.methods.generatePasswordReset = function () {
  const raw   = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken  = crypto.createHash('sha256').update(raw).digest('hex')
  this.passwordResetExpire = Date.now() + 10 * 60 * 1000 // 10 min
  return raw
}

userSchema.methods.generateEmailVerify = function () {
  const raw = crypto.randomBytes(32).toString('hex')
  this.emailVerifyToken  = crypto.createHash('sha256').update(raw).digest('hex')
  this.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000 // 24h
  return raw
}

userSchema.methods.updateRating = function (newRating) {
  this.ratingSum    += newRating
  this.totalReviews += 1
  this.rating        = Math.round((this.ratingSum / this.totalReviews) * 10) / 10
}

// â”€â”€â”€ Safe public profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
userSchema.methods.toPublicJSON = function () {
  return {
    _id:          this._id,
    name:         this.name,
    email:        this.email,
    role:         this.role,
    avatar:       this.avatar,
    bio:          this.bio,
    skills:       this.skills,
    city:         this.city,
    university:   this.university,
    rating:       this.averageRating,
    totalReviews: this.totalReviews,
    verified:     this.verified,
    walletBalance: this.walletBalance,
    completedAssignments: this.completedAssignments,
    availability: this.availability,
    createdAt:    this.createdAt,
  }
}

module.exports = mongoose.model('User', userSchema)




