export function formatSpendingSummaryInsight(insight) {
  return {
    cardType: 'summary',
    title: insight.title,
    summary: insight.summary,
    severity: insight.severity,
  }
}