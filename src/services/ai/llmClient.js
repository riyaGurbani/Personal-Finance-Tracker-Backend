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

function buildMockAnomalyInsight(context) {
  const { anomaly, averageAmount } = context.anomalyDetection

  if (!anomaly) {
    return {
      title: 'No unusual spending detected',
      summary: 'Recent transactions are within the expected spending range.',
      severity: 'low',
    }
  }

  return {
    title: 'Unusual high-value expense detected',
    summary: `A ₹${anomaly.amount.toFixed(2)} ${anomaly.category} transaction at ${anomaly.merchant} is significantly above your recent average transaction amount of ₹${averageAmount.toFixed(2)}.`,
    severity: anomaly.deviationPercent > 150 ? 'high' : anomaly.deviationPercent > 75 ? 'medium' : 'low',
  }
}

function buildMockSavingsOpportunityInsight(context) {
  const { opportunity } = context.savingsOpportunity

  if (!opportunity) {
    return {
      title: 'No savings opportunity identified',
      summary: 'There is not enough spending data yet to identify a savings opportunity.',
      severity: 'low',
    }
  }

  return {
    title: `Savings opportunity in ${opportunity.category}`,
    summary: `You spent ₹${opportunity.totalSpend.toFixed(2)} at ${opportunity.merchant} this month across ${opportunity.transactionCount} transactions. Reducing this by 15% could save about ₹${opportunity.potentialSavings.toFixed(2)}.`,
    severity: opportunity.potentialSavings > 500 ? 'high' : opportunity.potentialSavings > 200 ? 'medium' : 'low',
  }
}

