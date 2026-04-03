import { Router } from 'express'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../auth/utils.js'
import type { AuthenticatedRequest } from '../auth/middleware.js'

const router = Router()

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, displayName } = req.body

  if (!email || !password || !displayName) {
    res.status(400).json({ error: 'email, password, and displayName are required' })
    return
  }

  const [existing] = await db.select().from(users).where(eq(users.email, email))
  if (existing) {
    res.status(409).json({ error: 'Email already registered' })
    return
  }

  const passwordHash = await hashPassword(password)
  const [user] = await db
    .insert(users)
    .values({ email, displayName, passwordHash })
    .returning()

  const token = generateToken(user.id, user.email)
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, displayName: user.displayName },
  })
})

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ error: 'email and password are required' })
    return
  }

  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user || !user.passwordHash) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = generateToken(user.id, user.email)
  res.json({
    token,
    user: { id: user.id, email: user.email, displayName: user.displayName },
  })
})

// GET /api/auth/me
router.get('/me', (req: AuthenticatedRequest, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  const token = authHeader.slice(7)
  const decoded = verifyToken(token)
  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' })
    return
  }

  res.json({ userId: decoded.userId, email: decoded.email })
})

export default router
