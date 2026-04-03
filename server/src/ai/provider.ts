import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { config } from '../config.js'

export function getProvider() {
  switch (config.LLM_PROVIDER) {
    case 'openai':
      return createOpenAI({ apiKey: config.LLM_API_KEY })
    case 'anthropic':
    default:
      return createAnthropic({ apiKey: config.LLM_API_KEY })
  }
}

export function getModel() {
  const provider = getProvider()
  return provider(config.LLM_MODEL)
}
