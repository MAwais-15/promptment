const mongoose = require('mongoose')

const assignmentSchema = new mongoose.Schema(
  {
    // ── Core Details ──────────────────────────────────
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type:      String,
      required:  [true, 'Description is required'],
      minlength: [30, 'Description must be at least 30 characters'],
    },
    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum: [
        'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology',
        'Engineering', 'Business', 'Literature', 'History', 'Economics',
        'Psychology', 'Law', 'Medicine', 'Architecture', 'Other',
      ],
    },

    // ── Type: Digital or Physical ─────────────────────
    type: {
      type:     String,
      enum:     ['digital', 'physical'],
      required: true,
    },

    // ── Physical Assignment Location ───────────────────
    city:       { type: String, default: null },
    university: { type: String, default: null },
    location: {
      type:        { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },

    // ── Budget & Payment ──────────────────────────────
    budget: {
      type:     Number,
      required: [true, 'Budget is required'],
      min:      [100, 'Minimum budget is 100 PKR'],
    },
    platformFee: {
      type:    Number,
      default: 0,
    },
    executorPayout: {
      type:    Number,
      default: 0,
    },

    // ── Deadline ──────────────────────────────────────
    deadline: {
      type:     Date,
      required: [true, 'Deadline is required'],
    },

    // ── Parties ───────────────────────────────────────
    student: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    executor: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },

    // ── Applicants (executors who applied) ────────────
    applicants: [
      {
        executor:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message:   { type: String, default: '' },
        appliedAt: { type: Date, default: Date.now },
      },
    ],

    // ── Status Lifecycle ──────────────────────────────
    // pending → accepted → inprogress → completed → approved | rejected
    status: {
      type:    String,
      enum:    ['pending', 'accepted', 'inprogress', 'completed', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },

    // ── Timeline ──────────────────────────────────────
    statusHistory: [
      {
        status:    String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note:      String,
      },
    ],

    // ── Attachments (student uploads) ─────────────────
    attachments: [
      {
        name:      String,
        url:       String,
        publicId:  String,
        size:      Number,
        mimeType:  String,
        uploadedAt:{ type: Date, default: Date.now },
      },
    ],

    // ── Submitted Work (executor uploads) ─────────────
    submittedFiles: [
      {
        name:       String,
        url:        String,
        publicId:   String,
        size:       Number,
        mimeType:   String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    submittedAt: { type: Date, default: null },

    // ── AI Validation ─────────────────────────────────
    aiValidation: {
      checked:          { type: Boolean, default: false },
      checkedAt:        { type: Date,    default: null },
      plagiarismScore:  { type: Number,  default: null }, // 0-100 (lower = better)
      aiContentScore:   { type: Number,  default: null }, // 0-100 (higher = more AI)
      humanScore:       { type: Number,  default: null }, // 0-100 (higher = more human)
      passed:           { type: Boolean, default: null },
      report:           { type: String,  default: null },
      provider:         { type: String,  default: 'openai' },
    },

    // ── Payment ───────────────────────────────────────
    payment: {
      type:          mongoose.Schema.Types.ObjectId,
      ref:           'Payment',
      default:       null,
    },
    escrowReleased:  { type: Boolean, default: false },
    escrowReleasedAt:{ type: Date,    default: null },

    // ── Physical Completion ───────────────────────────
    physicalConfirmed:        { type: Boolean, default: false },
    physicalConfirmedByStudent:{ type: Boolean, default: false },

    // ── Review ────────────────────────────────────────
    review: {
      rating:    { type: Number, min: 1, max: 5, default: null },
      comment:   { type: String, default: null },
      createdAt: { type: Date,   default: null },
    },

    // ── Rejection / Cancellation ──────────────────────
    rejectionReason:    { type: String, default: null },
    cancellationReason: { type: String, default: null },

    // ── Flags ─────────────────────────────────────────
    flagged:      { type: Boolean, default: false },
    flagReason:   { type: String,  default: null },
    urgent:       { type: Boolean, default: false },
    featured:     { type: Boolean, default: false },
    viewCount:    { type: Number,  default: 0 },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
)

// ─── Indexes ─────────────────────────────────────────────
assignmentSchema.index({ student:  1, status: 1 })
assignmentSchema.index({ executor: 1, status: 1 })
assignmentSchema.index({ status: 1, type: 1 })
assignmentSchema.index({ city: 1, university: 1 })
assignmentSchema.index({ category: 1 })
assignmentSchema.index({ deadline: 1 })
assignmentSchema.index({ budget: 1 })
assignmentSchema.index({ createdAt: -1 })
assignmentSchema.index({ location: '2dsphere' })

// ─── Virtuals ────────────────────────────────────────────
assignmentSchema.virtual('isExpired').get(function () {
  return new Date() > new Date(this.deadline)
})

assignmentSchema.virtual('daysUntilDeadline').get(function () {
  const diff = new Date(this.deadline) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

assignmentSchema.virtual('applicantCount').get(function () {
  return this.applicants?.length || 0
})

// ─── Pre-save: calculate fees ────────────────────────────
assignmentSchema.pre('save', function (next) {
  const feePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5') / 100
  this.platformFee    = Math.round(this.budget * feePercent)
  this.executorPayout = this.budget - this.platformFee

  // log status changes
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() })
  }
  next()
})

module.exports = mongoose.model('Assignment', assignmentSchema)
