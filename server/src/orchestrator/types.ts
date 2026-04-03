export type RunEvent =
  | { type: 'text_delta'; delta: string }
  | { type: 'tool_call'; toolName: string; args: unknown; appId?: string }
  | { type: 'tool_result'; toolName: string; result: unknown; appId?: string }
  | { type: 'app_command'; appSessionId: string; command: { type: string; payload: unknown } }
  | { type: 'app_mount'; appSessionId: string; appId: string; uiUrl: string; domainState: unknown }
  | { type: 'done'; messageId: string; usage: { input: number; output: number } }
  | { type: 'error'; error: string }

export interface RunContext {
  conversationId: string
  userId: string
}
