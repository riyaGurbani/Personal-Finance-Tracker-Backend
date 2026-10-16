import {
  getAllInsights,
  getAnomalyDetectionInsight,
  categorizeExpense,
  getCategoryTrendInsight,
  getLlmHealth,
  getStoredInsights,
  refreshInsights,
  getSavingsOpportunityInsight,
  getSpendingSummaryInsight,
} from '../services/ai/insightService.js'
import { ALLOWED_CATEGORIES } from '../services/ai/expenseCategorizationService.js'

export async function getAiHealth(req, res) {
  try {
    const health = await getLlmHealth()
    res.status(health.status === 'error' ? 500 : 200).json(health)
  } catch (error) {
    console.error('Failed to load AI health:', error)
    res.status(500).json({
      provider: process.env.LLM_PROVIDER || 'mock',
      status: 'error',
      message: 'Failed to load AI health',
    })
  }
}

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

export async function categorizeExpenseSuggestion(req, res) {
  try {
    const { merchant, amount, currency, notes, paymentMethod } = req.body

    if (!merchant || amount === undefined) {
      return res.status(400).json({
        message: 'merchant and amount are required',
        allowedCategories: ALLOWED_CATEGORIES,
      })
    }

    const parsedAmount = Number(amount)
    if (Number.isNaN(parsedAmount)) {
      return res.status(400).json({
        message: 'amount must be a valid number',
        allowedCategories: ALLOWED_CATEGORIES,
      })
    }

    const suggestion = await categorizeExpense({
      merchant,
      amount: parsedAmount,
      currency,
      notes,
      paymentMethod,
    })

    res.json({
      ...suggestion,
      allowedCategories: ALLOWED_CATEGORIES,
    })
  } catch (error) {
    console.error('Failed to categorize expense:', error)
    res.status(500).json({ message: 'Failed to categorize expense' })
  }
}