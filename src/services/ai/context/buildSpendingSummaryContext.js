export function buildSpendingSummaryContext(metrics) {
  return {
    spendingSummary: {
      totalSpend: metrics.totalSpend,
      previousMonthSpend: metrics.previousMonthSpend,
      monthGrowth: metrics.monthGrowth,
      topCategory: metrics.topCategory,
      topCategorySpend: metrics.topCategorySpend,
      currency: metrics.currency,
      transactionCount: metrics.transactionCount,
    },
  }
}