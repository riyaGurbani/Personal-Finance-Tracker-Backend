import { getCategoryTrendMetrics, getSpendingSummaryMetrics } from '../analytics/dashboardAnalyticsService.js'
import { buildSpendingSummaryContext } from './context/buildSpendingSummaryContext.js'
import { formatSpendingSummaryInsight } from './formatters/spendingSummaryFormatter.js'
import { generateJsonCompletion } from './llmClient.js'
import { buildSpendingSummaryPrompt } from './prompts/spendingSummaryPrompt.js'
import {
  getFallbackSpendingSummaryInsight,
  validateSpendingSummaryInsight,
} from './validators/spendingSummaryValidator.js'

function buildCategoryTrendContext(metrics) {
  return {
    categoryTrend: metrics,
  }
}

function buildCategoryTrendPrompt(context) {
  return {
    system:
      'You are a financial insights assistant. Return only valid JSON with title, summary, and severity for a category trend insight.',
    user: `Generate a category trend insight from this data: ${JSON.stringify(context.categoryTrend)}`,
  }
}

function validateCategoryTrendInsight(payload) {
  return Boolean(payload?.title && payload?.summary && payload?.severity)
}

function getFallbackCategoryTrendInsight() {
  return {
    title: 'Category trend unavailable',
    summary: 'Category trend insight could not be generated right now.',
    severity: 'low',
  }
}

function formatCategoryTrendInsight(insight) {
  return {
    cardType: 'category-trend',
    title: insight.title,
    summary: insight.summary,
    severity: insight.severity,
  }
}

export async function getSpendingSummaryInsight(userId = 'riya-demo') {
  const metrics = await getSpendingSummaryMetrics(userId)
  const context = buildSpendingSummaryContext(metrics)
  const prompt = buildSpendingSummaryPrompt(context)

  try {
    const insight = await generateJsonCompletion({ prompt, context })
    const validatedInsight = validateSpendingSummaryInsight(insight)
      ? insight
      : getFallbackSpendingSummaryInsight()

    return formatSpendingSummaryInsight(validatedInsight)
  } catch (error) {
    console.error('Failed to generate spending summary insight:', error)
    return formatSpendingSummaryInsight(getFallbackSpendingSummaryInsight())
  }
}

export async function getCategoryTrendInsight(userId = 'riya-demo') {
  const metrics = await getCategoryTrendMetrics(userId)
  const context = buildCategoryTrendContext(metrics)
  const prompt = buildCategoryTrendPrompt(context)

  try {
    const insight = await generateJsonCompletion({ prompt, context })
    const validatedInsight = validateCategoryTrendInsight(insight) ? insight : getFallbackCategoryTrendInsight()

    return formatCategoryTrendInsight(validatedInsight)
  } catch (error) {
    console.error('Failed to generate category trend insight:', error)
    return formatCategoryTrendInsight(getFallbackCategoryTrendInsight())
  }
}