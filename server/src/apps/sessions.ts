import { db } from '../db/index.js'
import { appSessions } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'
import { getAdapter } from './adapter.js'

export async function createAppSession(conversationId: string, appId: string, _userId: string) {
  const adapter = getAdapter(appId)
  const initialState = adapter ? adapter.getInitialState() : {}

  const [session] = await db
    .insert(appSessions)
    .values({
      conversationId,
      appId,
      status: 'active',
      domainState: initialState,
      stateVersion: 0,
    })
    .returning()

  return session
}

export async function getAppSession(sessionId: string) {
  const [session] = await db
    .select()
    .from(appSessions)
    .where(eq(appSessions.id, sessionId))

  return session ?? null
}

export async function getActiveAppSessions(conversationId: string) {
  return db
    .select()
    .from(appSessions)
    .where(and(eq(appSessions.conversationId, conversationId), eq(appSessions.status, 'active')))
}

export async function getAllAppSessions(conversationId: string) {
  return db
    .select()
    .from(appSessions)
    .where(eq(appSessions.conversationId, conversationId))
}

export async function updateDomainState(sessionId: string, newState: unknown) {
  const [session] = await db
    .select()
    .from(appSessions)
    .where(eq(appSessions.id, sessionId))

  if (!session) return null

  const [updated] = await db
    .update(appSessions)
    .set({
      domainState: newState as any,
      stateVersion: session.stateVersion + 1,
      updatedAt: new Date(),
    })
    .where(eq(appSessions.id, sessionId))
    .returning()

  return updated
}

export async function updateSessionStatus(sessionId: string, status: string) {
  const [updated] = await db
    .update(appSessions)
    .set({ status, updatedAt: new Date() })
    .where(eq(appSessions.id, sessionId))
    .returning()

  return updated ?? null
}

export async function disposeAppSession(sessionId: string) {
  return updateSessionStatus(sessionId, 'disposed')
}
