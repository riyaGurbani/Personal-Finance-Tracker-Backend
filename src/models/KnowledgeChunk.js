import mongoose from 'mongoose'

const knowledgeChunkSchema = new mongoose.Schema(
  {
    documentId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    source: { type: String, required: true, index: true },
    section: { type: String, default: '' },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    tokenCount: { type: Number, default: 0 },
    embedding: {
      type: [Number],
      default: [],
    },
    embeddingModel: { type: String, default: 'hash-fallback' },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

knowledgeChunkSchema.index({ documentId: 1, chunkIndex: 1 }, { unique: true })
knowledgeChunkSchema.index({ source: 1, chunkIndex: 1 })

export const KnowledgeChunk = mongoose.model('KnowledgeChunk', knowledgeChunkSchema)
