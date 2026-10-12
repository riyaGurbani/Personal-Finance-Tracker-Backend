import { Expense } from '../../models/Expense.js'

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return { start, end }
}

function getPreviousMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1)
  const end = new Date(date.getFullYear(), date.getMonth(), 1)
  return { start, end }
}

export async function getSpendingSummaryMetrics(userId = 'riya-demo') {
  const currentMonth = getMonthRange()
  const previousMonth = getPreviousMonthRange()

  const [currentMonthExpenses, previousMonthExpenses] = await Promise.all([
    Expense.find({
      userId,
      date: { $gte: currentMonth.start, $lt: currentMonth.end },
    }),
    Expense.find({
      userId,
      date: { $gte: previousMonth.start, $lt: previousMonth.end },
    }),
  ])

  const totalSpend = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const previousMonthSpend = previousMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  const categoryTotals = currentMonthExpenses.reduce((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount
    return totals
  }, {})

  const [topCategory, topCategorySpend] = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || [
    'N/A',
    0,
  ]

  const monthGrowth =
    previousMonthSpend === 0
      ? totalSpend > 0
        ? 100
        : 0
      : Number((((totalSpend - previousMonthSpend) / previousMonthSpend) * 100).toFixed(2))

  return {
    totalSpend: Number(totalSpend.toFixed(2)),
    previousMonthSpend: Number(previousMonthSpend.toFixed(2)),
    monthGrowth,
    topCategory,
    topCategorySpend: Number(topCategorySpend.toFixed(2)),
    currency: 'INR',
    transactionCount: currentMonthExpenses.length,
    period: {
      currentMonthStart: currentMonth.start,
      currentMonthEnd: currentMonth.end,
      previousMonthStart: previousMonth.start,
      previousMonthEnd: previousMonth.end,
    },
  }
}

export async function getCategoryTrendMetrics(userId = 'riya-demo') {
  const currentMonth = getMonthRange()
  const previousMonth = getPreviousMonthRange()

  const [currentMonthExpenses, previousMonthExpenses] = await Promise.all([
    Expense.find({
      userId,
      date: { $gte: currentMonth.start, $lt: currentMonth.end },
    }),
    Expense.find({
      userId,
      date: { $gte: previousMonth.start, $lt: previousMonth.end },
    }),
  ])

  const currentCategoryTotals = currentMonthExpenses.reduce((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount
    return totals
  }, {})

  const previousCategoryTotals = previousMonthExpenses.reduce((totals, expense) => {
    totals[expense.category] = (totals[expense.category] || 0) + expense.amount
    return totals
  }, {})

  const categories = [...new Set([...Object.keys(currentCategoryTotals), ...Object.keys(previousCategoryTotals)])]

  const categoryTrends = categories.map((category) => {
    const currentSpend = currentCategoryTotals[category] || 0
    const previousSpend = previousCategoryTotals[category] || 0
    const changeAmount = currentSpend - previousSpend
    const changePercent =
      previousSpend === 0
        ? currentSpend > 0
          ? 100
          : 0
        : Number((((currentSpend - previousSpend) / previousSpend) * 100).toFixed(2))

    return {
      category,
      currentSpend: Number(currentSpend.toFixed(2)),
      previousSpend: Number(previousSpend.toFixed(2)),
      changeAmount: Number(changeAmount.toFixed(2)),
      changePercent,
    }
  })

  const topTrend = categoryTrends.sort((a, b) => Math.abs(b.changeAmount) - Math.abs(a.changeAmount))[0] || {
    category: 'N/A',
    currentSpend: 0,
    previousSpend: 0,
    changeAmount: 0,
    changePercent: 0,
  }

  return {
    topTrend,
    categoryTrends,
    currency: 'INR',
    period: {
      currentMonthStart: currentMonth.start,
      currentMonthEnd: currentMonth.end,
      previousMonthStart: previousMonth.start,
      previousMonthEnd: previousMonth.end,
    },
  }
}