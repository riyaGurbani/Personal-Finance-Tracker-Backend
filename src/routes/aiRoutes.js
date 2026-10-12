import { Router } from 'express'
import { getCategoryTrend, getSummaryInsight } from '../controllers/aiController.js'

const router = Router()

router.get('/insights/summary', getSummaryInsight)
router.get('/insights/category-trend', getCategoryTrend)

export default router