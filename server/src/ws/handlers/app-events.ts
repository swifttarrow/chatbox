import type { WebSocket } from 'ws'
import { connectionManager } from '../connection-manager.js'
import { handleUserAction } from '../../orchestrator/tool-executor.js'
import { updateSessionStatus } from '../../apps/sessions.js'
import { db } from '../../db/index.js'
import { messages } from '../../db/schema.js'
import type { WsEnvelope } from '../types.js'

export async function handleAppUserAction(
  ws: WebSocket,
  userId: string,
  message: WsEnvelope,
): Promise<void> {
  const { appSessionId, payload } = message
  if (!appSessionId) {
    connectionManager.sendToConnection(ws, {
      type: 'app.error',
      payload: { error: 'appSessionId is required' },
    })
    return
  }

  const { action, data } = (payload || {}) as { action?: string; data?: Record<string, unknown> }
  if (!action) {
    connectionManager.sendToConnection(ws, {
      type: 'app.error',
      appSessionId,
      payload: { error: 'action is required' },
    })
    return
  }

  try {
    const result = await handleUserAction(action, data || {}, appSessionId)

    if (!result.success) {
      connectionManager.sendToConnection(ws, {
        type: 'app.error',
        appSessionId,
        payload: { error: result.error },
      })
      return
    }

    if (result.domainState) {
      connectionManager.sendToConnection(ws, {
        type: 'app.state_patch',
        appSessionId,
        payload: result.domainState,
      })
    }

    if (result.isComplete) {
      await updateSessionStatus(appSessionId, 'completed')

      connectionManager.sendToConnection(ws, {
        type: 'app.command',
        appSessionId,
        payload: { type: 'game_over', data: result.domainState },
      })

      // Insert a context message for the model
      const convSession = await db.query.appSessions.findFirst({
        where: (s, { eq }) => eq(s.id, appSessionId),
      })
      if (convSession) {
        await db.insert(messages).values({
          conversationId: convSession.conversationId,
          role: 'tool',
          content: `App session completed. Final state: ${JSON.stringify(result.domainState)}`,
          toolName: 'app_completion',
        })
      }
    }
  } catch (err) {
    connectionManager.sendToConnection(ws, {
      type: 'app.error',
      appSessionId,
      payload: { error: (err as Error).message },
    })
  }
}
