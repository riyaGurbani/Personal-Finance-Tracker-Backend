import mongoose from 'mongoose'

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    monthlyBudget: { type: Number, default: 65000 },
    currency: { type: String, default: 'INR' },
  },
  {
    timestamps: true,
  },
)

export const UserProfile = mongoose.model('UserProfile', userProfileSchema)
