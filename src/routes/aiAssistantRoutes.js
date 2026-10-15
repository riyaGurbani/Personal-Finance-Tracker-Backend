import express from 'express'
import { handleAssistantQuery } from '../controllers/aiAssistantController.js'

const router = express.Router()

router.post('/', handleAssistantQuery)

export default router
