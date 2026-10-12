import { Expense } from '../models/Expense.js'

function buildExpenseFilters(query) {
  const filters = {}

  if (query.userId) {
    filters.userId = query.userId
  }

  if (query.category) {
    filters.category = query.category
  }

  if (query.paymentMethod) {
    filters.paymentMethod = query.paymentMethod
  }

  if (query.search) {
    filters.$or = [
      { merchant: { $regex: query.search, $options: 'i' } },
      { category: { $regex: query.search, $options: 'i' } },
      { notes: { $regex: query.search, $options: 'i' } },
    ]
  }

  if (query.from || query.to) {
    filters.date = {}

    if (query.from) {
      filters.date.$gte = new Date(query.from)
    }

    if (query.to) {
      filters.date.$lte = new Date(query.to)
    }
  }

  return filters
}

function buildSort(sortBy = 'date', order = 'desc') {
  const allowedSortFields = new Set(['date', 'amount', 'merchant', 'category', 'createdAt'])
  const sortField = allowedSortFields.has(sortBy) ? sortBy : 'date'
  const sortOrder = order === 'asc' ? 1 : -1

  return { [sortField]: sortOrder }
}

function formatExpense(expense) {
  return {
    id: expense._id.toString(),
    merchant: expense.merchant,
    category: expense.category,
    amount: expense.amount,
    currency: expense.currency,
    date: expense.date,
    paymentMethod: expense.paymentMethod,
    notes: expense.notes,
    userId: expense.userId,
    source: expense.source,
    isRecurring: expense.isRecurring,
    isAiCategorized: expense.isAiCategorized,
    aiCategorySuggestion: expense.aiCategorySuggestion,
    aiCategoryConfidence: expense.aiCategoryConfidence,
    aiCategoryReason: expense.aiCategoryReason,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  }
}

export async function getExpenses(req, res) {
  try {
    const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1)
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '10', 10), 1), 100)
    const skip = (page - 1) * limit

    const filters = buildExpenseFilters(req.query)
    const sort = buildSort(req.query.sortBy, req.query.order)

    const [expenses, total] = await Promise.all([
      Expense.find(filters).sort(sort).skip(skip).limit(limit),
      Expense.countDocuments(filters),
    ])

    res.json({
      items: expenses.map(formatExpense),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch expenses:', error)
    res.status(500).json({ message: 'Failed to load expenses' })
  }
}

export async function createExpense(req, res) {
  try {
    const {
      merchant,
      category,
      amount,
      currency,
      date,
      paymentMethod,
      notes,
      userId,
      source,
      isRecurring,
      isAiCategorized,
      aiCategorySuggestion,
      aiCategoryConfidence,
      aiCategoryReason,
    } = req.body

    if (!merchant || !category || amount === undefined || !date) {
      return res.status(400).json({
        message: 'merchant, category, amount, and date are required',
      })
    }

    const parsedAmount = Number(amount)
    if (Number.isNaN(parsedAmount)) {
      return res.status(400).json({ message: 'amount must be a valid number' })
    }

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'date must be a valid date' })
    }

    const expense = await Expense.create({
      merchant,
      category,
      amount: parsedAmount,
      currency: currency || 'INR',
      date: parsedDate,
      paymentMethod: paymentMethod || '',
      notes: notes || '',
      userId: userId || 'riya-demo',
      source: source || 'manual',
      isRecurring: Boolean(isRecurring),
      isAiCategorized: Boolean(isAiCategorized),
      aiCategorySuggestion: aiCategorySuggestion || null,
      aiCategoryConfidence:
        aiCategoryConfidence === undefined || aiCategoryConfidence === null
          ? null
          : Number(aiCategoryConfidence),
      aiCategoryReason: aiCategoryReason || null,
    })

    res.status(201).json({ item: formatExpense(expense) })
  } catch (error) {
    console.error('Failed to create expense:', error)
    res.status(500).json({ message: 'Failed to create expense' })
  }
}