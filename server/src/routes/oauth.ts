import { Router } from 'express'
import { config } from '../config.js'
import { getAuthorizationUrl, exchangeCode, storeTokens, getAccessToken, removeConnection } from '../auth/oauth.js'
import type { AuthenticatedRequest } from '../auth/middleware.js'

const router = Router()

const REDIRECT_BASE = process.env.OAUTH_REDIRECT_BASE || 'http://localhost:3100'

// GET /api/oauth/:provider/authorize
router.get('/:provider/authorize', (req: AuthenticatedRequest, res) => {
  const userId = req.userId
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const provider = req.params.provider as string
  const redirectUri = `${REDIRECT_BASE}/api/oauth/${provider}/callback`
  try {
    const url = getAuthorizationUrl(provider, userId, redirectUri)
    res.redirect(url)
  } catch (err) {
    res.status(400).json({ error: (err as Error).message })
  }
})

// GET /api/oauth/:provider/callback
router.get('/:provider/callback', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string }

  if (!code || !state) {
    res.status(400).json({ error: 'Missing code or state parameter' })
    return
  }

  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    const { userId, provider } = decoded

    const redirectUri = `${REDIRECT_BASE}/api/oauth/${provider}/callback`
    const tokens = await exchangeCode(provider, code, redirectUri)
    await storeTokens(userId, provider, tokens.accessToken, tokens.refreshToken, tokens.expiresAt)

    res.redirect(`${config.CLIENT_ORIGIN_PRIMARY}/bridge?oauth=success&provider=${provider}`)
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// GET /api/oauth/:provider/status
router.get('/:provider/status', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  const provider = req.params.provider as string
  const token = await getAccessToken(userId, provider)
  res.json({ connected: !!token, provider })
})

// DELETE /api/oauth/:provider
router.delete('/:provider', async (req: AuthenticatedRequest, res) => {
  const userId = req.userId
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  await removeConnection(userId, req.params.provider as string)
  res.json({ success: true })
})

export default router
