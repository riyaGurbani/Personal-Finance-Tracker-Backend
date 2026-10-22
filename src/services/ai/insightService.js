import {
  getAnomalyDetectionMetrics,
  getCategoryTrendMetrics,
  getSavingsOpportunityMetrics,
  getSpendingSummaryMetrics,
} from '../analytics/dashboardAnalyticsService.js'
import { Insight } from '../../models/Insight.js'
import { buildSpendingSummaryContext } from './context/buildSpendingSummaryContext.js'
import { categorizeExpense } from './expenseCategorizationService.js'
import { formatSpendingSummaryInsight } from './formatters/spendingSummaryFormatter.js'
import { generateJsonCompletion, getLlmHealth, getLlmProviderSource } from './llmClient.js'
import { buildSpendingSummaryPrompt } from './prompts/spendingSummaryPrompt.js'
import {
  getFallbackSpendingSummaryInsight,
  validateSpendingSummaryInsight,
} from './validators/spendingSummaryValidator.js'

function getInsightProvider(source) {
  return source === 'mock' ? 'mock' : process.env.LLM_PROVIDER || 'mock'
}

function normalizeInsightResponse(insight, generatedAt) {
  const type = insight.type || insight.cardType
  const source = insight.source || getLlmProviderSource()
  const provider = insight.provider || getInsightProvider(source)
  const fallbackUsed = insight.fallbackUsed ?? source === 'mock'

  return {
    id: type,
    type,
    cardType: type,
    title: insight.title,
    summary: insight.summary,
    severity: insight.severity,
    source,
    provider,
    fallbackUsed,
    generatedAt: generatedAt ? new Date(generatedAt).toISOString() : null,
    metadata: insight.metadata || {},
  }
}

function buildInsightsPayload(insights, generatedAt) {
  const normalizedInsights = insights.map((insight) => normalizeInsightResponse(insight, generatedAt))
  const hasAiInsight = normalizedInsights.some((insight) => insight.source === 'ai')
  const hasFallback = normalizedInsights.some((insight) => insight.fallbackUsed)

  return {
    tabs: ['Overview', 'Savings', 'Alerts'],
    activeTab: 'Overview',
    insights: normalizedInsights,
    generatedAt: generatedAt ? new Date(generatedAt).toISOString() : null,
    source: hasAiInsight ? 'ai' : 'mock',
    provider: hasAiInsight ? normalizedInsights.find((insight) => insight.source === 'ai')?.provider || getInsightProvider('ai') : 'mock',
    fallbackUsed: hasFallback,
  }
}

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

async function getCachedInsight(userId, cardType) {
  const cachedInsight = await Insight.findOne({ userId, cardType }).lean()

  if (!cachedInsight) {
    return null
  }

  return normalizeInsightResponse(cachedInsight, cachedInsight.generatedAt)
}

async function generateInsightWithFallback({
  userId,
  cardType,
  context,
  prompt,
  validate,
  getFallback,
  format,
  errorLabel,
}) {
  try {
    const insight = await generateJsonCompletion({ prompt, context })
    const validatedInsight = validate(insight) ? insight : getFallback()
    return normalizeInsightResponse(
      {
        ...format(validatedInsight),
        source: getLlmProviderSource(),
        provider: getInsightProvider(getLlmProviderSource()),
        fallbackUsed: false,
      },
      new Date(),
    )
  } catch (error) {
    console.error(`Failed to generate ${errorLabel}:`, error)

    const cachedInsight = await getCachedInsight(userId, cardType)
    if (cachedInsight) {
      return cachedInsight
    }

    return {
      ...normalizeInsightResponse(
        {
          ...format(getFallback()),
          source: 'mock',
          provider: 'mock',
          fallbackUsed: true,
        },
        new Date(),
      ),
    }
  }
}

export async function getSpendingSummaryInsight(userId = 'riya-demo') {
  const metrics = await getSpendingSummaryMetrics(userId)
  const context = buildSpendingSummaryContext(metrics)
  const prompt = buildSpendingSummaryPrompt(context)

  return generateInsightWithFallback({
    userId,
    cardType: 'summary',
    context,
    prompt,
    validate: validateSpendingSummaryInsight,
    getFallback: getFallbackSpendingSummaryInsight,
    format: formatSpendingSummaryInsight,
    errorLabel: 'spending summary insight',
  })
}

export async function getCategoryTrendInsight(userId = 'riya-demo') {
  const metrics = await getCategoryTrendMetrics(userId)
  const context = buildCategoryTrendContext(metrics)
  const prompt = buildCategoryTrendPrompt(context)

  return generateInsightWithFallback({
    userId,
    cardType: 'category-trend',
    context,
    prompt,
    validate: validateCategoryTrendInsight,
    getFallback: getFallbackCategoryTrendInsight,
    format: formatCategoryTrendInsight,
    errorLabel: 'category trend insight',
  })
}

export async function getAnomalyDetectionInsight(userId = 'riya-demo') {
  const metrics = await getAnomalyDetectionMetrics(userId)
  const context = buildAnomalyDetectionContext(metrics)
  const prompt = buildAnomalyDetectionPrompt(context)

  return generateInsightWithFallback({
    userId,
    cardType: 'anomaly-detection',
    context,
    prompt,
    validate: validateAnomalyDetectionInsight,
    getFallback: getFallbackAnomalyDetectionInsight,
    format: formatAnomalyDetectionInsight,
    errorLabel: 'anomaly detection insight',
  })
}

export async function getSavingsOpportunityInsight(userId = 'riya-demo') {
  const metrics = await getSavingsOpportunityMetrics(userId)
  const context = buildSavingsOpportunityContext(metrics)
  const prompt = buildSavingsOpportunityPrompt(context)

  return generateInsightWithFallback({
    userId,
    cardType: 'savings-opportunity',
    context,
    prompt,
    validate: validateSavingsOpportunityInsight,
    getFallback: getFallbackSavingsOpportunityInsight,
    format: formatSavingsOpportunityInsight,
    errorLabel: 'savings opportunity insight',
  })
}

export async function getAllInsights(userId = 'riya-demo') {
  const [summary, categoryTrend, anomaly, savingsOpportunity] = await Promise.all([
    getSpendingSummaryInsight(userId),
    getCategoryTrendInsight(userId),
    getAnomalyDetectionInsight(userId),
    getSavingsOpportunityInsight(userId),
  ])
  return buildInsightsPayload([summary, categoryTrend, anomaly, savingsOpportunity], new Date())
}

function buildInsightDocument(userId, insight, generatedAt) {
  const normalizedInsight = normalizeInsightResponse(insight, generatedAt)

  return {
    userId,
    cardType: normalizedInsight.cardType,
    title: normalizedInsight.title,
    summary: normalizedInsight.summary,
    severity: normalizedInsight.severity,
    source: normalizedInsight.source,
    provider: normalizedInsight.provider,
    fallbackUsed: normalizedInsight.fallbackUsed,
    generatedAt,
    metadata: normalizedInsight.metadata,
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

  return buildInsightsPayload(payload.insights, generatedAt)
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

  return buildInsightsPayload(storedInsights, latestGeneratedAt)
}

export { getLlmHealth }
export { categorizeExpense }