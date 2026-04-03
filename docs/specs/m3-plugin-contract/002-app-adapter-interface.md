# Task 002: App Adapter Interface

## Purpose

Define the abstract `AppAdapter` interface that every app must implement on the server. This interface is the contract between the run orchestrator and individual app logic (Chess, Equation Solver, etc.).

## Inputs

- Spec: `docs/specs/m3-plugin-contract/README.md`
- Files: `server/src/apps/types.ts` (from task 001)

## Outputs

- Create: `server/src/apps/adapter.ts` (AppAdapter interface and adapter registry)
- Create: `server/src/apps/adapters/noop.ts` (no-op adapter for testing)

## Dependencies

- Prior task: `001-tool-schema-format.md`
- Required artifacts: `server/src/apps/types.ts`

## Constraints

- The adapter interface must support both `server_tool` (stateless computation) and `hybrid_session` (long-lived state) patterns
- Methods must be async (tool calls and state transitions may involve I/O)
- The adapter must NOT handle WebSocket or HTTP directly -- it receives structured inputs and returns structured outputs
- State management (read/write app_sessions) is done by the orchestrator, not the adapter

## Required Changes

1. Create `server/src/apps/adapter.ts`:
   ```typescript
   interface ToolCallInput {
     toolName: string
     parameters: Record<string, unknown>
     appSessionId: string | null
     conversationId: string
     userId: string
   }

   interface ToolCallResult {
     success: boolean
     result?: unknown          // returned to model as tool result
     domainState?: unknown     // updated domain state (for hybrid_session apps)
     uiCommand?: {             // if the app needs to render/update UI
       type: string
       payload: unknown
     }
     error?: string
   }

   interface UserActionInput {
     action: string
     payload: Record<string, unknown>
     appSessionId: string
     currentDomainState: unknown
   }

   interface UserActionResult {
     success: boolean
     domainState?: unknown     // updated state after user action
     uiCommand?: { type: string; payload: unknown }
     toolResult?: unknown      // if the action produces a result for the model
     error?: string
     isComplete?: boolean      // signals app/game is done
   }

   interface AppSnapshot {
     app: string
     appSessionId: string
     stateVersion: number
     source: 'server_validated'
     summary: Record<string, unknown>
   }

   abstract class AppAdapter {
     abstract readonly appId: string

     // Handle a tool call from the model
     abstract onToolCall(input: ToolCallInput): Promise<ToolCallResult>

     // Handle a user action from the iframe
     abstract onUserAction(input: UserActionInput): Promise<UserActionResult>

     // Generate a compact snapshot for model context
     abstract getSnapshot(domainState: unknown, appSessionId: string): AppSnapshot

     // Get initial domain state for a new session
     abstract getInitialState(): unknown
   }
   ```
2. Create adapter registry:
   - `registerAdapter(adapter: AppAdapter)`: register by appId
   - `getAdapter(appId: string): AppAdapter | undefined`: lookup
   - Export singleton registry
3. Create `server/src/apps/adapters/noop.ts`:
   - Implements AppAdapter with appId "noop"
   - onToolCall: returns `{ success: true, result: "no-op" }`
   - onUserAction: returns `{ success: true }`
   - getSnapshot: returns minimal snapshot
   - getInitialState: returns `{}`
   - Useful for testing the pipeline without real app logic

## Acceptance Criteria

- [ ] `AppAdapter` abstract class exported from `server/src/apps/adapter.ts`
- [ ] Adapter registry supports registration and lookup
- [ ] NoopAdapter implements all methods without errors
- [ ] Types are clear enough that implementing Chess adapter (M4) is straightforward

## Validation

- [ ] `pnpm --filter @chatbox/server build` compiles without errors
- [ ] Instantiate NoopAdapter, call all methods, verify they return expected shapes

## Stop and Ask

- If the interface becomes unclear for either server_tool or hybrid_session patterns, split into separate interfaces rather than overloading one
