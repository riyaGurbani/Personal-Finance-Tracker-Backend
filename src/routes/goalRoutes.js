import { Router } from 'express'
import { getGoals, createGoal } from '../controllers/goalController.js'

const router = Router()

router.get('/', getGoals)
router.post('/', createGoal)

export default router
