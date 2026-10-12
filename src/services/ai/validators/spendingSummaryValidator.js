const allowedSeverities = new Set(['low', 'medium', 'high'])

export function validateSpendingSummaryInsight(payload) {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  if (typeof payload.title !== 'string' || payload.title.trim().length === 0) {
    return false
  }

  if (typeof payload.summary !== 'string' || payload.summary.trim().length === 0) {
    return false
  }

  if (!allowedSeverities.has(payload.severity)) {
    return false
  }

  return true
}

export function getFallbackSpendingSummaryInsight() {
  return {
    title: 'Insight unavailable',
    summary: 'Unable to generate insight.',
    severity: 'low',
  }
}