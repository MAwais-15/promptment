const jwt  = require('jsonwebtoken')
const User = require('../models/User')

const onlineUsers = new Map() // userId -> Set of socketIds

module.exports = (io) => {
  // ── Auth Middleware ───────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (!token) return next(new Error('Authentication required'))

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user    = await User.findById(decoded.id).select('_id name role city university')
      if (!user) return next(new Error('User not found'))
      socket.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString()
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`)

    // ── Track online users ────────────────────────────
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set())
    onlineUsers.get(userId).add(socket.id)

    // Join personal room
    socket.join(`user_${userId}`)

    // Broadcast online status to contacts
    socket.broadcast.emit('user_online', { userId, name: socket.user.name })

    // ── Join Conversation Room ────────────────────────
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`)
      console.log(`  └─ Joined conversation: ${conversationId}`)
    })

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`)
    })

    // ── Typing Indicator ──────────────────────────────
    socket.on('typing', ({ conversationId, typing }) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId,
        name:   socket.user.name,
        typing,
      })
    })

    // ── Message Read Receipt ──────────────────────────
    socket.on('message_read', ({ messageId, conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('message_read', { messageId, readBy: userId })
    })

    // ── Assignment Events ─────────────────────────────
    socket.on('assignment_status_update', ({ assignmentId, status, recipientId }) => {
      io.to(`user_${recipientId}`).emit('assignment_updated', { assignmentId, status })
    })

    // ── Get online users ──────────────────────────────
    socket.on('get_online_users', () => {
      const online = Array.from(onlineUsers.keys())
      socket.emit('online_users', online)
    })

    // ── Ping/Pong for connection health ───────────────
    socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }))

    // ── Disconnect ────────────────────────────────────
    socket.on('disconnect', (reason) => {
      const sockets = onlineUsers.get(userId)
      if (sockets) {
        sockets.delete(socket.id)
        if (sockets.size === 0) {
          onlineUsers.delete(userId)
          // Update lastSeen in DB
          User.findByIdAndUpdate(userId, { lastSeen: new Date() }).exec()
          // Notify others
          socket.broadcast.emit('user_offline', { userId })
        }
      }
      console.log(`🔌 Socket disconnected: ${socket.user.name} (${reason})`)
    })
  })

  // ── Expose helper for controllers ────────────────────
  io.getOnlineUsers = () => Array.from(onlineUsers.keys())
  io.isOnline = (userId) => onlineUsers.has(userId.toString())
}
