import { db } from '../db/index.js'
import { messages, conversationRuns } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { streamChatCompletion } from '../ai/stream.js'
import { buildModelContext } from './context.js'
import { buildToolsForTurn } from './tools.js'
import type { RunEvent, RunContext } from './types.js'

const MODEL_TIMEOUT_MS = 60_000
const TOOL_TIMEOUT_MS = 30_000

export async function* executeRun(
  userMessage: string,
  context: RunContext,
): AsyncGenerator<RunEvent> {
  let runId: string | undefined
  const abortController = new AbortController()

  // Set overall model timeout
  const timeoutId = setTimeout(() => {
    abortController.abort()
  }, MODEL_TIMEOUT_MS)

  try {
    // 1. Insert user message
    const [userMsg] = await db
      .insert(messages)
      .values({
        conversationId: context.conversationId,
        role: 'user',
        content: userMessage,
      })
      .returning()

    // 2. Create run record
    const [run] = await db
      .insert(conversationRuns)
      .values({
        conversationId: context.conversationId,
        status: 'created',
        triggerMessageId: userMsg.id,
      })
      .returning()
    runId = run.id

    // 3. Build tools and context
    const { tools, appContext } = await buildToolsForTurn(context.conversationId, context.userId)
    const modelMessages = await buildModelContext(context.conversationId, appContext)

    // 4. Update run to streaming
    await db
      .update(conversationRuns)
      .set({ status: 'streaming_model' })
      .where(eq(conversationRuns.id, runId))

    // 5. Stream from model with abort signal
    const hasTools = Object.keys(tools).length > 0
    const result = streamChatCompletion(modelMessages, {
      ...(hasTools ? { tools } : {}),
      abortSignal: abortController.signal,
    })

    let fullText = ''
    for await (const chunk of result.fullStream) {
      if (chunk.type === 'text-delta') {
        fullText += chunk.text
        yield { type: 'text_delta', delta: chunk.text }
      }
    }

    // 6. Get usage
    const usage = await result.usage
    const inputTokens = usage?.inputTokens ?? 0
    const outputTokens = usage?.outputTokens ?? 0

    // 7. Insert assistant message
    const [assistantMsg] = await db
      .insert(messages)
      .values({
        conversationId: context.conversationId,
        role: 'assistant',
        content: fullText,
        tokenCountInput: inputTokens,
        tokenCountOutput: outputTokens,
      })
      .returning()

    // 8. Update run to succeeded
    await db
      .update(conversationRuns)
      .set({
        status: 'succeeded',
        tokenCountInput: inputTokens,
        tokenCountOutput: outputTokens,
        completedAt: new Date(),
      })
      .where(eq(conversationRuns.id, runId))

    yield {
      type: 'done',
      messageId: assistantMsg.id,
      usage: { input: inputTokens, output: outputTokens },
    }
  } catch (err) {
    const isTimeout = abortController.signal.aborted
    const errorMessage = isTimeout
      ? 'Response timed out. Please try again.'
      : (err as Error).message
    const status = isTimeout ? 'timed_out' : 'failed'

    // Update run to failed/timed_out
    if (runId) {
      await db
        .update(conversationRuns)
        .set({ status, error: errorMessage, completedAt: new Date() })
        .where(eq(conversationRuns.id, runId))
    }

    yield { type: 'error', error: errorMessage }
  } finally {
    clearTimeout(timeoutId)
  }
}
