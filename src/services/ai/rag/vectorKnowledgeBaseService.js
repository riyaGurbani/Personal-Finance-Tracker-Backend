import { promises as fs } from 'fs'
import path from 'path'
import { KnowledgeChunk } from '../../../models/KnowledgeChunk.js'
import { chunkDocument } from './chunkingService.js'
import { cosineSimilarity, generateEmbedding } from './embeddingService.js'

const KNOWLEDGE_BASE_DIR = path.resolve(process.cwd(), 'src', 'data', 'knowledge-base')
const SUPPORTED_EXTENSIONS = new Set(['.md', '.txt', '.json'])

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim()
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
      documentId: `${path.basename(filePath)}#${index + 1}`,
      title: item.title || item.question || `Entry ${index + 1}`,
      content: typeof item === 'string' ? item : JSON.stringify(item),
      source: path.relative(KNOWLEDGE_BASE_DIR, filePath),
    }))
  }

  if (parsed && typeof parsed === 'object') {
    return [
      {
        documentId: path.basename(filePath),
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
            documentId: path.basename(filePath),
            title: path.basename(filePath),
            content: raw,
            source: path.relative(KNOWLEDGE_BASE_DIR, filePath),
          })
        }
        continue
      }

      documents.push({
        documentId: path.basename(filePath),
        title: path.basename(filePath, extension),
        content: raw,
        source: path.relative(KNOWLEDGE_BASE_DIR, filePath),
      })
    }

    return documents
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

function buildExcerpt(text, maxLength = 280) {
  return normalizeWhitespace(text).slice(0, maxLength)
}

export async function ingestKnowledgeBaseToVectorStore() {
  const documents = await loadKnowledgeBaseDocuments()
  const chunkRecords = []
  let embeddingModel = 'hash-fallback'

  for (const document of documents) {
    const chunks = chunkDocument(document)
    for (const chunk of chunks) {
      const embeddingResult = await generateEmbedding(`${document.title}\n${chunk.text}`)
      embeddingModel = embeddingResult.model
      chunkRecords.push({
        ...chunk,
        embedding: embeddingResult.embedding,
        embeddingModel: embeddingResult.model,
        metadata: {
          sourceType: 'knowledge-base',
        },
      })
    }
  }

  if (chunkRecords.length === 0) {
    return { documents: 0, chunks: 0, embeddingModel }
  }

  await Promise.all(
    chunkRecords.map((chunk) =>
      KnowledgeChunk.findOneAndUpdate(
        { documentId: chunk.documentId, chunkIndex: chunk.chunkIndex },
        chunk,
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
      ),
    ),
  )

  return {
    documents: documents.length,
    chunks: chunkRecords.length,
    embeddingModel,
  }
}

export async function retrieveKnowledgeBaseContext(query, limit = 3) {
  const embeddingResult = await generateEmbedding(query)
  const queryEmbedding = embeddingResult.embedding
  const chunks = await KnowledgeChunk.find({}).lean()

  return {
    embeddingModel: embeddingResult.model,
    matches: chunks
      .map((chunk) => ({
        id: `${chunk.documentId}:${chunk.chunkIndex}`,
        title: chunk.title,
        source: chunk.source,
        excerpt: buildExcerpt(chunk.text),
        score: Number(cosineSimilarity(queryEmbedding, chunk.embedding).toFixed(6)),
        chunkIndex: chunk.chunkIndex,
      }))
      .filter((chunk) => chunk.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit),
  }
}
