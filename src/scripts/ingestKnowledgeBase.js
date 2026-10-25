import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import { ingestKnowledgeBaseToVectorStore } from '../services/ai/rag/vectorKnowledgeBaseService.js'

dotenv.config()

async function run() {
  try {
    await connectDB()
    const result = await ingestKnowledgeBaseToVectorStore()
    console.log(
      `Knowledge-base ingestion complete. Documents: ${result.documents}, chunks: ${result.chunks}, embeddingModel: ${result.embeddingModel}`,
    )
  } catch (error) {
    console.error('Knowledge-base ingestion failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect().catch(() => {})
  }
}

run()
