import { UserProfile } from '../models/UserProfile.js'

export async function getProfile(req, res) {
  try {
    const userId = req.query.userId || 'riya-demo'
    let profile = await UserProfile.findOne({ userId }).lean()

    if (!profile) {
      profile = await UserProfile.create({
        userId,
        name: 'Riya',
        email: 'riya@example.com',
        monthlyBudget: 65000,
        currency: 'INR',
      })
    }

    res.json(profile)
  } catch (error) {
    console.error('Failed to load profile:', error)
    res.status(500).json({ message: 'Failed to load profile' })
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.body.userId || 'riya-demo'
    const { name, email, monthlyBudget, currency } = req.body

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...(name && { name }),
          ...(email && { email }),
          ...(monthlyBudget != null && { monthlyBudget }),
          ...(currency && { currency }),
        },
      },
      { new: true, upsert: true },
    ).lean()

    res.json(profile)
  } catch (error) {
    console.error('Failed to update profile:', error)
    res.status(500).json({ message: 'Failed to update profile' })
  }
}
