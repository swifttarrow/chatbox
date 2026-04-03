import type { WebSocket } from 'ws'
import { connectionManager } from '../connection-manager.js'
import { executeRun } from '../../orchestrator/run.js'
import type { WsEnvelope } from '../types.js'

const activeRuns = new Set<string>()

export async function handleChatMessage(
  ws: WebSocket,
  userId: string,
  message: WsEnvelope,
): Promise<void> {
  const { conversationId, payload } = message
  const content = (payload as any)?.content ?? (message as any).content

  if (!conversationId) {
    connectionManager.sendToConnection(ws, {
      type: 'chat.error',
      payload: { error: 'conversationId is required' },
    })
    return
  }

  if (!content || typeof content !== 'string') {
    connectionManager.sendToConnection(ws, {
      type: 'chat.error',
      conversationId,
      payload: { error: 'content is required and must be a string' },
    })
    return
  }

  if (activeRuns.has(conversationId)) {
    connectionManager.sendToConnection(ws, {
      type: 'chat.error',
      conversationId,
      payload: { error: 'A run is already in progress for this conversation' },
    })
    return
  }

  activeRuns.add(conversationId)
  let runId: string | undefined

  try {
    for await (const event of executeRun(content, { conversationId, userId })) {
      switch (event.type) {
        case 'text_delta':
          connectionManager.sendToConnection(ws, {
            type: 'chat.assistant_chunk',
            conversationId,
            payload: { delta: event.delta, runId },
          })
          break

        case 'done':
          runId = undefined
          connectionManager.sendToConnection(ws, {
            type: 'chat.assistant_done',
            conversationId,
            payload: {
              messageId: event.messageId,
              usage: event.usage,
            },
          })
          break

        case 'error':
          connectionManager.sendToConnection(ws, {
            type: 'chat.error',
            conversationId,
            payload: { error: event.error, runId },
          })
          break
      }
    }
  } catch (err) {
    connectionManager.sendToConnection(ws, {
      type: 'chat.error',
      conversationId,
      payload: { error: (err as Error).message },
    })
  } finally {
    activeRuns.delete(conversationId)
  }
}
