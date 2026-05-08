const mongoose = require('mongoose')
const logger   = require('../utils/logger')

const connectDB = async () => {
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }

  const connect = async (attempt = 1) => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, options)
      logger.info(`✅ MongoDB connected: ${conn.connection.host}`)
    } catch (err) {
      logger.error(`❌ MongoDB connection failed (attempt ${attempt}): ${err.message}`)
      if (attempt < 5) {
        const delay = attempt * 2000
        logger.info(`⏳ Retrying in ${delay / 1000}s...`)
        setTimeout(() => connect(attempt + 1), delay)
      } else {
        logger.error('MongoDB connection failed after 5 attempts. Exiting.')
        process.exit(1)
      }
    }
  }

  await connect()

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Attempting to reconnect...')
    connect()
  })

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB error: ${err.message}`)
  })
}

module.exports = connectDB