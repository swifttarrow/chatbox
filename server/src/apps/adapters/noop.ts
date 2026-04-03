import { AppAdapter, type ToolCallInput, type ToolCallResult, type UserActionInput, type UserActionResult, type AppSnapshot } from '../adapter.js'

export class NoopAdapter extends AppAdapter {
  readonly appId = 'noop'

  async onToolCall(_input: ToolCallInput): Promise<ToolCallResult> {
    return { success: true, result: 'no-op' }
  }

  async onUserAction(_input: UserActionInput): Promise<UserActionResult> {
    return { success: true }
  }

  getSnapshot(_domainState: unknown, appSessionId: string): AppSnapshot {
    return {
      app: 'noop',
      appSessionId,
      stateVersion: 0,
      source: 'server_validated',
      summary: {},
    }
  }

  getInitialState(): unknown {
    return {}
  }
}
