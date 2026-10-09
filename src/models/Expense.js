import mongoose from 'mongoose'

const expenseSchema = new mongoose.Schema(
  {
    merchant: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    date: { type: Date, required: true },
    paymentMethod: { type: String },
    userId: { type: String },
  },
  {
    timestamps: true,
  },
)

export const Expense = mongoose.model('Expense', expenseSchema)
