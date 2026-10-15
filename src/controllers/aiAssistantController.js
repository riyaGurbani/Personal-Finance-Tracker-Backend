import { Expense } from '../models/Expense.js'

function formatCurrency(amount) {
  return `₹${amount.toFixed(2)}`
}

export async function handleAssistantQuery(req, res) {
  try {
    const { question } = req.body || {}

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        answer:
          'Please ask a clear question about your expenses, such as "How much did I spend on dining this month?".',
      })
    }

    const normalized = question.toLowerCase().trim()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Greeting / intro
    const greetingWords = ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening']
    const isGreeting = greetingWords.some((word) => normalized.startsWith(word) || normalized === word)

    if (isGreeting) {
      return res.json({
        answer:
          'Hi, I am your AI expense assistant for this personal finance tracker. I can analyze your recorded expenses, highlight large or unusual transactions, and suggest savings improvements. Try asking:\n\n- How much did I spend on food this month?\n- Show large expenses from the last 30 days.\n- What can I do to improve my savings rate?',
      })
    }

    // Knowledge / "what should I know" questions
    if (
      normalized.includes('what should i know') ||
      normalized.includes('knowledge') ||
      normalized.includes('what do i need to know') ||
      normalized.includes('finance tracker')
    ) {
      return res.json({
        answer:
          'To get the most value from this finance tracker, focus on three things:\n\n1. Categorizing expenses consistently (e.g., Food, Transport, Shopping) so the dashboard and AI insights stay accurate.\n2. Reviewing trends and large expenses at least weekly to catch unusual spending.\n3. Using the AI assistant to ask targeted questions about your spending (food, large expenses, savings) instead of checking each transaction manually.',
      })
    }

    let answer =
      "I couldn't match your question to a known expense analysis pattern yet. Try asking about dining/food, large or unusual expenses, or savings."

    // Broader pattern detection
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

    // Pattern 1: dining/food this month
    if (isDiningQuestion) {
      const diningExpenses = await Expense.find({
        category: { $in: ['Dining', 'Restaurant', 'Food', 'Groceries'] },
        date: { $gte: startOfMonth },
      })

      const totalDining = diningExpenses.reduce((sum, exp) => sum + exp.amount, 0)

      answer =
        diningExpenses.length === 0
          ? 'You have no recorded dining or food-related expenses for this month so far.'
          : `You have spent ${formatCurrency(totalDining)} on dining and food this month across ${diningExpenses.length} transactions.`
    }

    // Pattern 2: unusual / large expenses last 30 days
    else if (isUnusualQuestion) {
      const recent = await Expense.find({ date: { $gte: last30Days } }).sort({ amount: -1 }).limit(5)
      if (!recent.length) {
        answer = 'No expenses found in the last 30 days to analyze for unusual or large transactions.'
      } else {
        const top = recent[0]
        answer = `One of your largest recent expenses is ${formatCurrency(top.amount)} at ${top.merchant} in the "${top.category}" category. Consider reviewing this and similar high-value transactions to see if they align with your priorities.`
      }
    }

    // Pattern 3: savings rate guidance (simple rule-based)
    else if (isSavingsQuestion) {
      const recent = await Expense.find({ date: { $gte: last30Days } })
      const totalRecent = recent.reduce((sum, exp) => sum + exp.amount, 0)

      answer =
        totalRecent < 10000
          ? 'Your spending in the last 30 days is relatively modest. You could consider increasing your monthly savings target or investing a portion of your surplus income.'
          : 'Your spending in the last 30 days is substantial. Review your top categories and try to reduce non-essential expenses by 10–15% to improve your savings rate.'
    }

    return res.json({ answer })
  } catch (error) {
    console.error('Error in AI assistant controller:', error)
    return res.status(500).json({
      answer: 'Something went wrong while analyzing your expenses. Please try again.',
    })
  }
}
