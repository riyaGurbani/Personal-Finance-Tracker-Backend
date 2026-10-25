import { Expense } from '../../models/Expense.js'
import { getProvider, getProviderStatuses } from './providerRegistry.js'
import {
  LlmClientError,
  checkOllamaAvailability,
  generateAssistantResponseWithOllama,
  generateAssistantResponseWithPortAi,
  isPortAiConfigured,
  isPortAiEmbeddingConfigured,
} from './llmClient.js'
import { buildAssistantRagContext } from './rag/assistantRagService.js'

function formatCurrency(amount) {
  return `₹${amount.toFixed(2)}`
}

function buildGreetingAnswer() {
  return 'Hi, I am your AI expense assistant for this personal finance tracker. I can analyze your recorded expenses, highlight large or unusual transactions, and suggest savings improvements. Try asking:\n\n- How much did I spend on food this month?\n- Show large expenses from the last 30 days.\n- What can I do to improve my savings rate?'
}

function buildKnowledgeAnswer() {
  return 'To get the most value from this finance tracker, focus on three things:\n\n1. Categorizing expenses consistently (e.g., Food, Transport, Shopping) so the dashboard and AI insights stay accurate.\n2. Reviewing trends and large expenses at least weekly to catch unusual spending.\n3. Using the AI assistant to ask targeted questions about your spending (food, large expenses, savings) instead of checking each transaction manually.'
}

async function buildRuleBasedAnswer(question) {
  const normalized = question.toLowerCase().trim()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const greetingWords = ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening']
  const isGreeting = greetingWords.some((word) => normalized.startsWith(word) || normalized === word)

  if (isGreeting) {
    return buildGreetingAnswer()
  }

  if (
    normalized.includes('what should i know') ||
    normalized.includes('knowledge') ||
    normalized.includes('what do i need to know') ||
    normalized.includes('finance tracker')
  ) {
    return buildKnowledgeAnswer()
  }

  const isDiningQuestion =
    normalized.includes('dining') ||
    normalized.includes('restaurant') ||
    normalized.includes('food') ||
    (normalized.includes('spend') && normalized.includes('eat'))

  const isUnusualQuestion =
    normalized.includes('unusual') ||
    normalized.includes('outlier') ||
    normalized.includes('large') ||
    normalized.includes('big') ||
    normalized.includes('highest') ||
    normalized.includes('largest')

  const isSavingsQuestion =
    normalized.includes('savings') ||
    normalized.includes('save') ||
    normalized.includes('saving') ||
    normalized.includes('improve my savings') ||
    normalized.includes('increase my savings')

  if (isDiningQuestion) {
    const diningExpenses = await Expense.find({
      category: { $in: ['Dining', 'Restaurant', 'Food', 'Groceries'] },
      date: { $gte: startOfMonth },
    })

    const totalDining = diningExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    return diningExpenses.length === 0
      ? 'You have no recorded dining or food-related expenses for this month so far.'
      : `You have spent ${formatCurrency(totalDining)} on dining and food this month across ${diningExpenses.length} transactions.`
  }

  if (isUnusualQuestion) {
    const recent = await Expense.find({ date: { $gte: last30Days } }).sort({ amount: -1 }).limit(5)

    if (!recent.length) {
      return 'No expenses found in the last 30 days to analyze for unusual or large transactions.'
    }

    const top = recent[0]
    return `One of your largest recent expenses is ${formatCurrency(top.amount)} at ${top.merchant} in the "${top.category}" category. Consider reviewing this and similar high-value transactions to see if they align with your priorities.`
  }

  if (isSavingsQuestion) {
    const recent = await Expense.find({ date: { $gte: last30Days } })
    const totalRecent = recent.reduce((sum, exp) => sum + exp.amount, 0)

    return totalRecent < 10000
      ? 'Your spending in the last 30 days is relatively modest. You could consider increasing your monthly savings target or investing a portion of your surplus income.'
      : 'Your spending in the last 30 days is substantial. Review your top categories and try to reduce non-essential expenses by 10–15% to improve your savings rate.'
  }

  return "I couldn't match your question to a known expense analysis pattern yet. Try asking about dining/food, large or unusual expenses, or savings."
}

async function getProviderContext() {
  return {
    generateMockAnswer: buildRuleBasedAnswer,
    generateOllamaAnswer: generateAssistantResponseWithOllama,
    generatePortAiAnswer: generateAssistantResponseWithPortAi,
    getOllamaAvailability: checkOllamaAvailability,
    isPortAiConfigured,
    isPortAiEmbeddingConfigured,
  }
}

function buildRagMetadata(ragContext, providerId) {
  return {
    summary: {
      totalSpend: ragContext.summary.totalSpend,
      transactionCount: ragContext.summary.transactionCount,
      topCategory: ragContext.summary.topCategory,
      topCategorySpend: ragContext.summary.topCategorySpend,
      monthGrowth: ragContext.summary.monthGrowth,
      currency: ragContext.summary.currency,
    },
    retrieval: {
      knowledgeMatches: ragContext.knowledgeDocuments,
      expenseContextSections: ragContext.expenseSections,
      embeddingModel: ragContext.embeddingModel,
      generationProvider: providerId,
      retrievalMode: 'shared-rag',
    },
  }
}

function buildProviderStatus(provider, context, available) {
  const baseStatus = {
    id: provider.id,
    label: provider.label,
    available,
  }

  if (provider.id === 'mock') {
    return {
      ...baseStatus,
      generationMode: 'mock',
      retrievalMode: 'shared-rag',
      embeddingAvailable: context.isPortAiEmbeddingConfigured(),
      embeddingModel: context.isPortAiEmbeddingConfigured() ? 'portai' : 'hash-fallback',
    }
  }

  if (provider.id === 'ollama') {
    return {
      ...baseStatus,
      generationMode: 'ollama',
      retrievalMode: 'shared-rag',
      embeddingAvailable: context.isPortAiEmbeddingConfigured(),
      embeddingModel: context.isPortAiEmbeddingConfigured() ? 'portai' : 'hash-fallback',
    }
  }

  if (provider.id === 'portai') {
    return {
      ...baseStatus,
      generationMode: 'portai',
      retrievalMode: 'shared-rag',
      embeddingAvailable: context.isPortAiEmbeddingConfigured(),
      embeddingModel: context.isPortAiEmbeddingConfigured() ? 'portai' : 'hash-fallback',
    }
  }

  return baseStatus
}

export async function getAssistantProviderStatuses() {
  const context = await getProviderContext()
  const statuses = await Promise.all(
    getProviderStatuses().map(async (provider) => {
      const available = await getProvider(provider.id).isAvailable(context)
      return buildProviderStatus(provider, context, available)
    }),
  )

  return { providers: statuses }
}

export async function getAssistantResponse({ providerId, message, userId = 'riya-demo' }) {
  const provider = getProvider(providerId)
  const context = await getProviderContext()
  const available = await provider.isAvailable(context)

  if (!available) {
    throw new LlmClientError(`${provider.label} is currently unavailable.`, 'PROVIDER_UNAVAILABLE')
  }

  const ragContext = await buildAssistantRagContext({ message, userId })

  let result
  if (providerId === 'mock') {
    result = {
      answer: ragContext.fallbackAnswer,
      provider: 'mock',
      source: 'mock',
      fallbackUsed: false,
    }
  } else {
    result = await provider.chat({ message: ragContext.prompt, context })
  }

  return {
    answer: result.answer,
    provider: result.provider,
    source: result.source,
    fallbackUsed: Boolean(result.fallbackUsed),
    rag: buildRagMetadata(ragContext, providerId),
  }
}
