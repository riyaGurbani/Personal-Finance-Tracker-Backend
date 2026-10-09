import mongoose from 'mongoose'

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || ''


  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message)
    process.exit(1)
  }
}
