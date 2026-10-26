import { Goal } from '../models/Goal.js'

export async function getGoals(req, res) {
  try {
    const userId = req.query.userId || 'riya-demo'
    const goals = await Goal.find({ userId }).sort({ createdAt: -1 }).lean()
    res.json({ goals })
  } catch (error) {
    console.error('Failed to load goals:', error)
    res.status(500).json({ message: 'Failed to load goals' })
  }
}

export async function createGoal(req, res) {
  try {
    const userId = req.body.userId || 'riya-demo'
    const { name, targetAmount, currentAmount, dueDate, category } = req.body

    const goal = await Goal.create({
      userId,
      name,
      targetAmount,
      currentAmount: currentAmount ?? 0,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      category,
    })

    res.status(201).json(goal)
  } catch (error) {
    console.error('Failed to create goal:', error)
    res.status(500).json({ message: 'Failed to create goal' })
  }
}
