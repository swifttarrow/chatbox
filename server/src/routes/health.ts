import { Router } from 'express'
import { db } from '../db/index.js'
import { sql } from 'drizzle-orm'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    await db.execute(sql`SELECT 1`)
    res.json({ status: 'ok', db: 'connected' })
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' })
  }
})

export default router
