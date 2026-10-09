import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import dashboardRoutes from './routes/dashboardRoutes.js'

dotenv.config()

// Create Express app
const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Personal Finance Tracker backend is running' })
})

// Dashboard API
app.use('/api/dashboard', dashboardRoutes)

// Temporary root route
app.get('/', (req, res) => {
  res.send('Personal Finance Tracker Backend')
})

const PORT = process.env.PORT || 3001

// Start server after connecting to DB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
  })
})


