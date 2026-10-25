import {
  getAnomalyDetectionMetrics,
  getCategoryTrendMetrics,
  getSavingsOpportunityMetrics,
  getSpendingSummaryMetrics,
} from '../../analytics/dashboardAnalyticsService.js'
import { retrieveKnowledgeBaseContext } from './vectorKnowledgeBaseService.js'

function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

function buildExpenseContextSections({ summary, categoryTrend, anomalyDetection, savingsOpportunity }) {
  const sections = []

  sections.push(
    `Current month spend: ${formatCurrency(summary.totalSpend, summary.currency)} across ${summary.transactionCount} transactions. Previous month: ${formatCurrency(summary.previousMonthSpend, summary.currency)}. Month-over-month change: ${summary.monthGrowth}%. Top category: ${summary.topCategory} (${formatCurrency(summary.topCategorySpend, summary.currency)}).`,
  )

  if (categoryTrend.topTrend?.category && categoryTrend.topTrend.category !== 'N/A') {
    sections.push(
      `Largest category movement: ${categoryTrend.topTrend.category} changed by ${formatCurrency(categoryTrend.topTrend.changeAmount, categoryTrend.currency)} (${categoryTrend.topTrend.changePercent}%) compared with last month.`,
    )
  }

  if (anomalyDetection.anomaly) {
    sections.push(
      `Potential anomaly: ${anomalyDetection.anomaly.merchant} in ${anomalyDetection.anomaly.category} for ${formatCurrency(anomalyDetection.anomaly.amount, anomalyDetection.currency)} on ${new Date(anomalyDetection.anomaly.date).toLocaleDateString('en-IN')}. This is ${anomalyDetection.anomaly.deviationPercent}% above the recent average transaction amount of ${formatCurrency(anomalyDetection.averageAmount, anomalyDetection.currency)}.`,
    )
  }

  if (savingsOpportunity.opportunity) {
    sections.push(
      `Savings opportunity: ${savingsOpportunity.opportunity.merchant} in ${savingsOpportunity.opportunity.category} totals ${formatCurrency(savingsOpportunity.opportunity.totalSpend, savingsOpportunity.currency)} this month across ${savingsOpportunity.opportunity.transactionCount} transactions. Estimated 15% savings opportunity: ${formatCurrency(savingsOpportunity.opportunity.potentialSavings, savingsOpportunity.currency)}.`,
    )
  }

  return sections
}

function buildKnowledgeSection(documents) {
  if (!documents.length) {
    return 'No matching knowledge-base documents were found for this question.'
  }

  return documents
    .map(
      (document, index) =>
        `${index + 1}. ${document.title} [${document.source}] - ${document.excerpt}`,
    )
    .join('\n')
}

function buildAssistantPrompt({ message, expenseSections, knowledgeDocuments }) {
  return [
    'You are an AI assistant for a personal finance tracker.',
    'Answer using the provided finance context and retrieved knowledge-base snippets.',
    'Be concise, practical, and specific. If the answer uses retrieved knowledge, mention the source names naturally.',
    'If the user asks for advice, ground it in the spending data first and then use the knowledge snippets for guidance.',
    '',
    'Expense context:',
    ...expenseSections.map((section) => `- ${section}`),
    '',
    'Retrieved knowledge:',
    buildKnowledgeSection(knowledgeDocuments),
    '',
    `User question: ${message}`,
  ].join('\n')
}

function buildFallbackAnswer({ message, summary, categoryTrend, anomalyDetection, savingsOpportunity, knowledgeDocuments }) {
  const normalized = message.toLowerCase()

  if (normalized.includes('save')) {
    const opportunity = savingsOpportunity.opportunity
    if (opportunity) {
      return `Your best savings opportunity this month is ${opportunity.merchant}. You spent ${formatCurrency(opportunity.totalSpend, savingsOpportunity.currency)} there across ${opportunity.transactionCount} transactions, so trimming that by 15% could save about ${formatCurrency(opportunity.potentialSavings, savingsOpportunity.currency)}.`
    }
  }

  if (normalized.includes('anomaly') || normalized.includes('unusual') || normalized.includes('large')) {
    if (anomalyDetection.anomaly) {
      return `A notable recent expense is ${anomalyDetection.anomaly.merchant} in ${anomalyDetection.anomaly.category} for ${formatCurrency(anomalyDetection.anomaly.amount, anomalyDetection.currency)}. That is ${anomalyDetection.anomaly.deviationPercent}% above your recent average transaction amount.`
    }
  }

  if (normalized.includes('category') || normalized.includes('trend')) {
    if (categoryTrend.topTrend?.category && categoryTrend.topTrend.category !== 'N/A') {
      return `${categoryTrend.topTrend.category} shows the biggest month-over-month movement, changing by ${formatCurrency(categoryTrend.topTrend.changeAmount, categoryTrend.currency)} (${categoryTrend.topTrend.changePercent}%).`
    }
  }

  const knowledgeSuffix = knowledgeDocuments.length
    ? ` I also found relevant guidance in ${knowledgeDocuments.map((document) => document.source).join(', ')}.`
    : ''

  return `This month you have spent ${formatCurrency(summary.totalSpend, summary.currency)} across ${summary.transactionCount} transactions, with ${summary.topCategory} as the top category at ${formatCurrency(summary.topCategorySpend, summary.currency)}.${knowledgeSuffix}`
}

export async function buildAssistantRagContext({ message, userId = 'riya-demo' }) {
  const [summary, categoryTrend, anomalyDetection, savingsOpportunity, retrievalResult] = await Promise.all([
    getSpendingSummaryMetrics(userId),
    getCategoryTrendMetrics(userId),
    getAnomalyDetectionMetrics(userId),
    getSavingsOpportunityMetrics(userId),
    retrieveKnowledgeBaseContext(message),
  ])

  const knowledgeDocuments = retrievalResult.matches

  const expenseSections = buildExpenseContextSections({
    summary,
    categoryTrend,
    anomalyDetection,
    savingsOpportunity,
  })

  return {
    userId,
    summary,
    categoryTrend,
    anomalyDetection,
    savingsOpportunity,
    knowledgeDocuments,
    embeddingModel: retrievalResult.embeddingModel,
    expenseSections,
    prompt: buildAssistantPrompt({ message, expenseSections, knowledgeDocuments }),
    fallbackAnswer: buildFallbackAnswer({
      message,
      summary,
      categoryTrend,
      anomalyDetection,
      savingsOpportunity,
      knowledgeDocuments,
    }),
  }
}
