import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dashboardJsonPath = path.join(__dirname, '..', 'data', 'dashboard.json')

export function getDashboard(req, res) {
  try {
    const jsonText = fs.readFileSync(dashboardJsonPath, 'utf-8')
    const dashboardData = JSON.parse(jsonText)
    res.json(dashboardData)
  } catch (error) {
    console.error('Error reading dashboard.json:', error)
    res.status(500).json({ message: 'Failed to load dashboard data' })
  }
}
