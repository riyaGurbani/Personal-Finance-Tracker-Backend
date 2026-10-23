import { Router } from 'express'
import { getAiProviderStatus, handleAiChat } from '../controllers/aiChatController.js'

const router = Router()

router.get('/providers/status', getAiProviderStatus)
router.post('/chat', handleAiChat)

export default router
