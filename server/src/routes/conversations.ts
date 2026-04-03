import { Router } from 'express'
import { db } from '../db/index.js'
import { conversations, messages } from '../db/schema.js'
import { eq, desc, asc, count, and } from 'drizzle-orm'

const router = Router()

// Extract user ID from auth middleware or fallback header
function getUserId(req: any): string | null {
  return req.userId || (req.headers['x-user-id'] as string | null)
}

// POST /api/conversations
router.post('/', async (req, res) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'x-user-id header required' })
    return
  }

  const { title } = req.body
  const [conversation] = await db
    .insert(conversations)
    .values({
      userId,
      title: title || 'New Conversation',
    })
    .returning()

  res.status(201).json({
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
  })
})

// GET /api/conversations
router.get('/', async (req, res) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'x-user-id header required' })
    return
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
  const offset = parseInt(req.query.offset as string) || 0

  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(limit)
    .offset(offset)

  const [totalResult] = await db
    .select({ count: count() })
    .from(conversations)
    .where(eq(conversations.userId, userId))

  res.json({
    conversations: rows.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    total: totalResult.count,
  })
})

// GET /api/conversations/:id
router.get('/:id', async (req, res) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'x-user-id header required' })
    return
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, req.params.id), eq(conversations.userId, userId)))

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversation.id))
    .orderBy(asc(messages.createdAt))

  res.json({
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
    messages: msgs.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      toolCallId: m.toolCallId,
      toolName: m.toolName,
      createdAt: m.createdAt,
    })),
  })
})

// DELETE /api/conversations/:id
router.delete('/:id', async (req, res) => {
  const userId = getUserId(req)
  if (!userId) {
    res.status(401).json({ error: 'x-user-id header required' })
    return
  }

  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, req.params.id), eq(conversations.userId, userId)))

  if (!conversation) {
    res.status(404).json({ error: 'Conversation not found' })
    return
  }

  await db.delete(conversations).where(eq(conversations.id, req.params.id))
  res.json({ success: true })
})

export default router
