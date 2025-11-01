// MongoDB Connection Configuration
const mongoose = require("mongoose")

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/clouddeck"
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(`MongoDB connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.warn(`MongoDB connection warning: ${error.message}`)
    console.warn("Running in mock mode - database operations will use in-memory storage")
    // Don't exit, continue in mock mode
    return null
  }
}

module.exports = connectDB
