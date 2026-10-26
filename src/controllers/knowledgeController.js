import { KnowledgeArticle } from '../models/KnowledgeArticle.js'

export async function getKnowledgeList(req, res) {
  try {
    const articles = await KnowledgeArticle.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .lean()

    res.json({ articles })
  } catch (error) {
    console.error('Failed to load knowledge articles:', error)
    res.status(500).json({ message: 'Failed to load knowledge articles' })
  }
}

export async function searchKnowledge(req, res) {
  try {
    const q = (req.query.q || '').trim()

    if (!q) {
      const articles = await KnowledgeArticle.find({ isPublished: true })
        .sort({ createdAt: -1 })
        .lean()
      return res.json({ articles })
    }

    const regex = new RegExp(q, 'i')
    const articles = await KnowledgeArticle.find({
      isPublished: true,
      $or: [{ title: regex }, { summary: regex }, { content: regex }, { tags: regex }],
    })
      .sort({ createdAt: -1 })
      .lean()

    res.json({ articles })
  } catch (error) {
    console.error('Failed to search knowledge articles:', error)
    res.status(500).json({ message: 'Failed to search knowledge articles' })
  }
}