function buildMockExpenseCategorization(context) {
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

function buildMockInsight(context) {
  if (context.expenseCategorization) {
    return buildMockExpenseCategorization(context)
  }

  if (context.savingsOpportunity) {
    return buildMockSavingsOpportunityInsight(context)
  }

  if (context.anomalyDetection) {
    return buildMockAnomalyInsight(context)
  }

  if (context.categoryTrend) {
    return buildMockCategoryTrendInsight(context)
  }

  return buildMockSummaryInsight(context)
}

class LlmClientError extends Error {
  constructor(message, code, details = {}) {
    super(message)
    this.name = 'LlmClientError'
    this.code = code
    this.details = details
  }
}

function isAiDebugEnabled() {
  return process.env.AI_DEBUG_LOGS === 'true'
}

function truncateForLog(value, maxLength = 1200) {
  if (typeof value !== 'string') {
    return value
  }

  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength)}... [truncated ${value.length - maxLength} chars]`
}

function logAiDebug(message, details) {
  if (!isAiDebugEnabled()) {
    return
  }

  if (details === undefined) {
    console.log(`[AI DEBUG] ${message}`)
    return
  }

  console.log(`[AI DEBUG] ${message}`, details)
}

function getProvider() {
  return (process.env.LLM_PROVIDER || 'mock').trim().toLowerCase()
}

function getPortAiConfig() {
  return {
    providerName: (process.env.PORTAI_PROVIDER_NAME || 'portkey').trim(),
    baseUrl: (process.env.PORTAI_BASE_URL || '').trim().replace(/\/$/, ''),
    apiKey: (process.env.PORTAI_API_KEY || '').trim(),
    model: (process.env.PORTAI_MODEL || '').trim(),
    timeoutMs: Number(process.env.PORTAI_TIMEOUT_MS || 20000),
    maxTokens: Number(process.env.PORTAI_MAX_TOKENS || 512),
    healthEndpoint: (process.env.PORTAI_HEALTH_ENDPOINT || '/models').trim(),
    // PortAI/Portkey specific configuration (optional and configurable via .env)
    chatEndpoint: (process.env.PORTAI_CHAT_ENDPOINT || '/chat/completions').trim(),
    // Header customization
    authHeader: (process.env.PORTAI_AUTH_HEADER || 'Authorization').trim(),
    authScheme: (process.env.PORTAI_AUTH_SCHEME || 'Bearer').trim(),
    virtualKeyHeader: (process.env.PORTAI_VIRTUAL_KEY_HEADER || 'x-portkey-virtual-key').trim(),
    virtualKey: (process.env.PORTAI_VIRTUAL_KEY || '').trim(),
    // Payload field names (some gateways expect different keys)
    modelField: (process.env.PORTAI_MODEL_FIELD || 'model').trim(),
    messagesField: (process.env.PORTAI_MESSAGES_FIELD || 'messages').trim(),
    providerField: (process.env.PORTAI_PROVIDER_FIELD || 'provider').trim(),
    provider: (process.env.PORTAI_PROVIDER || '').trim(),
  }
}

function getOllamaConfig() {
  return {
    baseUrl: (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
    model: process.env.OLLAMA_MODEL || 'qwen2.5',
    timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS || 20000),
  }
}

function normalizeModelName(modelName) {
  return typeof modelName === 'string' ? modelName.trim().toLowerCase() : ''
}

function matchesConfiguredModel(availableModel, configuredModel) {
  const normalizedAvailable = normalizeModelName(availableModel)
  const normalizedConfigured = normalizeModelName(configuredModel)

  return (
    normalizedAvailable === normalizedConfigured ||
    normalizedAvailable.startsWith(`${normalizedConfigured}:`)
  )
}

export async function logLlmStartupStatus() {
  const provider = getProvider()

  if (provider === 'ollama') {
    try {
      const health = await getLlmHealth()
      const connectionLabel = health.status === 'ok' ? 'connected' : health.status

      console.log(
        `[AI] Ollama ${connectionLabel} | model=${health.model} | baseUrl=${health.baseUrl}${health.fallbackProvider ? ` | fallback=${health.fallbackProvider}` : ''}`,
      )
      return
    } catch (error) {
      console.warn(`[AI] Ollama connection check failed: ${error.message}`)
      return
    }
  }

  if (provider === 'portai') {
    const config = getPortAiConfig()
    console.log(`[AI] PortAI configured: ${Boolean(config.baseUrl && config.apiKey && config.model)}`)
    return
  }

  console.log(`[AI] Provider configured: ${provider}`)
}

function buildOllamaRequestBody(prompt) {
  return {
    model: getOllamaConfig().model,
    stream: false,
    format: 'json',
    options: {
      temperature: 0.2,
    },
    messages: [
      {
        role: 'system',
        content: prompt.system,
      },
      {
        role: 'user',
        content: prompt.user,
      },
    ],
  }
}

function extractJsonObject(rawContent) {
  if (typeof rawContent !== 'string' || rawContent.trim().length === 0) {
    throw new LlmClientError('LLM returned empty content.', 'EMPTY_RESPONSE')
  }

  const trimmed = rawContent.trim()

  try {
    console.log('Attempting to parse LLM response as JSON:', truncateForLog(trimmed))
    return JSON.parse(trimmed)
  } catch {
    const firstBrace = trimmed.indexOf('{')
    const lastBrace = trimmed.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new LlmClientError('LLM returned invalid JSON.', 'INVALID_JSON', {
        rawContent: trimmed,
      })
    }

    const candidate = trimmed.slice(firstBrace, lastBrace + 1)

    try {
      return JSON.parse(candidate)
    } catch {
      throw new LlmClientError('LLM returned invalid JSON.', 'INVALID_JSON', {
        rawContent: trimmed,
      })
    }
  }
}

async function fetchOllamaTags() {
  const config = getOllamaConfig()
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    logAiDebug('Checking Ollama connectivity.', {
      baseUrl: config.baseUrl,
      model: config.model,
      timeoutMs: config.timeoutMs,
    })

    const response = await fetch(`${config.baseUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new LlmClientError('Failed to fetch Ollama tags.', 'PROVIDER_ERROR', {
        status: response.status,
        body: errorText,
      })
    }

    const payload = await response.json()
    logAiDebug('Ollama connectivity check succeeded.', {
      availableModels: Array.isArray(payload?.models)
        ? payload.models.map((entry) => entry?.name || entry?.model).filter(Boolean)
        : [],
    })

    return payload
  } catch (error) {
    logAiDebug('Ollama connectivity check failed.', {
      code: error.code,
      message: error.message,
    })

    if (error.name === 'AbortError') {
      throw new LlmClientError('Ollama health check timed out.', 'TIMEOUT', {
        timeoutMs: config.timeoutMs,
      })
    }

    if (error instanceof LlmClientError) {
      throw error
    }

    throw new LlmClientError('Failed to reach Ollama.', 'PROVIDER_ERROR', {
      cause: error.message,
    })
  } finally {
    clearTimeout(timeoutHandle)
  }
}

