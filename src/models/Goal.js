import mongoose from 'mongoose'

const goalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    dueDate: { type: Date, required: false },
    category: { type: String, required: false },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  },
)

export const Goal = mongoose.model('Goal', goalSchema)
