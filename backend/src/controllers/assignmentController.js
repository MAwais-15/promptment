const Assignment   = require('../models/Assignment')
const User         = require('../models/User')
const { Notification } = require('../models/Notification')
const { Conversation } = require('../models/Chat')
const asyncHandler = require('../middleware/async');
const { AppError } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/activityLogger')
const { runAIValidation } = require('../utils/aiValidation')
const cloudinary   = require('../config/cloudinary')

// ─── Helper: push notification ────────────────────────────
const notify = async (recipientId, type, title, message, link = null, data = {}) => {
  await Notification.create({ recipient: recipientId, type, title, message, link, data })
}

// ─── POST /api/assignments — Create ──────────────────────
exports.createAssignment = asyncHandler(async (req, res, next) => {
  const { title, description, category, type, budget, deadline, city, university } = req.body

  if (req.user.role !== 'student') {
    return next(new AppError('Only students can post assignments.', 403))
  }

  // Build assignment data
  const data = {
    title, description, category, type,
    budget:   Number(budget),
    deadline: new Date(deadline),
    student:  req.user._id,
  }

  if (type === 'physical') {
    if (!city || !university) return next(new AppError('City and university are required for physical assignments.', 400))
    data.city       = city
    data.university = university
  }

  // Handle file uploads
  if (req.files && req.files.length > 0) {
    data.attachments = req.files.map(f => ({
      name:     f.originalname,
      url:      f.path,
      publicId: f.filename,
      size:     f.size,
      mimeType: f.mimetype,
    }))
  }

  const assignment = await Assignment.create(data)

  await logActivity({
    actor:       req.user._id,
    actorName:   req.user.name,
    action:      'Assignment Posted',
    target:      assignment.title,
    targetId:    assignment._id,
    targetModel: 'Assignment',
    type:        'success',
  })

  res.status(201).json({ success: true, assignment })
})

// ─── GET /api/assignments — Browse (executor feed) ────────
exports.getAssignments = asyncHandler(async (req, res) => {
  const {
    status = 'pending', type, category, minBudget, maxBudget,
    city, university, page = 1, limit = 12, sort = '-createdAt',
  } = req.query

  const query = { status }

  if (type)     query.type     = type
  if (category) query.category = category

  if (minBudget || maxBudget) {
    query.budget = {}
    if (minBudget) query.budget.$gte = Number(minBudget)
    if (maxBudget) query.budget.$lte = Number(maxBudget)
  }

  // Physical: filter by executor's location
  if (req.user?.role === 'executor' && !city && !university) {
    if (type === 'physical') {
      query.$or = [
        { city: req.user.city, university: req.user.university },
        { type: 'digital' },
      ]
    }
  } else {
    if (city)       query.city       = new RegExp(city, 'i')
    if (university) query.university = new RegExp(university, 'i')
  }

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Assignment.countDocuments(query)

  const assignments = await Assignment.find(query)
    .populate('student', 'name avatar rating city university')
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))

  res.json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    assignments,
  })
})

// ─── GET /api/assignments/my — Student's own ──────────────
exports.getMyAssignments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const query = { student: req.user._id }
  if (status) query.status = status

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Assignment.countDocuments(query)

  const assignments = await Assignment.find(query)
    .populate('executor', 'name avatar rating')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))

  res.json({ success: true, total, assignments })
})

// ─── GET /api/assignments/:id ─────────────────────────────
exports.getAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('student',    'name avatar rating city university')
    .populate('executor',   'name avatar rating completedAssignments')
    .populate('applicants.executor', 'name avatar rating')

  if (!assignment) return next(new AppError('Assignment not found.', 404))

  // increment view count (fire-and-forget)
  Assignment.findByIdAndUpdate(assignment._id, { $inc: { viewCount: 1 } }).exec()

  res.json({ success: true, assignment })
})

