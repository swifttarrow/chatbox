import { Router } from 'express'
import { db } from '../db/index.js'
import { appDefinitions } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

const router = Router()

// GET /api/apps
router.get('/', async (_req, res) => {
  const rows = await db
    .select()
    .from(appDefinitions)
    .where(eq(appDefinitions.enabled, true))

  res.json({
    apps: rows.map((a) => ({
      id: a.id,
      displayName: a.displayName,
      description: a.description,
      appType: a.appType,
      version: a.version,
      enabled: a.enabled,
    })),
  })
})

// GET /api/apps/:appId
router.get('/:appId', async (req, res) => {
  const [app] = await db
    .select()
    .from(appDefinitions)
    .where(and(eq(appDefinitions.id, req.params.appId), eq(appDefinitions.enabled, true)))

  if (!app) {
    res.status(404).json({ error: 'App not found' })
    return
  }

  res.json(app)
})

export default router
