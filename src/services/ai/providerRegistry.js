import { LlmClientError } from './llmClient.js'

const PROVIDER_LABELS = {
  mock: 'Mock',
  ollama: 'Ollama',
  portai: 'PortAI',
}

const ALLOWED_PROVIDERS = Object.freeze(['mock', 'ollama', 'portai'])

function createMockProvider() {
  return {
    id: 'mock',
    label: PROVIDER_LABELS.mock,
    async isAvailable() {
      return true
    },
    async chat({ message, context }) {
      return {
        answer: await context.generateMockAnswer(message),
        provider: 'mock',
        source: 'mock',
        fallbackUsed: false,
      }
    },
  }
}

function createOllamaProvider() {
  return {
    id: 'ollama',
    label: PROVIDER_LABELS.ollama,
    async isAvailable(context) {
      const health = await context.getOllamaAvailability()
      return health.available
    },
    async chat({ message, context }) {
      return context.generateOllamaAnswer(message)
    },
  }
}

function createPortAiProvider() {
  return {
    id: 'portai',
    label: PROVIDER_LABELS.portai,
    async isAvailable(context) {
      return context.isPortAiConfigured()
    },
    async chat({ message, context }) {
      return context.generatePortAiAnswer(message)
    },
  }
}

const providers = {
  mock: createMockProvider(),
  ollama: createOllamaProvider(),
  portai: createPortAiProvider(),
}

function normalizeProviderId(providerId) {
  return typeof providerId === 'string' ? providerId.trim().toLowerCase() : ''
}

export function isAllowedProvider(providerId) {
  return ALLOWED_PROVIDERS.includes(normalizeProviderId(providerId))
}

export function getProvider(providerId) {
  const normalizedProviderId = normalizeProviderId(providerId)

  if (!isAllowedProvider(normalizedProviderId)) {
    throw new LlmClientError('Invalid AI provider selected.', 'INVALID_PROVIDER')
  }

  return providers[normalizedProviderId]
}

export function getProviderStatuses() {
  return Object.values(providers).map((provider) => ({
    id: provider.id,
    label: provider.label,
  }))
}

export { ALLOWED_PROVIDERS, PROVIDER_LABELS, providers }
