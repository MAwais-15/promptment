const mongoose = require('mongoose')

// ─── Notification Schema ─────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'assignment_posted',
        'assignment_accepted',
        'assignment_applied',
        'assignment_inprogress',
        'assignment_completed',
        'assignment_approved',
        'assignment_rejected',
        'payment_received',
        'payment_released',
        'payment_failed',
        'chat_message',
        'review_received',
        'system',
      ],
      required: true,
    },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    link:    { type: String, default: null },   // frontend route
    data:    { type: mongoose.Schema.Types.Mixed, default: {} },
    read:    { type: Boolean, default: false },
    readAt:  { type: Date,   default: null },
  },
  { timestamps: true }
)

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 })

// ─── Review Schema ────────────────────────────────────────
const reviewSchema = new mongoose.Schema(
  {
    assignment: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Assignment',
      required: true,
    },
    reviewer: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    reviewee: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    rating: {
      type:     Number,
      required: true,
      min:      1,
      max:      5,
    },
    comment: {
      type:      String,
      maxlength: [500, 'Review cannot exceed 500 characters'],
      default:   '',
    },
    tags: [{ type: String }], // ['fast', 'quality', 'communicative']
  },
  { timestamps: true }
)

reviewSchema.index({ reviewee: 1 })
reviewSchema.index({ assignment: 1 }, { unique: true })

// ─── Activity Log Schema ──────────────────────────────────
const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
      default: null,
    },
    actorName:  { type: String, default: 'System' },
    action:     { type: String, required: true },
    target:     { type: String, default: '' },
    targetId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    targetModel:{ type: String, default: null },
    metadata:   { type: mongoose.Schema.Types.Mixed, default: {} },
    ip:         { type: String, default: null },
    type: {
      type:    String,
      enum:    ['success', 'warning', 'error', 'info'],
      default: 'info',
    },
  },
  { timestamps: true }
)

activityLogSchema.index({ createdAt: -1 })
activityLogSchema.index({ actor: 1 })
activityLogSchema.index({ type: 1 })

const Notification = mongoose.model('Notification', notificationSchema)
const Review       = mongoose.model('Review',       reviewSchema)
const ActivityLog  = mongoose.model('ActivityLog',  activityLogSchema)

module.exports = { Notification, Review, ActivityLog }