async function generateWithOllama(prompt) {
  const config = getOllamaConfig()
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs)
  const requestBody = buildOllamaRequestBody(prompt)

  try {
    logAiDebug('Sending Ollama chat request.', {
      baseUrl: `${config.baseUrl}/api/chat`,
      model: config.model,
      request: {
        ...requestBody,
        messages: requestBody.messages.map((message) => ({
          ...message,
          content: truncateForLog(message.content),
        })),
      },
    })

    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new LlmClientError('Ollama request failed.', 'PROVIDER_ERROR', {
        status: response.status,
        body: errorText,
      })
    }

    const payload = await response.json()
    const content = payload?.message?.content
    logAiDebug('Received Ollama chat response.', {
      model: payload?.model || config.model,
      done: payload?.done,
      rawContent: truncateForLog(content),
    })

    const parsed = extractJsonObject(content)
    logAiDebug('Parsed Ollama JSON response.', parsed)

    return parsed
  } catch (error) {
    logAiDebug('Ollama chat request failed.', {
      code: error.code,
      message: error.message,
      details: error.details,
    })

    if (error.name === 'AbortError') {
      throw new LlmClientError('Ollama request timed out.', 'TIMEOUT', {
        timeoutMs: config.timeoutMs,
      })
    }

    if (error instanceof LlmClientError) {
      throw error
    }

    throw new LlmClientError('Failed to call Ollama.', 'PROVIDER_ERROR', {
      cause: error.message,
    })
  } finally {
    clearTimeout(timeoutHandle)
  }
}

export async function generateJsonCompletion({ prompt, context }) {
  const provider = getProvider()
  logAiDebug('Generating JSON completion.', {
    provider,
    contextKeys: Object.keys(context || {}),
  })

  if (provider === 'mock') {
    logAiDebug('Using mock provider for JSON completion.')
    return buildMockInsight(context)
  }

  if (provider === 'ollama') {
    try {
      return await generateWithOllama(prompt)
    } catch (error) {
      console.warn('Ollama unavailable. Falling back to mock insight generation.', {
        code: error.code,
        message: error.message,
      })
      logAiDebug('Falling back to mock provider after Ollama failure.')
      return buildMockInsight(context)
    }
  }

  if (provider === 'portai') {
    try {
      const answer = await generateAssistantResponseWithPortAi(prompt.user)
      return extractJsonObject(answer.answer)
    } catch (error) {
      console.warn('PortAI unavailable. Falling back to mock insight generation.', {
        code: error.code,
        message: error.message,
      })
      logAiDebug('Falling back to mock provider after PortAI failure.')
      return buildMockInsight(context)
    }
  }

  throw new Error(`Unsupported LLM provider: ${provider}. Configure a real provider or use mock.`)
}

export function getLlmProviderSource() {
  return getProvider() === 'mock' ? 'mock' : 'ai'
}

async function fetchPortAiModels() {
  const config = getPortAiConfig()

  if (!isPortAiConfigured()) {
    throw new LlmClientError('PortAI is currently unavailable.', 'PROVIDER_UNAVAILABLE')
  }

  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(`${config.baseUrl}${config.healthEndpoint}`, {
      method: 'GET',
      headers: buildPortAiHeaders(config),
      signal: controller.signal,
    })

    if (response.status === 401 || response.status === 403) {
      throw new LlmClientError('PortAI authentication failed.', 'AUTH_ERROR')
    }

    if (!response.ok) {
      throw new LlmClientError('PortAI health check failed.', 'PROVIDER_ERROR', {
        status: response.status,
      })
    }

    return response.json()
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new LlmClientError('PortAI health check timed out.', 'TIMEOUT')
    }

    if (error instanceof LlmClientError) {
      throw error
    }

    throw new LlmClientError('Failed to reach PortAI.', 'PROVIDER_ERROR')
  } finally {
    clearTimeout(timeoutHandle)
  }
}

function extractPortAiModels(payload) {
  const models = Array.isArray(payload?.data)
    ? payload.data.map((entry) => entry?.id).filter(Boolean)
    : Array.isArray(payload?.models)
      ? payload.models.map((entry) => entry?.id || entry?.name || entry?.model).filter(Boolean)
      : []

  return models
}

