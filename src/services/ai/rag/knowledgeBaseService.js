import { promises as fs } from 'fs'
import path from 'path'

const KNOWLEDGE_BASE_DIR = path.resolve(process.cwd(), 'src', 'data', 'knowledge-base')
const SUPPORTED_EXTENSIONS = new Set(['.md', '.txt', '.json'])

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function tokenize(value) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1)
}

function scoreDocument(queryTokens, document) {
  if (!queryTokens.length) {
    return 0
  }

  const tokenCounts = new Map()
  for (const token of document.tokens) {
    tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1)
  }

  let score = 0
  for (const token of queryTokens) {
    score += tokenCounts.get(token) || 0
  }

  if (document.titleTokens.some((token) => queryTokens.includes(token))) {
    score += 2
  }

  return score
}

async function readKnowledgeBaseFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await readKnowledgeBaseFiles(fullPath)))
      continue
    }

    if (SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath)
    }
  }

  return files
}

function buildDocumentsFromJson(filePath, parsed) {
  if (Array.isArray(parsed)) {
    return parsed.map((item, index) => ({
      id: `${path.basename(filePath)}#${index + 1}`,
      title: item.title || item.question || `Entry ${index + 1}`,
      content: typeof item === 'string' ? item : JSON.stringify(item),
      source: path.relative(KNOWLEDGE_BASE_DIR, filePath),
    }))
  }

  if (parsed && typeof parsed === 'object') {
    return [
      {
        id: path.basename(filePath),
        title: parsed.title || parsed.name || path.basename(filePath),
        content: JSON.stringify(parsed, null, 2),
        source: path.relative(KNOWLEDGE_BASE_DIR, filePath),
      },
    ]
  }

  return []
}

async function loadKnowledgeBaseDocuments() {
  try {
    const files = await readKnowledgeBaseFiles(KNOWLEDGE_BASE_DIR)
    const documents = []

    for (const filePath of files) {
      const extension = path.extname(filePath).toLowerCase()
      const raw = await fs.readFile(filePath, 'utf8')

      if (extension === '.json') {
        try {
          const parsed = JSON.parse(raw)
          documents.push(...buildDocumentsFromJson(filePath, parsed))
        } catch {
          documents.push({
            id: path.basename(filePath),
            title: path.basename(filePath),
            content: raw,
            source: path.relative(KNOWLEDGE_BASE_DIR, filePath),
          })
        }
        continue
      }

      documents.push({
        id: path.basename(filePath),
        title: path.basename(filePath, extension),
        content: raw,
        source: path.relative(KNOWLEDGE_BASE_DIR, filePath),
      })
    }

    return documents.map((document) => ({
      ...document,
      excerpt: normalizeWhitespace(document.content).slice(0, 280),
      tokens: tokenize(`${document.title} ${document.content}`),
      titleTokens: tokenize(document.title),
    }))
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

let knowledgeBaseCache = null

async function getKnowledgeBaseDocuments() {
  if (!knowledgeBaseCache) {
    knowledgeBaseCache = await loadKnowledgeBaseDocuments()
  }

  return knowledgeBaseCache
}

export async function retrieveKnowledgeBaseContext(query, limit = 3) {
  const documents = await getKnowledgeBaseDocuments()
  const queryTokens = tokenize(query)

  return documents
    .map((document) => ({
      ...document,
      score: scoreDocument(queryTokens, document),
    }))
    .filter((document) => document.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ id, title, source, excerpt, score }) => ({ id, title, source, excerpt, score }))
}

export function clearKnowledgeBaseCache() {
  knowledgeBaseCache = null
}
