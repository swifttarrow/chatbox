export interface ToolCallInput {
  toolName: string
  parameters: Record<string, unknown>
  appSessionId: string | null
  conversationId: string
  userId: string
}

export interface ToolCallResult {
  success: boolean
  result?: unknown
  domainState?: unknown
  uiCommand?: { type: string; payload: unknown }
  error?: string
}

export interface UserActionInput {
  action: string
  payload: Record<string, unknown>
  appSessionId: string
  currentDomainState: unknown
}

export interface UserActionResult {
  success: boolean
  domainState?: unknown
  uiCommand?: { type: string; payload: unknown }
  toolResult?: unknown
  error?: string
  isComplete?: boolean
}

export interface AppSnapshot {
  app: string
  appSessionId: string
  stateVersion: number
  source: 'server_validated'
  summary: Record<string, unknown>
}

export abstract class AppAdapter {
  abstract readonly appId: string

  abstract onToolCall(input: ToolCallInput): Promise<ToolCallResult>
  abstract onUserAction(input: UserActionInput): Promise<UserActionResult>
  abstract getSnapshot(domainState: unknown, appSessionId: string): AppSnapshot
  abstract getInitialState(): unknown
}

// Adapter registry
const adapters = new Map<string, AppAdapter>()

export function registerAdapter(adapter: AppAdapter): void {
  adapters.set(adapter.appId, adapter)
}

export function getAdapter(appId: string): AppAdapter | undefined {
  return adapters.get(appId)
}