async function getPortAiHealth() {
  const config = getPortAiConfig()
  const configured = isPortAiConfigured()

  if (!configured) {
    return {
      provider: 'portai',
      status: 'error',
      configured: false,
      baseUrl: config.baseUrl || null,
      model: config.model || 'unconfigured',
      modelInstalled: false,
      availableModels: [],
      message: 'PortAI is not fully configured.',
    }
  }

  try {
    const payload = await fetchPortAiModels()
    const availableModels = extractPortAiModels(payload)
    const modelInstalled = availableModels.includes(config.model)

    return {
      provider: 'portai',
      status: modelInstalled ? 'ok' : 'degraded',
      configured: true,
      baseUrl: config.baseUrl,
      model: config.model,
      modelInstalled,
      availableModels,
      healthEndpoint: config.healthEndpoint,
      message: modelInstalled ? 'PortAI is reachable and the configured model is available.' : 'PortAI is reachable but the configured model was not found in the model list.',
    }
  } catch (error) {
    return {
      provider: 'portai',
      status: 'degraded',
      configured: true,
      baseUrl: config.baseUrl,
      model: config.model,
      modelInstalled: false,
      availableModels: [],
      healthEndpoint: config.healthEndpoint,
      message: 'PortAI is configured but the health check failed.',
      errorCode: error.code || 'PROVIDER_ERROR',
    }
  }
}

export async function getLlmHealth() {
  const provider = getProvider()
  logAiDebug('Checking LLM health.', { provider })

  if (provider === 'mock') {
    return {
      provider,
      status: 'ok',
      configured: true,
      model: 'mock',
    }
  }

  if (provider === 'ollama') {
    const config = getOllamaConfig()

    try {
      const tagsPayload = await fetchOllamaTags()
      const models = Array.isArray(tagsPayload?.models) ? tagsPayload.models : []
      const availableModels = models.map((entry) => entry?.name || entry?.model).filter(Boolean)
      const modelInstalled = availableModels.some((modelName) => matchesConfiguredModel(modelName, config.model))

      return {
        provider,
        status: modelInstalled ? 'ok' : 'degraded',
        configured: true,
        fallbackProvider: 'mock',
        baseUrl: config.baseUrl,
        model: config.model,
        modelInstalled,
        availableModels,
      }
    } catch (error) {
      return {
        provider,
        status: 'degraded',
        configured: true,
        fallbackProvider: 'mock',
        baseUrl: config.baseUrl,
        model: config.model,
        modelInstalled: false,
        availableModels: [],
        message: 'Ollama is unavailable. Backend will fall back to mock insights.',
        errorCode: error.code || 'PROVIDER_ERROR',
      }
    }
  }

  if (provider === 'portai') {
    return getPortAiHealth()
  }

  return {
    provider,
    status: 'error',
    configured: false,
  }
}

export async function getLlmHealthForProvider(providerId) {
  if (providerId === 'mock') {
    return {
      provider: 'mock',
      status: 'ok',
      configured: true,
      model: 'mock',
    }
  }

  if (providerId === 'ollama') {
    const config = getOllamaConfig()

    try {
      const tagsPayload = await fetchOllamaTags()
      const models = Array.isArray(tagsPayload?.models) ? tagsPayload.models : []
      const availableModels = models.map((entry) => entry?.name || entry?.model).filter(Boolean)
      const modelInstalled = availableModels.some((modelName) => matchesConfiguredModel(modelName, config.model))

      return {
        provider: 'ollama',
        status: modelInstalled ? 'ok' : 'degraded',
        configured: true,
        model: config.model,
      }
    } catch (error) {
      return {
        provider: 'ollama',
        status: 'degraded',
        configured: true,
        model: config.model,
      }
    }
  }

  if (providerId === 'portai') {
    const configured = isPortAiConfigured()
    const config = getPortAiConfig()
    console.log("Checking PortAI health for providerId 'portai'. Configured:", configured, "Base URL:", config.baseUrl, "Model:", config.model)

    return {
      provider: 'portai',
      status: configured ? 'degraded' : 'error',
      configured,
      model: configured ? config.model : 'unconfigured',
    }
  }

  return {
    provider: providerId,
    status: 'error',
    configured: false,
  }
}

export async function checkOllamaAvailability() {
  const health = await getLlmHealthForProvider('ollama')
  return {
    available: health.status === 'ok',
  }
}

