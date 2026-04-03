import { streamText, type ModelMessage, type ToolSet, stepCountIs } from 'ai'
import { getModel } from './provider.js'

export interface StreamChatOptions {
  tools?: ToolSet
  maxSteps?: number
  abortSignal?: AbortSignal
}

export function streamChatCompletion(
  messages: ModelMessage[],
  options?: StreamChatOptions,
) {
  const model = getModel()

  return streamText({
    model,
    messages,
    tools: options?.tools,
    stopWhen: stepCountIs(options?.maxSteps ?? 5),
    abortSignal: options?.abortSignal,
  })
}
