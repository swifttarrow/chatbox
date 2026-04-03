import { Router } from 'express'
import {
  createAppSession,
  getActiveAppSessions,
  getAppSession,
  disposeAppSession,
  getAllAppSessions,
} from '../apps/sessions.js'
import { getAppDefinition } from '../apps/registry.js'

const router = Router()

// POST /api/conversations/:conversationId/app-sessions
router.post('/conversations/:conversationId/app-sessions', async (req, res) => {
  const userId = (req as any).userId || (req.headers['x-user-id'] as string)
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const { appId } = req.body
  if (!appId) {
    res.status(400).json({ error: 'appId is required' })
    return
  }

  try {
    const session = await createAppSession(req.params.conversationId, appId, userId)
    res.status(201).json({
      id: session.id,
      appId: session.appId,
      status: session.status,
      domainState: session.domainState,
      stateVersion: session.stateVersion,
    })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/conversations/:conversationId/app-sessions
router.get('/conversations/:conversationId/app-sessions', async (req, res) => {
  const sessions = await getAllAppSessions(req.params.conversationId)
  const enriched = sessions.map((s) => {
    const def = getAppDefinition(s.appId)
    return { ...s, uiUrl: def?.uiUrl ?? null }
  })
  res.json({ sessions: enriched })
})

// GET /api/app-sessions/:sessionId
router.get('/app-sessions/:sessionId', async (req, res) => {
  const session = await getAppSession(req.params.sessionId)
  if (!session) {
    res.status(404).json({ error: 'App session not found' })
    return
  }
  res.json(session)
})

// DELETE /api/app-sessions/:sessionId
router.delete('/app-sessions/:sessionId', async (req, res) => {
  const session = await disposeAppSession(req.params.sessionId)
  if (!session) {
    res.status(404).json({ error: 'App session not found' })
    return
  }
  res.json({ success: true })
})

export default router
