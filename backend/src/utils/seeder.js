const mongoose = require('mongoose')
require('dotenv').config()

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ Connected to MongoDB')
}

const clearDatabase = async () => {
  try {
    await connectDB()
    
    const collections = await mongoose.connection.db.collections()
    
    for (const collection of collections) {
      await collection.deleteMany({})
      console.log(`🗑️  Cleared: ${collection.collectionName}`)
    }
    
    console.log('✅ Database completely cleared!')
    console.log('🚀 System is now fresh and ready for real users!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

clearDatabase()