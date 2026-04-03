# Task 004: Tool Execution Flow in Run Orchestrator

## Purpose

Wire the run orchestrator to actually execute tool calls via app adapters when the model emits them, feed the results back into the model's conversation, and notify the client when an app needs to mount its iframe. This completes the model -> server -> adapter -> model loop AND the server -> client iframe mount trigger.

## Inputs

- Spec: `docs/specs/m4-chess-vertical/README.md`
- Files: `server/src/orchestrator/run.ts`, `server/src/orchestrator/tools.ts`, `server/src/apps/adapter.ts`, `server/src/apps/sessions.ts`, `server/src/ws/types.ts`, `server/src/ws/handlers/chat.ts`

## Outputs

- Create: `server/src/orchestrator/tool-executor.ts` (route tool calls to adapters)
- Modify: `server/src/orchestrator/run.ts` (handle tool calls in streaming loop)
- Modify: `server/src/orchestrator/tools.ts` (replace placeholder execute stubs with real adapter routing)
- Modify: `server/src/orchestrator/types.ts` (add tool-related RunEvent types)
- Modify: `server/src/ws/types.ts` (add app command WS message types)
- Modify: `server/src/ws/handlers/chat.ts` (forward app_command and app_mount events to client)
- Modify: `src/renderer/packages/bridge/store.ts` (handle app.mount WS message to trigger iframe rendering)

## Dependencies

- Prior task: `003-chess-adapter.md`
- Required artifacts: `server/src/apps/adapters/chess.ts`, `server/src/orchestrator/run.ts`, `server/src/orchestrator/tools.ts`, `src/renderer/packages/bridge/store.ts`

## Constraints

- When the model emits a tool call, the orchestrator must:
  1. Determine the appId from the tool's closure context (set in M3-006 `buildToolsForTurn`)
  2. **Auto-create an app session** if one doesn't exist for this app in this conversation (handles the bootstrap case: user says "let's play chess" with no prior session)
  3. Call `adapter.onToolCall()` with the parameters
  4. If the result includes `domainState`: update the app session
  5. If the result includes `uiCommand` AND this is a new session: yield an `app_mount` event so the client knows to mount an iframe
  6. If the result includes `uiCommand`: yield an `app_command` event for the client to forward to the iframe
  7. Feed the tool result back to the model and continue streaming
- Run status transitions: `streaming_model` -> `invoking_tool` -> `streaming_model` (loop) -> `succeeded`
- Persist each tool call as a `run_step`
- Persist tool call and tool result as messages (for conversation history)
- The **client bridge store** must handle the `app.mount` WS message to add the app session to its active list and render `AppContainer`

## Required Changes

1. Create `server/src/orchestrator/tool-executor.ts`:
   - `executeToolCall(toolName, args, appId, appSessionId, conversationId, userId)`:
     - **If `appSessionId` is null** (no active session for this app): auto-create one via `createAppSession(conversationId, appId, userId)` and use the new session ID
     - Look up adapter from adapter registry
     - Call `adapter.onToolCall({ toolName, parameters: args, appSessionId, conversationId, userId })`
     - If `domainState` in result: update app session via `updateDomainState()`
     - Return `{ ...ToolCallResult, appSessionId, isNewSession: boolean }`
   - `handleUserAction(action, payload, appSessionId)`:
     - Look up adapter, get current domain state from session
     - Call `adapter.onUserAction({ action, payload, appSessionId, currentDomainState })`
     - Update domain state if changed
     - Return result

2. Modify `server/src/orchestrator/tools.ts`:
   - Replace the placeholder `execute` stubs from M3-006 with real routing:
     ```typescript
     execute: async (args) => {
       const result = await executeToolCall(def.name, args, appId, appSessionId, conversationId, userId)
       return result
     }
     ```
   - The `buildToolsForTurn` function now receives `conversationId` and `userId` to pass through to execute

3. Modify `server/src/orchestrator/run.ts`:
   - Use Vercel AI SDK's `fullStream` to detect tool calls and results
   - The `tool()` `execute` functions handle the actual execution (set up in step 2)
   - After each tool result, check if it produced an `app_mount` or `app_command` event
   - Yield appropriate `RunEvent` types for the WS handler
   - Persist run_steps for each tool call
   - Use `maxSteps: 5` (or configurable) via `stopWhen: stepCountIs(5)` to allow multi-step tool use

4. Add to `server/src/orchestrator/types.ts`:
   - `{ type: 'tool_call', toolName: string, args: unknown, appId: string }`
   - `{ type: 'tool_result', toolName: string, result: unknown, appId: string }`
   - `{ type: 'app_mount', appSessionId: string, appId: string, uiUrl: string, domainState: unknown }` -- tells client to mount an iframe
   - `{ type: 'app_command', appSessionId: string, command: { type: string, payload: unknown } }` -- tells client to forward to iframe

5. Add to `server/src/ws/types.ts`:
   - Server -> client: `app.mount` (new iframe needed), `app.command`, `app.state_patch`

6. Modify `server/src/ws/handlers/chat.ts`:
   - When the run yields `app_mount`: send `app.mount` WS message to client with `{ appSessionId, appId, uiUrl, domainState }`
   - When the run yields `app_command`: send `app.command` WS message to client

7. Modify `src/renderer/packages/bridge/store.ts`:
   - Add `activeAppSessions` state: `Map<string, { appId, appSessionId, uiUrl, domainState, status }>`
   - Handle incoming `app.mount` WS message: add to `activeAppSessions`, which triggers `AppContainer` rendering in the chat UI
   - Handle incoming `app.command` WS message: route to correct iframe by `appSessionId`

## Acceptance Criteria

- [ ] Model emits `start_chess_game` tool call -> **app session auto-created** -> adapter executes -> model receives result -> model responds with text
- [ ] Client receives `app.mount` WS message and adds the app to `activeAppSessions` state
- [ ] `AppContainer` renders in the chat UI (iframe mounts via the `app.mount` trigger)
- [ ] Tool call and result persisted as messages in the database
- [ ] Run step created for tool execution
- [ ] Domain state updated in `app_sessions` table after tool execution
- [ ] Run status transitions correctly through `invoking_tool`
- [ ] Subsequent tool calls to the same app reuse the existing session (no duplicate creation)

## Validation

- [ ] Send "let's play chess" (no prior session) -> model calls `start_chess_game` -> session created -> `app.mount` sent to client -> iframe appears -> model text response shown
- [ ] Check `app_sessions` table: new session with chess initial state
- [ ] Check `messages` table: user msg, tool call msg, tool result msg, assistant msg
- [ ] Check client DevTools Network (WS): `app.mount` message received
- [ ] Check client state: `activeAppSessions` contains the chess session
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- If Vercel AI SDK's `tool()` `execute` function runs asynchronously and `streamText` automatically handles the tool call -> result -> continue cycle, leverage that built-in behavior rather than manual stream processing
- If the client-side bridge store structure from M2-005 doesn't support the `activeAppSessions` map easily, adapt the store shape
