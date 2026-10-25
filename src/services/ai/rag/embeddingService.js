import crypto from 'crypto'
import { generateEmbeddingWithPortAi, isPortAiEmbeddingConfigured } from '../llmClient.js'

const FALLBACK_DIMENSIONS = 128

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function tokenize(value) {
  return normalizeText(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

function buildHashEmbedding(text, dimensions = FALLBACK_DIMENSIONS) {
  const vector = new Array(dimensions).fill(0)
  const tokens = tokenize(text)

  if (!tokens.length) {
    return vector
  }

  for (const token of tokens) {
    const digest = crypto.createHash('sha256').update(token).digest()
    const bucket = digest[0] % dimensions
    const sign = digest[1] % 2 === 0 ? 1 : -1
    vector[bucket] += sign
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map((value) => Number((value / magnitude).toFixed(8)))
}

export function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || right.length === 0) {
    return 0
  }

  const length = Math.min(left.length, right.length)
  let dot = 0
  let leftMagnitude = 0
  let rightMagnitude = 0

  for (let index = 0; index < length; index += 1) {
    const leftValue = Number(left[index]) || 0
    const rightValue = Number(right[index]) || 0
    dot += leftValue * rightValue
    leftMagnitude += leftValue * leftValue
    rightMagnitude += rightValue * rightValue
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude))
}

export async function generateEmbedding(text) {
  if (isPortAiEmbeddingConfigured()) {
    try {
      const embedding = await generateEmbeddingWithPortAi(text)
      return {
        embedding,
        model: 'portai',
      }
    } catch {
      // Fall back so Mock and Ollama remain usable even when PortAI embeddings are unavailable.
    }
  }

  return {
    embedding: buildHashEmbedding(text),
    model: 'hash-fallback',
  }
}
