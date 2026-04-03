import { getAdapter, type ToolCallResult, type UserActionResult } from '../apps/adapter.js'
import {
  createAppSession,
  getActiveAppSessions,
  getAppSession,
  updateDomainState,
} from '../apps/sessions.js'

export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  appId: string,
  appSessionId: string | null,
  conversationId: string,
  userId: string,
): Promise<ToolCallResult & { appSessionId: string | null; isNewSession: boolean }> {
  const adapter = getAdapter(appId)
  if (!adapter) {
    return { success: false, error: `No adapter found for app: ${appId}`, appSessionId: null, isNewSession: false }
  }

  let isNewSession = false

  // Auto-create session if needed
  if (!appSessionId) {
    const existingSessions = await getActiveAppSessions(conversationId)
    const existing = existingSessions.find((s) => s.appId === appId)
    if (existing) {
      appSessionId = existing.id
    } else {
      const newSession = await createAppSession(conversationId, appId, userId)
      appSessionId = newSession.id
      isNewSession = true
    }
  }

  const result = await adapter.onToolCall({
    toolName,
    parameters: args,
    appSessionId,
    conversationId,
    userId,
  })

  if (result.domainState && appSessionId) {
    await updateDomainState(appSessionId, result.domainState)
  }

  return { ...result, appSessionId, isNewSession }
}

export async function handleUserAction(
  action: string,
  payload: Record<string, unknown>,
  appSessionId: string,
): Promise<UserActionResult> {
  const session = await getAppSession(appSessionId)
  if (!session) {
    return { success: false, error: 'App session not found' }
  }

  const adapter = getAdapter(session.appId)
  if (!adapter) {
    return { success: false, error: `No adapter found for app: ${session.appId}` }
  }

  const result = await adapter.onUserAction({
    action,
    payload,
    appSessionId,
    currentDomainState: session.domainState,
  })

  if (result.domainState) {
    await updateDomainState(appSessionId, result.domainState)
  }

  return result
}
