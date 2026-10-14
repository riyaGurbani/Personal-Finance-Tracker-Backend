import mongoose from 'mongoose'

const insightSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    cardType: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    source: {
      type: String,
      enum: ['mock', 'ai'],
      default: 'mock',
    },
    generatedAt: { type: Date, required: true },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

insightSchema.index({ userId: 1, cardType: 1 }, { unique: true })

export const Insight = mongoose.model('Insight', insightSchema)