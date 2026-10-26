import mongoose from 'mongoose'

const knowledgeArticleSchema = new mongoose.Schema(
  {
    userId: { type: String, required: false },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
)

export const KnowledgeArticle = mongoose.model('KnowledgeArticle', knowledgeArticleSchema)
