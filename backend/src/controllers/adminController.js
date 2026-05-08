const User       = require('../models/User')
const Assignment = require('../models/Assignment')
const Payment    = require('../models/Payment')
const { ActivityLog, Notification } = require('../models/Notification')
const asyncHandler = require('../middleware/async');
const { AppError } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/activityLogger')

// ─── GET /api/admin/stats ─────────────────────────────────
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers, totalStudents, totalExecutors,
    totalAssignments, pendingAssignments, activeAssignments, completedAssignments,
    totalPayments, pendingPayments,
    recentUsers, recentAssignments,
  ] = await Promise.all([
    User.countDocuments({ active: true }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'executor' }),
    Assignment.countDocuments(),
    Assignment.countDocuments({ status: 'pending' }),
    Assignment.countDocuments({ status: { $in: ['accepted', 'inprogress'] } }),
    Assignment.countDocuments({ status: 'approved' }),
    Payment.countDocuments(),
    Payment.countDocuments({ status: 'pending' }),
    User.find().sort('-createdAt').limit(5).select('name email role createdAt'),
    Assignment.find().sort('-createdAt').limit(5).populate('student', 'name').select('title status budget createdAt'),
  ])

  // Revenue aggregation
  const revenueAgg = await Payment.aggregate([
    { $match: { status: 'released' } },
    { $group: { _id: null, total: { $sum: '$platformFee' } } },
  ])
  const totalRevenue = revenueAgg[0]?.total || 0

  // Monthly revenue (last 7 months)
  const monthlyRevenue = await Payment.aggregate([
    { $match: { status: 'released', createdAt: { $gte: new Date(Date.now() - 210 * 24 * 3600000) } } },
    {
      $group: {
        _id:     { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$platformFee' },
        count:   { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ])

  res.json({
    success: true,
    stats: {
      users: { total: totalUsers, students: totalStudents, executors: totalExecutors },
      assignments: { total: totalAssignments, pending: pendingAssignments, active: activeAssignments, completed: completedAssignments },
      payments: { total: totalPayments, pending: pendingPayments, revenue: totalRevenue },
      recentUsers,
      recentAssignments,
      monthlyRevenue,
    },
  })
})

// ─── GET /api/admin/users ────────────────────────────────
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20, search, banned } = req.query
  const query = {}

  if (role)   query.role   = role
  if (banned !== undefined) query.banned = banned === 'true'
  if (search) {
    query.$or = [
      { name:  new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') },
      { city:  new RegExp(search, 'i') },
    ]
  }

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await User.countDocuments(query)

  const users = await User.find(query)
    .select('-password -passwordResetToken -emailVerifyToken')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))

  res.json({ success: true, total, page: Number(page), users })
})

// ─── PUT /api/admin/users/:id/ban ────────────────────────
exports.banUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) return next(new AppError('User not found.', 404))
  if (user.role === 'admin') return next(new AppError('Cannot ban an admin.', 403))

  user.banned    = true
  user.banReason = req.body.reason || 'Policy violation'
  await user.save()

  await logActivity({
    actor:    req.user._id,
    actorName:req.user.name,
    action:   'User Banned',
    target:   user.email,
    type:     'warning',
  })

  res.json({ success: true, message: `${user.name} has been banned.` })
})

// ─── PUT /api/admin/users/:id/unban ──────────────────────
exports.unbanUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) return next(new AppError('User not found.', 404))

  user.banned    = false
  user.banReason = null
  await user.save()

  await logActivity({
    actor:    req.user._id,
    actorName:req.user.name,
    action:   'User Unbanned',
    target:   user.email,
    type:     'success',
  })

  res.json({ success: true, message: `${user.name} has been unbanned.` })
})

// ─── GET /api/admin/assignments ───────────────────────────
exports.getAllAssignments = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20, search, flagged } = req.query
  const query = {}

  if (status)  query.status  = status
  if (type)    query.type    = type
  if (flagged !== undefined) query.flagged = flagged === 'true'
  if (search) {
    query.$or = [
      { title:    new RegExp(search, 'i') },
      { category: new RegExp(search, 'i') },
    ]
  }

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Assignment.countDocuments(query)

  const assignments = await Assignment.find(query)
    .populate('student',  'name email')
    .populate('executor', 'name email')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))

  res.json({ success: true, total, assignments })
})

// ─── GET /api/admin/approvals ─────────────────────────────
exports.getPendingApprovals = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ status: 'completed' })
    .populate('student',  'name email avatar')
    .populate('executor', 'name email avatar')
    .sort('-submittedAt')

  res.json({ success: true, count: assignments.length, assignments })
})

// ─── POST /api/admin/assignments/:id/approve ─────────────
exports.approveAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return next(new AppError('Assignment not found.', 404))

  assignment.status = 'approved'
  await assignment.save()

  // release escrow
  if (assignment.executor) {
    await User.findByIdAndUpdate(assignment.executor, {
      $inc: { walletBalance: assignment.executorPayout, totalEarned: assignment.executorPayout, completedAssignments: 1 },
    })
    await Notification.create({
      recipient: assignment.executor,
      type:      'payment_released',
      title:     'Payment Released!',
      message:   `Admin approved your work. ₨ ${assignment.executorPayout} added to wallet.`,
    })
  }

  await logActivity({
    actor:    req.user._id,
    actorName:req.user.name,
    action:   'Assignment Approved (Admin)',
    target:   assignment.title,
    type:     'success',
  })

  res.json({ success: true, message: 'Assignment approved and payment released.' })
})

// ─── GET /api/admin/payments ──────────────────────────────
exports.getPaymentDashboard = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query
  const query = status ? { status } : {}
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Payment.countDocuments(query)

  const payments = await Payment.find(query)
    .populate('student',  'name email')
    .populate('executor', 'name email')
    .populate('assignment', 'title')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))

  res.json({ success: true, total, payments })
})

// ─── GET /api/admin/logs ──────────────────────────────────
exports.getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, type } = req.query
  const query = type ? { type } : {}
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await ActivityLog.countDocuments(query)

  const logs = await ActivityLog.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))

  res.json({ success: true, total, logs })
})

// ─── GET /api/admin/commissions ───────────────────────────
exports.getCommissions = asyncHandler(async (req, res) => {
  const agg = await Payment.aggregate([
    { $match: { status: 'released' } },
    {
      $group: {
        _id:             { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalCommission: { $sum: '$platformFee' },
        totalVolume:     { $sum: '$amount' },
        count:           { $sum: 1 },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 12 },
  ])

  res.json({ success: true, commissions: agg })
})

// ─── PUT /api/admin/assignments/:id/flag ─────────────────
exports.flagAssignment = asyncHandler(async (req, res, next) => {
  const assignment = await Assignment.findById(req.params.id)
  if (!assignment) return next(new AppError('Assignment not found.', 404))

  assignment.flagged   = true
  assignment.flagReason = req.body.reason || 'Under review'
  await assignment.save()

  res.json({ success: true, message: 'Assignment flagged for review.' })
})
