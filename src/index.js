import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import aiRoutes from './routes/aiRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import expenseRoutes from './routes/expenseRoutes.js'

dotenv.config()

const useMockData = process.env.USE_MOCK_DATA === 'true'

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
app.use('/api/expenses', expenseRoutes)
app.use('/api/ai', aiRoutes)

// Temporary root route
app.get('/', (req, res) => {
  res.send('Personal Finance Tracker Backend')
})

const PORT = process.env.PORT || 3001

async function startServer() {
  try {
    if (useMockData) {
      console.log('Using mock dashboard data. MongoDB connection skipped.')
    } else {
      await connectDB()
    }

    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start backend:', error.message)
    process.exit(1)
  }
}

startServer()


