import { tool, type ToolSet } from 'ai'
import { getAllAppDefinitions } from '../apps/registry.js'
import { getActiveAppSessions, getAllAppSessions } from '../apps/sessions.js'
import { getAdapter, type AppSnapshot } from '../apps/adapter.js'
import { executeToolCall } from './tool-executor.js'
import { connectionManager } from '../ws/connection-manager.js'

export async function buildToolsForTurn(
  conversationId: string,
  userId: string,
): Promise<{ tools: ToolSet; appContext: string }> {
  const allDefs = getAllAppDefinitions()
  const activeSessions = await getActiveAppSessions(conversationId)
  const activeAppIds = new Set(activeSessions.map((s) => s.appId))

  const tools: ToolSet = {}

  for (const def of allDefs) {
    if (!def.enabled) continue

    const hasActiveSession = activeAppIds.has(def.id)
    const session = activeSessions.find((s) => s.appId === def.id)

    for (const toolDef of def.tools) {
      if (!toolDef.isLauncher && !hasActiveSession) continue

      const appId = def.id
      const appSessionId = session?.id ?? null

      tools[toolDef.name] = tool({
        description: toolDef.description,
        inputSchema: toolDef.parameters,
        execute: async (args) => {
          const result = await executeToolCall(
            toolDef.name,
            args as Record<string, unknown>,
            appId,
            appSessionId,
            conversationId,
            userId,
          )

          if (
            result.success &&
            result.isNewSession &&
            result.appSessionId &&
            def.appType === 'hybrid_session'
          ) {
            const mountUrl = def.uiUrl
            if (mountUrl) {
              connectionManager.sendToUser(userId, {
                type: 'app.mount',
                conversationId,
                payload: {
                  appId,
                  appSessionId: result.appSessionId,
                  uiUrl: mountUrl,
                  domainState: result.domainState ?? {},
                  conversationId,
                },
              })
            }
          }

          // Return stringified result for the model
          return JSON.stringify({
            success: result.success,
            result: result.result,
            error: result.error,
            appSessionId: result.appSessionId,
            isNewSession: result.isNewSession,
          })
        },
      })
    }
  }

  // Build app context from active AND recently completed session snapshots
  const allSessions = await getAllAppSessions(conversationId)
  let appContext = ''
  for (const session of allSessions) {
    if (session.status !== 'active' && session.status !== 'completed') continue
    const adapter = getAdapter(session.appId)
    if (adapter && session.domainState) {
      const snapshot = adapter.getSnapshot(session.domainState, session.id)
      appContext += formatSnapshot(snapshot)
    }
  }

  return { tools, appContext }
}

function formatSnapshot(snapshot: AppSnapshot): string {
  const lines = [`[${snapshot.app} App State]`]
  for (const [key, value] of Object.entries(snapshot.summary)) {
    lines.push(`  ${key}: ${value}`)
  }
  return lines.join('\n') + '\n\n'
}
