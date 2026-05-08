const { Conversation, Message } = require('../models/Chat')
const asyncHandler = require('../middleware/async');
const { AppError } = require('../middleware/errorHandler');

// ─── GET /api/chat/:assignmentId ─────────────────────────
exports.getConversation = asyncHandler(async (req, res, next) => {
  let conv = await Conversation.findOne({ assignment: req.params.assignmentId })
    .populate('participants', 'name avatar role lastSeen')

  if (!conv) return next(new AppError('Conversation not found.', 404))

  const isMember = conv.participants.some(p => p._id.toString() === req.user._id.toString())
  if (!isMember && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403))
  }

  res.json({ success: true, conversation: conv })
})

// ─── GET /api/chat/:id/messages ──────────────────────────
exports.getMessages = asyncHandler(async (req, res, next) => {
  const conv = await Conversation.findById(req.params.id)
  if (!conv) return next(new AppError('Conversation not found.', 404))

  const isMember = conv.participants.some(p => p.toString() === req.user._id.toString())
  if (!isMember && req.user.role !== 'admin') {
    return next(new AppError('Not authorized.', 403))
  }

  const { page = 1, limit = 50 } = req.query
  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Message.countDocuments({ conversation: conv._id, deleted: false })

  const messages = await Message.find({ conversation: conv._id, deleted: false })
    .populate('sender', 'name avatar role')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit))

  res.json({ success: true, total, messages: messages.reverse() })
})

// ─── POST /api/chat/:id/messages ─────────────────────────
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const conv = await Conversation.findById(req.params.id)
  if (!conv) return next(new AppError('Conversation not found.', 404))

  const isMember = conv.participants.some(p => p.toString() === req.user._id.toString())
  if (!isMember) return next(new AppError('Not authorized.', 403))

  const { content, attachments = [] } = req.body

  if (!content && attachments.length === 0) {
    return next(new AppError('Message cannot be empty.', 400))
  }

  const msg = await Message.create({
    conversation: conv._id,
    sender:       req.user._id,
    content:      content || '',
    attachments,
    type:         attachments.length > 0 && !content ? 'file' : 'text',
  })

  await msg.populate('sender', 'name avatar role')

  // Update conversation last message
  conv.lastMessage = { content: content || '📎 File', sender: req.user._id, sentAt: new Date() }

  // Increment unread for others
  conv.participants.forEach(pId => {
    if (pId.toString() !== req.user._id.toString()) {
      const cur = conv.unreadCounts.get(pId.toString()) || 0
      conv.unreadCounts.set(pId.toString(), cur + 1)
    }
  })
  await conv.save()

  // Emit via socket
  const io = req.app.get('io')
  io?.to(`conversation_${conv._id}`).emit('new_message', msg)

  // Notify other participants
  conv.participants.forEach(pId => {
    if (pId.toString() !== req.user._id.toString()) {
      io?.to(`user_${pId}`).emit('chat_notification', {
        conversationId: conv._id,
        sender: { _id: req.user._id, name: req.user.name },
        preview: content?.substring(0, 50) || 'Sent a file',
      })
    }
  })

  res.status(201).json({ success: true, message: msg })
})

// ─── PUT /api/chat/:id/read ───────────────────────────────
exports.markRead = asyncHandler(async (req, res) => {
  const conv = await Conversation.findById(req.params.id)
  if (!conv) return res.json({ success: true })

  conv.unreadCounts.set(req.user._id.toString(), 0)
  await conv.save()

  await Message.updateMany(
    { conversation: conv._id, sender: { $ne: req.user._id }, read: false },
    { read: true, readAt: new Date() }
  )

  res.json({ success: true })
})

// ─── GET /api/chat — list user's conversations ───────────
exports.getMyConversations = asyncHandler(async (req, res) => {
  const convs = await Conversation.find({ participants: req.user._id, active: true })
    .populate('participants', 'name avatar role lastSeen')
    .populate('assignment', 'title status type')
    .sort('-updatedAt')

  res.json({ success: true, conversations: convs })
})
