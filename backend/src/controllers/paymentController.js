const Payment    = require('../models/Payment')
const Assignment = require('../models/Assignment')
const User       = require('../models/User')
const { Notification } = require('../models/Notification')
const asyncHandler = require('../middleware/async');
const { AppError } = require('../middleware/errorHandler');
const { logActivity } = require('../utils/activityLogger')
const { v4: uuidv4 } = require('uuid')

// ─── Crypto wallet addresses (from env) ──────────────────
const CRYPTO_ADDRESSES = {
  btc:        process.env.BTC_WALLET_ADDRESS,
  eth:        process.env.ETH_WALLET_ADDRESS,
  usdt_trc20: process.env.USDT_TRC20_ADDRESS,
  usdt_erc20: process.env.USDT_ERC20_ADDRESS,
}

// ─── POST /api/payments/escrow ────────────────────────────
exports.createEscrow = asyncHandler(async (req, res, next) => {
  const { assignmentId, method, amount } = req.body

  const assignment = await Assignment.findById(assignmentId)
  if (!assignment) return next(new AppError('Assignment not found.', 404))

  if (assignment.student.toString() !== req.user._id.toString()) {
    return next(new AppError('Only the student can make this payment.', 403))
  }

  if (assignment.payment) {
    return next(new AppError('Payment already exists for this assignment.', 400))
  }

  const feePercent    = parseFloat(process.env.PLATFORM_FEE_PERCENT || '5') / 100
  const platformFee   = Math.round(amount * feePercent)
  const executorPayout = amount - platformFee

  // Wallet payment: deduct immediately
  if (method === 'wallet') {
    const student = await User.findById(req.user._id)
    if (student.walletBalance < amount) {
      return next(new AppError(`Insufficient wallet balance. Available: ₨ ${student.walletBalance}`, 400))
    }
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { walletBalance: -amount, totalSpent: amount },
    })
  }

  const isCrypto = ['btc', 'eth', 'usdt_trc20', 'usdt_erc20'].includes(method)

  const payment = await Payment.create({
    student:       req.user._id,
    executor:      assignment.executor,
    assignment:    assignmentId,
    amount,
    platformFee,
    executorPayout,
    method,
    currency:      isCrypto ? method.toUpperCase().replace('_TRC20','').replace('_ERC20','') : 'PKR',
    status:        method === 'wallet' ? 'held' : 'pending',
    cryptoAddress: isCrypto ? CRYPTO_ADDRESSES[method] : null,
    isPhysical:    assignment.type === 'physical',
    escrow: {
      held:   method === 'wallet',
      heldAt: method === 'wallet' ? new Date() : null,
    },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  })

  // Link payment to assignment
  assignment.payment = payment._id
  await assignment.save()

  await logActivity({
    actor:    req.user._id,
    actorName:req.user.name,
    action:   'Escrow Created',
    target:   `₨ ${amount} for ${assignment.title}`,
    type:     'success',
  })

  res.status(201).json({
    success: true,
    payment: {
      ...payment.toObject(),
      cryptoAddress: isCrypto ? CRYPTO_ADDRESSES[method] : null,
      instructions: getPaymentInstructions(method, amount),
    },
  })
})

// ─── POST /api/payments/:id/confirm ──────────────────────
exports.confirmPayment = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
  if (!payment) return next(new AppError('Payment not found.', 404))

  if (req.user.role !== 'admin') return next(new AppError('Admin only.', 403))

  payment.status        = 'held'
  payment.escrow.held   = true
  payment.escrow.heldAt = new Date()
  payment.externalRef   = req.body.externalRef || null
  await payment.save()

  res.json({ success: true, payment })
})

