import { getAssistantProviderStatuses, getAssistantResponse } from '../services/ai/assistantProviderService.js'
import { isAllowedProvider } from '../services/ai/providerRegistry.js'

function mapErrorToResponse(error) {
  if (error.code === 'INVALID_PROVIDER') {
    return { status: 400, message: 'Invalid AI provider selected.' }
  }

  if (error.code === 'PROVIDER_UNAVAILABLE') {
    return { status: 503, message: error.message || 'Selected AI provider is unavailable.' }
  }

  if (error.code === 'TIMEOUT') {
    return { status: 504, message: 'The AI provider timed out. Please try again.' }
  }

  if (error.code === 'AUTH_ERROR') {
    return { status: 401, message: 'The AI provider authentication failed.' }
  }

  return { status: 500, message: 'Something went wrong while processing the AI request.' }
}

export async function getAiProviderStatus(req, res) {
  try {
    const payload = await getAssistantProviderStatuses()
    res.json(payload)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load AI provider status.' })
  }
}

export async function handleAiChat(req, res) {
  try {
    const { provider = 'mock', message } = req.body || {}

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        message: 'A valid message is required.',
      })
    }

    if (!isAllowedProvider(provider)) {
      return res.status(400).json({
        message: 'Invalid AI provider selected.',
      })
    }

    const response = await getAssistantResponse({ providerId: provider, message })
    return res.json(response)
  } catch (error) {
    const mappedError = mapErrorToResponse(error)
    return res.status(mappedError.status).json({ message: mappedError.message })
  }
}
