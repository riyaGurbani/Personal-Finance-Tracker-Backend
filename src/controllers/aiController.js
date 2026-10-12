import { getCategoryTrendInsight, getSpendingSummaryInsight } from '../services/ai/insightService.js'

export async function getSummaryInsight(req, res) {
  try {
    const userId = req.query.userId || 'riya-demo'
    const insight = await getSpendingSummaryInsight(userId)
    res.json(insight)
  } catch (error) {
    console.error('Failed to load AI summary insight:', error)
    res.status(500).json({ message: 'Failed to load AI summary insight' })
  }
}

export async function getCategoryTrend(req, res) {
  try {
    const userId = req.query.userId || 'riya-demo'
    const insight = await getCategoryTrendInsight(userId)
    res.json(insight)
  } catch (error) {
    console.error('Failed to load AI category trend insight:', error)
    res.status(500).json({ message: 'Failed to load AI category trend insight' })
  }
}