import { Router } from 'express'
import {
	getAnomalyDetection,
	getCategoryTrend,
	getInsights,
	getSavingsOpportunity,
	getSummaryInsight,
	refreshAllInsights,
} from '../controllers/aiController.js'

const router = Router()

router.get('/insights', getInsights)
router.post('/insights/refresh', refreshAllInsights)
router.get('/insights/summary', getSummaryInsight)
router.get('/insights/category-trend', getCategoryTrend)
router.get('/insights/anomaly', getAnomalyDetection)
router.get('/insights/savings-opportunity', getSavingsOpportunity)

export default router