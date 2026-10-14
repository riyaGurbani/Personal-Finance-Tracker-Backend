import {
  getAllInsights,
  getAnomalyDetectionInsight,
  getCategoryTrendInsight,
  getStoredInsights,
  refreshInsights,
  getSavingsOpportunityInsight,
  getSpendingSummaryInsight,
} from '../services/ai/insightService.js'

export async function getInsights(req, res) {
  try {
    const userId = req.query.userId || 'riya-demo'
    const insights = await getStoredInsights(userId)
    res.json(insights)
  } catch (error) {
    console.error('Failed to load AI insights:', error)
    res.status(500).json({ message: 'Failed to load AI insights' })
  }
}

export async function refreshAllInsights(req, res) {
  try {
    const userId = req.body.userId || req.query.userId || 'riya-demo'
    const insights = await refreshInsights(userId)
    res.json(insights)
  } catch (error) {
    console.error('Failed to refresh AI insights:', error)
    res.status(500).json({ message: 'Failed to refresh AI insights' })
  }
}

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

export async function getAnomalyDetection(req, res) {
  try {
    const userId = req.query.userId || 'riya-demo'
    const insight = await getAnomalyDetectionInsight(userId)
    res.json(insight)
  } catch (error) {
    console.error('Failed to load AI anomaly detection insight:', error)
    res.status(500).json({ message: 'Failed to load AI anomaly detection insight' })
  }
}

export async function getSavingsOpportunity(req, res) {
  try {
    const userId = req.query.userId || 'riya-demo'
    const insight = await getSavingsOpportunityInsight(userId)
    res.json(insight)
  } catch (error) {
    console.error('Failed to load AI savings opportunity insight:', error)
    res.status(500).json({ message: 'Failed to load AI savings opportunity insight' })
  }
}