// ─── POST /api/assignments/:id/apply ─────────────────────
exports.applyForAssignment = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'executor') {
    return next(new AppError('Only executors can apply for assignments.', 403))
  }

  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return next(new AppError('Assignment not found.', 404))
  if (assignment.status !== 'pending') return next(new AppError('This assignment is no longer open.', 400))

  const alreadyApplied = assignment.applicants.some(a => a.executor.toString() === req.user._id.toString())
  if (alreadyApplied) return next(new AppError('You have already applied.', 400))

  // Physical: check location match
  if (assignment.type === 'physical') {
    const cityMatch = assignment.city?.toLowerCase() === req.user.city?.toLowerCase()
    const uniMatch  = assignment.university?.toLowerCase() === req.user.university?.toLowerCase()
    if (!cityMatch || !uniMatch) {
      return next(new AppError('You must be in the same city and university for physical assignments.', 403))
    }
  }

  assignment.applicants.push({
    executor:  req.user._id,
    message:   req.body.message || '',
    appliedAt: new Date(),
  })
  await assignment.save()

  // notify student
  await notify(
    assignment.student,
    'assignment_applied',
    'New Applicant!',
    `${req.user.name} applied for "${assignment.title}"`,
    `/student/assignments/${assignment._id}`,
    { assignmentId: assignment._id, executorId: req.user._id }
  )

  // emit socket event
  const io = req.app.get('io')
  io?.to(`user_${assignment.student}`).emit('assignment_applied', {
    assignmentId: assignment._id,
    executor: { _id: req.user._id, name: req.user.name },
  })

  res.json({ success: true, message: 'Application submitted successfully.' })
})

// ─── POST /api/assignments/:id/accept ────────────────────
exports.acceptExecutor = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return next(new AppError('Assignment not found.', 404))

  if (assignment.student.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the student who posted can accept executors.', 403))
  }

  const { executorId } = req.body
  const applied = assignment.applicants.find(a => a.executor.toString() === executorId)
  if (!applied) return next(new AppError('This executor has not applied.', 400))

  assignment.executor = executorId
  assignment.status   = 'accepted'
  await assignment.save()

  // Create conversation
  await Conversation.create({
    assignment:   assignment._id,
    participants: [assignment.student, executorId],
  })

  // Update executor stats
  await User.findByIdAndUpdate(executorId, { $inc: { ongoingAssignments: 1 } })

  // Notify executor
  await notify(
    executorId,
    'assignment_accepted',
    'Youa are hired!',
    `Your application for "${assignment.title}" was accepted.`,
    `/executor/assignments/${assignment._id}`,
  )

  const io = req.app.get('io')
  io?.to(`user_${executorId}`).emit('assignment_accepted', { assignmentId: assignment._id })

  res.json({ success: true, assignment })
})

// ─── PUT /api/assignments/:id/start ──────────────────────
exports.startAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return next(new AppError('Assignment not found.', 404))

  if (assignment.executor?.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized.', 403))
  }
  if (assignment.status !== 'accepted') {
    return next(new AppError('Assignment must be accepted before starting.', 400))
  }

  assignment.status = 'inprogress'
  await assignment.save()

  res.json({ success: true, assignment })
})

// ─── POST /api/assignments/:id/submit ────────────────────
exports.submitWork = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return next(new AppError('Assignment not found.', 404))

  if (assignment.executor?.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized.', 403))
  }

  if (!['accepted', 'inprogress'].includes(assignment.status)) {
    return next(new AppError('Cannot submit at this stage.', 400))
  }

  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload at least one file.', 400))
  }

  assignment.submittedFiles = req.files.map(f => ({
    name:     f.originalname,
    url:      f.path,
    publicId: f.filename,
    size:     f.size,
    mimeType: f.mimetype,
  }))
  assignment.submittedAt = new Date()
  assignment.status      = 'completed'

  // ── Run AI validation asynchronously ──────────────────
  runAIValidation(assignment).catch(err =>
    console.error('AI validation error:', err.message)
  )

  await assignment.save()

  await notify(
    assignment.student,
    'assignment_completed',
    'Work Submitted!',
    `${req.user.name} has submitted work for "${assignment.title}". Review it now.`,
    `/student/assignments/${assignment._id}`,
  )

  const io = req.app.get('io')
  io?.to(`user_${assignment.student}`).emit('work_submitted', { assignmentId: assignment._id })

  res.json({ success: true, assignment })
})

