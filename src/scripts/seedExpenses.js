import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { Expense } from '../models/Expense.js'
import { connectDB } from '../config/db.js'

dotenv.config()

async function seedExpenses() {
  try {
    await connectDB()

    const sampleExpenses = [
      {
        merchant: 'Fresh Basket',
        category: 'Groceries',
        amount: 84.2,
        currency: 'INR',
        date: new Date(),
        paymentMethod: 'UPI',
      },
      {
        merchant: 'Metro Fuel',
        category: 'Transport',
        amount: 52,
        currency: 'INR',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        paymentMethod: 'Card',
      },
      {
        merchant: 'CloudFit Gym',
        category: 'Health',
        amount: 39.99,
        currency: 'INR',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        paymentMethod: 'Card',
      },
    ]

    await Expense.deleteMany({})
    await Expense.insertMany(sampleExpenses)

    console.log('Seeded sample expenses')
  } catch (error) {
    console.error('Failed to seed expenses:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seedExpenses()
