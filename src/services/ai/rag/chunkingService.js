function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function estimateTokenCount(text) {
  return normalizeWhitespace(text).split(' ').filter(Boolean).length
}

export function chunkDocument({ documentId, title, source, content, maxWords = 140, overlapWords = 30 }) {
  const normalized = normalizeWhitespace(content)
  if (!normalized) {
    return []
  }

  const words = normalized.split(' ')
  const chunks = []
  let start = 0
  let chunkIndex = 0

  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length)
    const text = words.slice(start, end).join(' ')

    chunks.push({
      documentId,
      title,
      source,
      section: '',
      chunkIndex,
      text,
      tokenCount: estimateTokenCount(text),
    })

    if (end >= words.length) {
      break
    }

    start = Math.max(end - overlapWords, start + 1)
    chunkIndex += 1
  }

  return chunks
}
