import { Router } from 'express'
import { getKnowledgeList, searchKnowledge } from '../controllers/knowledgeController.js'

const router = Router()

router.get('/', getKnowledgeList)
router.get('/search', searchKnowledge)

export default router
