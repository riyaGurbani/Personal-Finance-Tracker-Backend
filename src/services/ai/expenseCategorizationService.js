import { generateJsonCompletion, getLlmProviderSource } from './llmClient.js'

const ALLOWED_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transport',
  'Health',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Travel',
  'Education',
  'Personal Care',
  'Rent',
  'Salary',
  'Other',
]

function buildCategorizationContext(payload) {
  return {
    expenseCategorization: {
      merchant: payload.merchant,
      amount: payload.amount,
      currency: payload.currency || 'INR',
      notes: payload.notes || '',
      paymentMethod: payload.paymentMethod || '',
      allowedCategories: ALLOWED_CATEGORIES,
    },
  }
}

function buildCategorizationPrompt(context) {
  return {
    system:
      'You are a finance categorization assistant. Use only the supplied expense details. Return strict JSON only.',
    user: JSON.stringify({
      task: 'Categorize this expense into exactly one allowed category.',
      responseSchema: {
        category: ALLOWED_CATEGORIES.join(' | '),
        confidence: 'number between 0 and 1',
        reason: 'string',
      },
      rules: [
        'Choose exactly one category from allowedCategories.',
        'Do not invent merchant details.',
        'Keep reason concise and grounded in the input.',
      ],
      facts: context.expenseCategorization,
    }),
  }
}

function validateCategorizationResult(payload) {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  if (!ALLOWED_CATEGORIES.includes(payload.category)) {
    return false
  }

  if (typeof payload.reason !== 'string' || payload.reason.trim().length === 0) {
    return false
  }

  if (typeof payload.confidence !== 'number' || Number.isNaN(payload.confidence)) {
    return false
  }

  if (payload.confidence < 0 || payload.confidence > 1) {
    return false
  }

  return true
}

function getFallbackCategorization(context) {
  const merchant = (context.expenseCategorization?.merchant || '').toLowerCase()
  const notes = (context.expenseCategorization?.notes || '').toLowerCase()
  const combined = `${merchant} ${notes}`

  if (/(swiggy|zomato|restaurant|cafe|coffee|pizza|food)/.test(combined)) {
    return {
      category: 'Food & Dining',
      confidence: 0.88,
      reason: 'Merchant or notes indicate a dining-related purchase.',
    }
  }

  if (/(uber|ola|metro|fuel|petrol|diesel|taxi|bus|train)/.test(combined)) {
    return {
      category: 'Transport',
      confidence: 0.86,
      reason: 'Merchant or notes indicate transportation spending.',
    }
  }

  if (/(pharmacy|apollo|hospital|clinic|medical|doctor)/.test(combined)) {
    return {
      category: 'Health',
      confidence: 0.84,
      reason: 'Merchant or notes indicate a health-related expense.',
    }
  }

  if (/(grocery|mart|supermarket|fresh|basket)/.test(combined)) {
    return {
      category: 'Groceries',
      confidence: 0.82,
      reason: 'Merchant or notes indicate grocery spending.',
    }
  }

  return {
    category: 'Other',
    confidence: 0.55,
    reason: 'Not enough detail was available to assign a more specific category.',
  }
}

function formatCategorizationResult(result, source) {
  return {
    category: result.category,
    confidence: Number(result.confidence.toFixed(2)),
    reason: result.reason,
    source,
  }
}

export async function categorizeExpense(payload) {
  const context = buildCategorizationContext(payload)
  const prompt = buildCategorizationPrompt(context)

  try {
    const result = await generateJsonCompletion({ prompt, context })
    const normalized = validateCategorizationResult(result) ? result : getFallbackCategorization(context)
    return formatCategorizationResult(normalized, getLlmProviderSource())
  } catch (error) {
    console.error('Failed to categorize expense:', error)
    return formatCategorizationResult(getFallbackCategorization(context), 'mock')
  }
}

export { ALLOWED_CATEGORIES }