const express    = require('express')
const http       = require('http')
const { Server } = require('socket.io')
const mongoose   = require('mongoose')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const compression = require('compression')
const mongoSanitize = require('express-mongo-sanitize')
const rateLimit  = require('express-rate-limit')
const path       = require('path')
require('dotenv').config()

const logger     = require('./utils/logger')
const connectDB  = require('./config/db')
const socketHandler = require('./socket/socketHandler')
const errorHandler  = require('./middleware/errorHandler')

// ─── Route Imports ───────────────────────────────────────
const authRoutes         = require('./routes/auth')
const userRoutes         = require('./routes/users')
const assignmentRoutes   = require('./routes/assignments')
const paymentRoutes      = require('./routes/payments')
const chatRoutes         = require('./routes/chat')
const notificationRoutes = require('./routes/notifications')
const adminRoutes        = require('./routes/admin')
const uploadRoutes       = require('./routes/uploads')

// ─── App Init ────────────────────────────────────────────
const app    = express()
const server = http.createServer(app)
app.set('trust proxy', 1)

// ─── Socket.io ───────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// attach io to app for use in routes
app.set('io', io)
socketHandler(io)

// ─── Connect Database ────────────────────────────────────
connectDB()

// ─── Global Middleware ───────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(mongoSanitize())

// ─── Rate Limiting ───────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please wait 15 minutes.' },
})

app.use('/api/', globalLimiter)
app.use('/api/auth/', authLimiter)

// ─── Logger ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// ─── Health Check ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
})

// ─── API Routes ──────────────────────────────────────────
app.use('/api/auth',          authRoutes)
app.use('/api/users',         userRoutes)
app.use('/api/assignments',   assignmentRoutes)
app.use('/api/payments',      paymentRoutes)
app.use('/api/chat',          chatRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/admin',         adminRoutes)
app.use('/api/uploads',       uploadRoutes)

// ─── 404 Handler ─────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
})

// ─── Global Error Handler ────────────────────────────────
app.use(errorHandler)

// ─── Start Server ────────────────────────────────────────
const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  logger.info(`🚀 Promptment server running on port ${PORT} [${process.env.NODE_ENV}]`)
  logger.info(`📡 Socket.io ready`)
  logger.info(`🌐 Client: ${process.env.CLIENT_URL}`)
})

// ─── Unhandled Rejections ────────────────────────────────
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`)
  server.close(() => process.exit(1))
})

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`)
  process.exit(1)
})

module.exports = { app, server, io }
