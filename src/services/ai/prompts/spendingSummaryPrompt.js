export function buildSpendingSummaryPrompt(context) {
  return {
    system:
      'You are a financial insights analyst. Use only the supplied facts. Do not invent numbers. Return strict JSON only.',
    user: JSON.stringify({
      task: 'Generate a spending summary insight for a dashboard card.',
      responseSchema: {
        title: 'string',
        summary: 'string',
        severity: 'low | medium | high',
      },
      facts: context,
    }),
  }
}