// ─── POST /api/assignments/:id/approve ───────────────────
exports.approveWork = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id).populate('payment')
  if (!assignment) return next(new AppError('Assignment not found.', 404))

  const isStudent = assignment.student.toString() === req.user._id.toString()
  const isAdmin   = req.user.role === 'admin'
  if (!isStudent && !isAdmin) return next(new AppError('Not authorized.', 403))

  if (assignment.status !== 'completed') {
    return next(new AppError('Assignment must be completed before approval.', 400))
  }

  assignment.status        = 'approved'
  assignment.escrowReleased  = true
  assignment.escrowReleasedAt = new Date()
  await assignment.save()

  // Release escrow — credit executor wallet
  if (assignment.executor) {
    await User.findByIdAndUpdate(assignment.executor, {
      $inc: {
        walletBalance:       assignment.executorPayout,
        totalEarned:         assignment.executorPayout,
        completedAssignments: 1,
        ongoingAssignments:  -1,
      },
    })

    await notify(
      assignment.executor,
      'payment_released',
      'Payment Released! 🎉',
      `₨ ${assignment.executorPayout.toLocaleString()} has been added to your wallet for "${assignment.title}"`,
      `/executor/wallet`,
    )

    const io = req.app.get('io')
    io?.to(`user_${assignment.executor}`).emit('payment_released', {
      assignmentId:  assignment._id,
      amount:        assignment.executorPayout,
    })
  }

  await logActivity({
    actor:    req.user._id,
    actorName:req.user.name,
    action:   'Assignment Approved',
    target:   assignment.title,
    type:     'success',
  })

  res.json({ success: true, message: 'Assignment approved and payment released.', assignment })
})

// ─── POST /api/assignments/:id/reject ────────────────────
exports.rejectWork = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return next(new AppError('Assignment not found.', 404))

  const isStudent = assignment.student.toString() === req.user._id.toString()
  const isAdmin   = req.user.role === 'admin'
  if (!isStudent && !isAdmin) return next(new AppError('Not authorized.', 403))

  assignment.status          = 'accepted' // revert to in-progress
  assignment.rejectionReason = req.body.reason || 'Work did not meet requirements.'
  assignment.submittedFiles  = []
  assignment.submittedAt     = null
  await assignment.save()

  await notify(
    assignment.executor,
    'assignment_rejected',
    'Work Rejected',
    `Your submission for "${assignment.title}" was rejected. Reason: ${assignment.rejectionReason}`,
    `/executor/assignments/${assignment._id}`,
  )

  res.json({ success: true, message: 'Work rejected. Executor must resubmit.', assignment })
})

// ─── GET /api/assignments/:id/applicants ─────────────────
exports.getApplicants = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('applicants.executor', 'name avatar rating completedAssignments city university bio skills')

  if (!assignment) return next(new AppError('Assignment not found.', 404))

  if (assignment.student.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized.', 403))
  }

  res.json({ success: true, applicants: assignment.applicants })
})

// ─── DELETE /api/assignments/:id ─────────────────────────
exports.deleteAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return next(new AppError('Assignment not found.', 404))

  const isOwner = assignment.student.toString() === req.user._id.toString()
  const isAdmin  = req.user.role === 'admin'
  if (!isOwner && !isAdmin) return next(new AppError('Not authorized.', 403))

  if (['inprogress', 'completed', 'approved'].includes(assignment.status)) {
    return next(new AppError('Cannot delete an active or completed assignment.', 400))
  }

  // Delete cloudinary files
  for (const att of assignment.attachments) {
    if (att.publicId) cloudinary.uploader.destroy(att.publicId).catch(() => {})
  }

  await assignment.deleteOne()
  res.json({ success: true, message: 'Assignment deleted.' })
})
