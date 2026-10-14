import {
  getAnomalyDetectionMetrics,
  getCategoryTrendMetrics,
  getSavingsOpportunityMetrics,
  getSpendingSummaryMetrics,
} from '../analytics/dashboardAnalyticsService.js'
import { Insight } from '../../models/Insight.js'
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

function buildAnomalyDetectionContext(metrics) {
  return {
    anomalyDetection: metrics,
  }
}

function buildAnomalyDetectionPrompt(context) {
  return {
    system:
      'You are a financial insights assistant. Return only valid JSON with title, summary, and severity for an anomaly detection insight.',
    user: `Generate an anomaly detection insight from this data: ${JSON.stringify(context.anomalyDetection)}`,
  }
}

function validateAnomalyDetectionInsight(payload) {
  return Boolean(payload?.title && payload?.summary && payload?.severity)
}

function getFallbackAnomalyDetectionInsight() {
  return {
    title: 'Anomaly detection unavailable',
    summary: 'Anomaly detection insight could not be generated right now.',
    severity: 'low',
  }
}

function formatAnomalyDetectionInsight(insight) {
  return {
    cardType: 'anomaly-detection',
    title: insight.title,
    summary: insight.summary,
    severity: insight.severity,
  }
}

function buildSavingsOpportunityContext(metrics) {
  return {
    savingsOpportunity: metrics,
  }
}

function buildSavingsOpportunityPrompt(context) {
  return {
    system:
      'You are a financial insights assistant. Return only valid JSON with title, summary, and severity for a savings opportunity insight.',
    user: `Generate a savings opportunity insight from this data: ${JSON.stringify(context.savingsOpportunity)}`,
  }
}

function validateSavingsOpportunityInsight(payload) {
  return Boolean(payload?.title && payload?.summary && payload?.severity)
}

function getFallbackSavingsOpportunityInsight() {
  return {
    title: 'Savings opportunity unavailable',
    summary: 'Savings opportunity insight could not be generated right now.',
    severity: 'low',
  }
}

function formatSavingsOpportunityInsight(insight) {
  return {
    cardType: 'savings-opportunity',
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

export async function getAnomalyDetectionInsight(userId = 'riya-demo') {
  const metrics = await getAnomalyDetectionMetrics(userId)
  const context = buildAnomalyDetectionContext(metrics)
  const prompt = buildAnomalyDetectionPrompt(context)

  try {
    const insight = await generateJsonCompletion({ prompt, context })
    const validatedInsight = validateAnomalyDetectionInsight(insight) ? insight : getFallbackAnomalyDetectionInsight()

    return formatAnomalyDetectionInsight(validatedInsight)
  } catch (error) {
    console.error('Failed to generate anomaly detection insight:', error)
    return formatAnomalyDetectionInsight(getFallbackAnomalyDetectionInsight())
  }
}

export async function getSavingsOpportunityInsight(userId = 'riya-demo') {
  const metrics = await getSavingsOpportunityMetrics(userId)
  const context = buildSavingsOpportunityContext(metrics)
  const prompt = buildSavingsOpportunityPrompt(context)

  try {
    const insight = await generateJsonCompletion({ prompt, context })
    const validatedInsight = validateSavingsOpportunityInsight(insight) ? insight : getFallbackSavingsOpportunityInsight()

    return formatSavingsOpportunityInsight(validatedInsight)
  } catch (error) {
    console.error('Failed to generate savings opportunity insight:', error)
    return formatSavingsOpportunityInsight(getFallbackSavingsOpportunityInsight())
  }
}

export async function getAllInsights(userId = 'riya-demo') {
  const [summary, categoryTrend, anomaly, savingsOpportunity] = await Promise.all([
    getSpendingSummaryInsight(userId),
    getCategoryTrendInsight(userId),
    getAnomalyDetectionInsight(userId),
    getSavingsOpportunityInsight(userId),
  ])

  return {
    tabs: ['Overview', 'Savings', 'Alerts'],
    activeTab: 'Overview',
    insights: [summary, categoryTrend, anomaly, savingsOpportunity],
    generatedAt: new Date().toISOString(),
  }
}

function buildInsightDocument(userId, insight, generatedAt) {
  return {
    userId,
    cardType: insight.cardType,
    title: insight.title,
    summary: insight.summary,
    severity: insight.severity,
    source: process.env.LLM_PROVIDER === 'mock' ? 'mock' : 'ai',
    generatedAt,
    metadata: {},
  }
}

export async function refreshInsights(userId = 'riya-demo') {
  const generatedAt = new Date()
  const payload = await getAllInsights(userId)

  await Promise.all(
    payload.insights.map((insight) =>
      Insight.findOneAndUpdate(
        { userId, cardType: insight.cardType },
        buildInsightDocument(userId, insight, generatedAt),
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      ),
    ),
  )

  return {
    ...payload,
    generatedAt: generatedAt.toISOString(),
    source: process.env.LLM_PROVIDER === 'mock' ? 'mock' : 'ai',
  }
}

export async function getStoredInsights(userId = 'riya-demo') {
  const storedInsights = await Insight.find({ userId }).sort({ createdAt: 1 }).lean()

  if (storedInsights.length === 0) {
    return refreshInsights(userId)
  }

  const latestGeneratedAt = storedInsights.reduce((latest, insight) => {
    if (!latest || new Date(insight.generatedAt) > new Date(latest)) {
      return insight.generatedAt
    }

    return latest
  }, null)

  return {
    tabs: ['Overview', 'Savings', 'Alerts'],
    activeTab: 'Overview',
    insights: storedInsights.map((insight) => ({
      cardType: insight.cardType,
      title: insight.title,
      summary: insight.summary,
      severity: insight.severity,
      source: insight.source,
    })),
    generatedAt: latestGeneratedAt,
    source: storedInsights[0]?.source || 'mock',
  }
}