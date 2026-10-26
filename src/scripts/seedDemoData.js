import mongoose from 'mongoose'
import { Expense } from '../models/Expense.js'
import { UserProfile } from '../models/UserProfile.js'
import { KnowledgeArticle } from '../models/KnowledgeArticle.js'
import { Goal } from '../models/Goal.js'

const MONGODB_URI = process.env.MONGODB_URI

async function seed() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not set')
    }

    await mongoose.connect(MONGODB_URI)

    const userId = 'riya-demo'

    // Seed profile
    await UserProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        name: 'Riya',
        email: 'riya@example.com',
        monthlyBudget: 75000,
        currency: 'INR',
      },
      { upsert: true },
    )

    // Seed expenses
    const existingExpenses = await Expense.countDocuments({ userId })
    if (existingExpenses === 0) {
      const now = new Date()
      const demoExpenses = [
        {
          merchant: 'BigBasket',
          category: 'Groceries',
          amount: 3200,
          currency: 'INR',
          date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          paymentMethod: 'UPI',
          notes: 'Weekly groceries',
          userId,
        },
        {
          merchant: 'Zomato',
          category: 'Food & Dining',
          amount: 850,
          currency: 'INR',
          date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
          paymentMethod: 'Credit Card',
          notes: 'Dinner with friends',
          userId,
        },
        {
          merchant: 'Uber',
          category: 'Transport',
          amount: 450,
          currency: 'INR',
          date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
          paymentMethod: 'UPI',
          notes: 'Office commute',
          userId,
        },
        {
          merchant: 'Netflix',
          category: 'Entertainment',
          amount: 699,
          currency: 'INR',
          date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          paymentMethod: 'Credit Card',
          notes: 'Monthly subscription',
          userId,
        },
      ]

      await Expense.insertMany(demoExpenses)
    }

    // Seed knowledge articles
    const existingArticles = await KnowledgeArticle.countDocuments()
    if (existingArticles === 0) {
      await KnowledgeArticle.insertMany([
        {
          slug: 'monthly-budgeting-guide',
          title: 'Monthly Budgeting Guide',
          summary: 'Learn how to set a realistic monthly budget and track it with this app.',
          content:
            'Start by listing all your fixed expenses, then allocate budgets for variable categories like food and entertainment. Use the dashboard to monitor your spending against your monthly budget.',
          category: 'Budgeting',
          tags: ['budget', 'monthly', 'planning'],
        },
        {
          slug: 'emergency-fund-basics',
          title: 'Emergency Fund Basics',
          summary: 'Why you need an emergency fund and how to build it steadily.',
          content:
            'Aim for 3-6 months of essential expenses in an emergency fund. Track your savings contributions through goals and review AI insights for potential savings.',
          category: 'Savings',
          tags: ['emergency fund', 'savings'],
        },
        {
          slug: 'reduce-unnecessary-expenses',
          title: 'Reducing Unnecessary Expenses',
          summary: 'Identify and cut back on low-value spending without impacting your lifestyle.',
          content:
            'Use the category breakdown and AI insights to spot categories where spending has grown rapidly. Set a goal to reduce spending in one category by 10-15% and track progress.',
          category: 'Spending',
          tags: ['expenses', 'saving money'],
        },
      ])
    }

    // Seed goals
    const existingGoals = await Goal.countDocuments({ userId })
    if (existingGoals === 0) {
      await Goal.insertMany([
        {
          userId,
          name: 'Build emergency fund',
          targetAmount: 100000,
          currentAmount: 25000,
          category: 'Savings',
        },
        {
          userId,
          name: 'Reduce dining out',
          targetAmount: 5000,
          currentAmount: 0,
          category: 'Food & Dining',
        },
      ])
    }

    console.log('Demo data seeded successfully')
    await mongoose.disconnect()
  } catch (error) {
    console.error('Failed to seed demo data:', error)
    process.exitCode = 1
  }
}

seed()
