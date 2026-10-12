import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Expense } from '../models/Expense.js'
import { connectDB } from '../config/db.js'

dotenv.config()

const DAY_IN_MS = 24 * 60 * 60 * 1000

function daysAgo(days) {
  return new Date(Date.now() - days * DAY_IN_MS)
}

async function seedExpenses() {
  try {
    await connectDB()

    const sampleExpenses = [
      {
        merchant: 'Fresh Basket',
        category: 'Groceries',
        amount: 84.2,
        currency: 'INR',
        date: daysAgo(0),
        paymentMethod: 'UPI',
        notes: 'Weekly grocery run for fruits, vegetables, and dairy.',
        userId: 'riya-demo',
        source: 'manual',
        isRecurring: false,
        isAiCategorized: false,
      },
      {
        merchant: 'Metro Fuel',
        category: 'Transport',
        amount: 52,
        currency: 'INR',
        date: daysAgo(1),
        paymentMethod: 'Card',
        notes: 'Fuel refill during weekday commute.',
        userId: 'riya-demo',
        source: 'manual',
        isRecurring: false,
        isAiCategorized: false,
      },
      {
        merchant: 'CloudFit Gym',
        category: 'Health',
        amount: 39.99,
        currency: 'INR',
        date: daysAgo(2),
        paymentMethod: 'Card',
        notes: 'Monthly gym membership renewal.',
        userId: 'riya-demo',
        source: 'import',
        isRecurring: true,
        isAiCategorized: false,
      },
      {
        merchant: 'Cafe Brew',
        category: 'Food & Dining',
        amount: 18.5,
        currency: 'INR',
        date: daysAgo(3),
        paymentMethod: 'UPI',
        notes: 'Coffee and sandwich with a colleague.',
        userId: 'riya-demo',
        source: 'ai',
        isRecurring: false,
        isAiCategorized: true,
        aiCategorySuggestion: 'Food & Dining',
        aiCategoryConfidence: 0.96,
        aiCategoryReason: 'Cafe transactions are typically dining-related expenses.',
      },
      {
        merchant: 'Prime Mart',
        category: 'Groceries',
        amount: 126.75,
        currency: 'INR',
        date: daysAgo(5),
        paymentMethod: 'Card',
        notes: 'Bi-weekly household essentials purchase.',
        userId: 'riya-demo',
        source: 'manual',
        isRecurring: false,
        isAiCategorized: false,
      },
      {
        merchant: 'City Cabs',
        category: 'Transport',
        amount: 31.4,
        currency: 'INR',
        date: daysAgo(7),
        paymentMethod: 'Cash',
        notes: 'Late evening cab ride back home.',
        userId: 'riya-demo',
        source: 'manual',
        isRecurring: false,
        isAiCategorized: false,
      },
      {
        merchant: 'MediCare Pharmacy',
        category: 'Health',
        amount: 64.3,
        currency: 'INR',
        date: daysAgo(10),
        paymentMethod: 'UPI',
        notes: 'Prescription refill and vitamins.',
        userId: 'riya-demo',
        source: 'manual',
        isRecurring: false,
        isAiCategorized: false,
      },
      {
        merchant: 'StreamFlix',
        category: 'Entertainment',
        amount: 14.99,
        currency: 'INR',
        date: daysAgo(12),
        paymentMethod: 'Card',
        notes: 'Monthly streaming subscription.',
        userId: 'riya-demo',
        source: 'import',
        isRecurring: true,
        isAiCategorized: false,
      },
      {
        merchant: 'Book Haven',
        category: 'Education',
        amount: 45,
        currency: 'INR',
        date: daysAgo(15),
        paymentMethod: 'UPI',
        notes: 'Purchased a personal finance book.',
        userId: 'riya-demo',
        source: 'manual',
        isRecurring: false,
        isAiCategorized: false,
      },
      {
        merchant: 'Power Utility',
        category: 'Bills',
        amount: 92.6,
        currency: 'INR',
        date: daysAgo(18),
        paymentMethod: 'Net Banking',
        notes: 'Monthly electricity bill payment.',
        userId: 'riya-demo',
        source: 'import',
        isRecurring: true,
        isAiCategorized: false,
      },
    ]

    await Expense.deleteMany({})
    await Expense.insertMany(sampleExpenses)

    console.log(`Seeded ${sampleExpenses.length} sample expenses`)
  } catch (error) {
    console.error('Failed to seed expenses:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seedExpenses()
