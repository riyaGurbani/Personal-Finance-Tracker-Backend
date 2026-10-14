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

export async function getAnomalyDetectionMetrics(userId = 'riya-demo') {
  const recentExpenses = await Expense.find({ userId }).sort({ date: -1 }).limit(20).lean()

  if (recentExpenses.length === 0) {
    return {
      anomaly: null,
      averageAmount: 0,
      thresholdMultiplier: 2,
      sampleSize: 0,
      currency: 'INR',
    }
  }

  const averageAmount = recentExpenses.reduce((sum, expense) => sum + expense.amount, 0) / recentExpenses.length
  const thresholdMultiplier = 2
  const anomalyCandidate = recentExpenses.find((expense) => expense.amount >= averageAmount * thresholdMultiplier) || recentExpenses[0]
  const deviationPercent =
    averageAmount === 0 ? 0 : Number((((anomalyCandidate.amount - averageAmount) / averageAmount) * 100).toFixed(2))

  return {
    anomaly: {
      merchant: anomalyCandidate.merchant,
      category: anomalyCandidate.category,
      amount: Number(anomalyCandidate.amount.toFixed(2)),
      date: anomalyCandidate.date,
      deviationPercent,
    },
    averageAmount: Number(averageAmount.toFixed(2)),
    thresholdMultiplier,
    sampleSize: recentExpenses.length,
    currency: anomalyCandidate.currency || 'INR',
  }
}

export async function getSavingsOpportunityMetrics(userId = 'riya-demo') {
  const currentMonth = getMonthRange()
  const currentMonthExpenses = await Expense.find({
    userId,
    date: { $gte: currentMonth.start, $lt: currentMonth.end },
  }).lean()

  if (currentMonthExpenses.length === 0) {
    return {
      opportunity: null,
      currency: 'INR',
      transactionCount: 0,
    }
  }

  const merchantTotals = currentMonthExpenses.reduce((totals, expense) => {
    const key = expense.merchant
    if (!totals[key]) {
      totals[key] = {
        merchant: expense.merchant,
        category: expense.category,
        totalSpend: 0,
        transactionCount: 0,
      }
    }

    totals[key].totalSpend += expense.amount
    totals[key].transactionCount += 1
    return totals
  }, {})

  const rankedMerchants = Object.values(merchantTotals)
    .map((merchant) => ({
      ...merchant,
      totalSpend: Number(merchant.totalSpend.toFixed(2)),
      averageSpend: Number((merchant.totalSpend / merchant.transactionCount).toFixed(2)),
      potentialSavings: Number((merchant.totalSpend * 0.15).toFixed(2)),
    }))
    .sort((a, b) => b.potentialSavings - a.potentialSavings)

  return {
    opportunity: rankedMerchants[0] || null,
    merchants: rankedMerchants,
    currency: currentMonthExpenses[0]?.currency || 'INR',
    transactionCount: currentMonthExpenses.length,
  }
}