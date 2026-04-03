import type { ModelMessage } from 'ai'
import { db } from '../db/index.js'
import { messages } from '../db/schema.js'
import { eq, asc } from 'drizzle-orm'

const BASE_SYSTEM_PROMPT = `You are a helpful AI assistant with access to interactive apps.
When a user wants to use an app, call the appropriate tool.
Only use tools when the user's request clearly matches an app's capabilities.
For general questions, respond with text only.
If the user's request is ambiguous, ask for clarification.
When an app is active, you can see its current state and reference it in your responses.
Available apps are provided as tools below.`

export async function buildModelContext(
  conversationId: string,
  appContext?: string,
): Promise<ModelMessage[]> {
  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))

  let systemPrompt = BASE_SYSTEM_PROMPT
  if (appContext) {
    systemPrompt += '\n\n' + appContext
  }

  const modelMessages: ModelMessage[] = [
    { role: 'system', content: systemPrompt },
  ]

  for (const row of rows) {
    if (row.role === 'user') {
      modelMessages.push({ role: 'user', content: row.content })
    } else if (row.role === 'assistant') {
      modelMessages.push({ role: 'assistant', content: row.content })
    } else if (row.role === 'tool') {
      modelMessages.push({
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: row.toolCallId || '',
            toolName: row.toolName || '',
            output: { type: 'text', value: row.content },
          },
        ],
      })
    }
  }

  return modelMessages
}
