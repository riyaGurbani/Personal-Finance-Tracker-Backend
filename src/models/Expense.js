import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema(
  {
    merchant: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    date: { type: Date, required: true },
    paymentMethod: { type: String },
    notes: { type: String, default: '' },
    userId: { type: String },
    source: {
      type: String,
      enum: ['manual', 'ai', 'import'],
      default: 'manual',
    },
    isRecurring: { type: Boolean, default: false },
    isAiCategorized: { type: Boolean, default: false },
    aiCategorySuggestion: { type: String, default: null },
    aiCategoryConfidence: { type: Number, default: null },
    aiCategoryReason: { type: String, default: null },
  },
  {
    timestamps: true,
  },
)

export const Expense = mongoose.model('Expense', expenseSchema)