// ─── POST /api/payments/:id/release ──────────────────────
exports.releaseEscrow = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id).populate('assignment')
  if (!payment) return next(new AppError('Payment not found.', 404))

  if (req.user.role !== 'admin') return next(new AppError('Admin only.', 403))
  if (payment.escrow.released) return next(new AppError('Already released.', 400))

  // Credit executor
  await User.findByIdAndUpdate(payment.executor, {
    $inc: { walletBalance: payment.executorPayout, totalEarned: payment.executorPayout },
  })

  payment.status            = 'released'
  payment.escrow.released   = true
  payment.escrow.releasedAt = new Date()
  payment.escrow.releasedBy = req.user._id
  await payment.save()

  await Notification.create({
    recipient: payment.executor,
    type:      'payment_released',
    title:     'Payment Released!',
    message:   `₨ ${payment.executorPayout.toLocaleString()} has been credited to your wallet.`,
    link:      '/executor/wallet',
  })

  res.json({ success: true, message: 'Escrow released to executor.', payment })
})

// ─── GET /api/payments/transactions ──────────────────────
exports.getTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const query = req.user.role === 'admin'
    ? {}
    : { $or: [{ student: req.user._id }, { executor: req.user._id }] }

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Payment.countDocuments(query)

  const payments = await Payment.find(query)
    .populate('student',  'name avatar')
    .populate('executor', 'name avatar')
    .populate('assignment', 'title')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))

  res.json({ success: true, total, payments })
})

// ─── GET /api/payments/wallet ─────────────────────────────
exports.getWallet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('walletBalance totalEarned totalSpent')

  const recent = await Payment.find({
    $or: [{ student: req.user._id }, { executor: req.user._id }],
    status: { $in: ['held', 'released', 'deposited'] },
  })
    .populate('assignment', 'title')
    .sort('-createdAt')
    .limit(10)

  res.json({ success: true, wallet: { ...user.toObject() }, recentTransactions: recent })
})

// ─── GET /api/payments/crypto-address/:currency ──────────
exports.getCryptoAddress = asyncHandler(async (req, res, next) => {
  const { currency } = req.params
  const address = CRYPTO_ADDRESSES[currency.toLowerCase()]
  if (!address) return next(new AppError('Unsupported currency.', 400))
  res.json({ success: true, currency, address })
})

// ─── POST /api/payments/withdraw ─────────────────────────
exports.withdrawToBank = asyncHandler(async (req, res, next) => {
  const { amount, bankDetails } = req.body
  const user = await User.findById(req.user._id)

  if (user.walletBalance < amount) {
    return next(new AppError(`Insufficient balance. Available: ₨ ${user.walletBalance}`, 400))
  }
  if (amount < 500) return next(new AppError('Minimum withdrawal is ₨ 500.', 400))

  await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: -amount } })

  const withdrawal = await Payment.create({
    student:        req.user._id,
    executor:       req.user._id,
    assignment:     null,
    amount,
    platformFee:    0,
    executorPayout: amount,
    method:         bankDetails.method || 'bank_transfer',
    status:         'pending',
    senderName:     user.name,
    senderAccount:  bankDetails.account,
    senderIBAN:     bankDetails.iban,
    isPhysical:     false,
  })

  await logActivity({
    actor:    req.user._id,
    actorName: user.name,
    action:   'Withdrawal Requested',
    target:   `₨ ${amount}`,
    type:     'info',
  })

  res.json({
    success: true,
    message: 'Withdrawal request submitted. Processing within 1-2 business days.',
    withdrawal,
  })
})

// ─── Helper: payment instructions ────────────────────────
function getPaymentInstructions(method, amount) {
  const map = {
    easypaisa:  `Send ₨ ${amount} to EasyPaisa account: 0300-1234567 (Promptment Pvt. Ltd.)`,
    jazzcash:   `Send ₨ ${amount} to JazzCash account: 0321-7654321 (Promptment Pvt. Ltd.)`,
    bank_transfer: `Transfer ₨ ${amount} to: Bank Alfalah | Account: 12345678901234 | Title: Promptment`,
    iban:       `IBAN: PK36ALFA0010001234567890`,
    btc:        `Send exact BTC equivalent to the address shown. TX confirms within 30 min.`,
    eth:        `Send exact ETH equivalent to the address shown.`,
    usdt_trc20: `Send USDT on TRC20 network to the address shown.`,
    usdt_erc20: `Send USDT on ERC20 network to the address shown.`,
    wallet:     `Deducted from your Promptment wallet.`,
  }
  return map[method] || 'Follow the payment instructions.'
}
