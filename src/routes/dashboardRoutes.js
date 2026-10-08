import { Router } from 'express'
import { getDashboard } from '../controllers/dashboardController.js'

const router = Router()

// GET /api/dashboard
router.get('/', getDashboard)

export default router