export async function generateAssistantResponseWithOllama(message) {
  const config = getOllamaConfig()
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        stream: false,
        messages: [
          {
            role: 'system',
            content: 'You are a concise personal finance assistant. Answer using the user spending context already available in the backend and do not mention hidden configuration.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new LlmClientError('Ollama request failed.', 'PROVIDER_ERROR', {
        status: response.status,
      })
    }

    const payload = await response.json()
    const answer = payload?.message?.content?.trim()

    if (!answer) {
      throw new LlmClientError('Ollama returned an empty response.', 'EMPTY_RESPONSE')
    }

    return {
      answer,
      provider: 'ollama',
      source: 'ai',
      fallbackUsed: false,
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new LlmClientError('Ollama request timed out.', 'TIMEOUT')
    }

    if (error instanceof LlmClientError) {
      throw error
    }

    throw new LlmClientError('Failed to call Ollama.', 'PROVIDER_ERROR')
  } finally {
    clearTimeout(timeoutHandle)
  }
}

function buildPortAiHeaders(config) {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (config.apiKey) {
    // Use configured auth header & scheme
    headers[config.authHeader] = `${config.authScheme} ${config.apiKey}`
  }

  if (config.virtualKey) {
    headers[config.virtualKeyHeader] = config.virtualKey
  }

  return headers
}

function buildPortAiRequestBody(message, config) {
  const messages = [
    {
      role: 'system',
      content: 'You are a concise personal finance assistant. Answer clearly and do not expose backend configuration.',
    },
    {
      role: 'user',
      content: message,
    },
  ]

  const body = {}
  body[config.messagesField] = messages
  body[config.modelField] = config.model
  // Standardize token field to a common name expected by many LLM endpoints
  body.max_tokens = config.maxTokens

  // Some gateways require an upstream provider id in the payload
  if (config.provider) {
    body[config.providerField] = config.provider
  }

  return body
}

function extractPortAiAnswer(payload) {
  const answer = payload?.choices?.[0]?.message?.content || payload?.message?.content || payload?.answer || ''

  if (typeof answer !== 'string' || !answer.trim()) {
    throw new LlmClientError('PortAI returned an empty response.', 'EMPTY_RESPONSE')
  }

  return answer.trim()
}

export async function generateAssistantResponseWithPortAi(message) {
  const config = getPortAiConfig()

  if (!isPortAiConfigured()) {
    throw new LlmClientError('PortAI is currently unavailable.', 'PROVIDER_UNAVAILABLE')
  }

  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const response = await fetch(`${config.baseUrl}${config.chatEndpoint}`, {
      method: 'POST',
      headers: buildPortAiHeaders(config),
      body: JSON.stringify(buildPortAiRequestBody(message, config)),
      signal: controller.signal,
    })

    if (response.status === 401 || response.status === 403) {
      throw new LlmClientError('PortAI authentication failed.', 'AUTH_ERROR')
    }

    if (!response.ok) {
      throw new LlmClientError('PortAI request failed.', 'PROVIDER_ERROR', {
        status: response.status,
      })
    }

    const payload = await response.json()
    const answer = extractPortAiAnswer(payload)

    // Attempt to surface a request id from response headers for diagnostics
    const requestIdHeaderCandidates = ['x-request-id', 'request-id', 'x-portkey-request-id', 'x-amzn-requestid']
    let requestId = null
    try {
      if (typeof response.headers?.get === 'function') {
        for (const h of requestIdHeaderCandidates) {
          const hv = response.headers.get(h)
          if (hv) {
            requestId = hv
            break
          }
        }
      }
    } catch (e) {
      // ignore header parsing errors
    }

    return {
      answer,
      provider: 'portai',
      source: 'ai',
      fallbackUsed: false,
      _diagnostics: {
        status: response.status,
        model: config.model,
        requestId: requestId || null,
      },
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new LlmClientError('PortAI request timed out.', 'TIMEOUT')
    }

    if (error instanceof LlmClientError) {
      throw error
    }

    throw new LlmClientError('Failed to call PortAI.', 'PROVIDER_ERROR')
  } finally {
    clearTimeout(timeoutHandle)
  }
}

export function isPortAiConfigured() {
  const config = getPortAiConfig()
  return Boolean(config.baseUrl && config.apiKey && config.model)
}

export { LlmClientError }