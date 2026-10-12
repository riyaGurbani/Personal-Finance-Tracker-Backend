function buildMockSummaryInsight(context) {
  const { totalSpend, monthGrowth, topCategory } = context.spendingSummary
  const direction = monthGrowth > 0 ? 'increased' : monthGrowth < 0 ? 'decreased' : 'remained stable'
  const absoluteGrowth = Math.abs(monthGrowth)
  const growthText = monthGrowth === 0 ? 'with no change from last month' : `by ${absoluteGrowth}% compared to last month`

  return {
    title: monthGrowth > 10 ? 'Spending Increased' : monthGrowth < 0 ? 'Spending Reduced' : 'Spending Stable',
    summary: `Total spending ${direction} ${growthText}. Current spend is ₹${totalSpend.toFixed(2)}, with ${topCategory} as the top category.`,
    severity: monthGrowth > 15 ? 'high' : monthGrowth > 5 ? 'medium' : 'low',
  }
}

function buildMockCategoryTrendInsight(context) {
  const { category, changePercent, currentSpend, changeAmount } = context.categoryTrend.topTrend
  const direction = changeAmount > 0 ? 'up' : changeAmount < 0 ? 'down' : 'stable'
  const title =
    direction === 'up'
      ? `${category} is trending up`
      : direction === 'down'
        ? `${category} is trending down`
        : `${category} is stable`

  return {
    title,
    summary:
      direction === 'stable'
        ? `${category} spending is stable this month at ₹${currentSpend.toFixed(2)}.`
        : `Spending in ${category} is ${direction} by ${Math.abs(changePercent)}% compared to last month. Current spend is ₹${currentSpend.toFixed(2)}.` ,
    severity: Math.abs(changePercent) > 25 ? 'high' : Math.abs(changePercent) > 10 ? 'medium' : 'low',
  }
}

export async function generateJsonCompletion({ prompt, context }) {
  const provider = process.env.LLM_PROVIDER || 'mock'

  if (provider === 'mock') {
    if (context.categoryTrend) {
      return buildMockCategoryTrendInsight(context)
    }

    return buildMockSummaryInsight(context)
  }

  throw new Error(`Unsupported LLM provider: ${provider}. Configure a real provider or use mock.`)
}