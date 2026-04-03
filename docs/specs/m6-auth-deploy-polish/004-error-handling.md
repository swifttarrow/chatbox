# Task 004: Error Handling & Timeout Management

## Purpose

Implement comprehensive error handling and timeout management so the application degrades gracefully when things go wrong: LLM failures, app crashes, network issues, and invalid tool calls.

## Inputs

- Spec: `docs/specs/m6-auth-deploy-polish/README.md`
- Files: `server/src/orchestrator/run.ts`, `server/src/ws/handlers/`, `src/renderer/components/bridge/`

## Outputs

- Modify: `server/src/orchestrator/run.ts` (timeout handling, error recovery)
- Modify: `server/src/ws/handlers/app-events.ts` (user action error handling)
- Modify: `server/src/ws/handlers/chat.ts` (chat error handling)
- Modify: `src/renderer/components/bridge/AppContainer.tsx` (error UI states)
- Modify: `src/renderer/packages/bridge/store.ts` (error state management)

## Dependencies

- Prior task: none (can parallel)
- Required artifacts: Run orchestrator, WS handlers, bridge components

## Constraints

- Timeouts: model call (60s), tool execution (30s), app init (10s), user action processing (15s)
- All timeouts must transition runs to a persisted state (not hang forever)
- Errors must be user-visible with actionable messages
- Run status must accurately reflect the error state
- Never show raw error messages or stack traces to the user
- Provide retry options where appropriate

## Required Changes

1. Modify `server/src/orchestrator/run.ts`:
   - Add `AbortController` with timeout for model calls
   - On model timeout: set run to `timed_out`, yield error event
   - On model API error: set run to `failed`, yield error with user-friendly message
   - On tool execution error: log details, return error result to model, let model handle gracefully
   - Wrap entire run in try/catch with proper cleanup

2. Modify `server/src/ws/handlers/app-events.ts`:
   - Validate app session exists and is active before processing
   - Timeout on adapter.onUserAction (15s)
   - Return structured error to client on failure
   - Handle: adapter throws, adapter times out, session not found, session already completed

3. Modify `server/src/ws/handlers/chat.ts`:
   - Handle: conversation not found, user not authorized, run already in progress
   - Clean error messages for each case

4. Modify `src/renderer/components/bridge/AppContainer.tsx`:
   - Error states: `network_error`, `timeout`, `app_error`, `server_error`
   - Each shows: error message, retry button (where applicable), dismiss option
   - Iframe load timeout shows "App failed to load" with retry

5. Modify `src/renderer/packages/bridge/store.ts`:
   - `error` state with error type and message
   - `clearError()` action
   - `retryLastAction()` if applicable

## Acceptance Criteria

- [ ] LLM timeout after 60s shows "Response is taking too long" with retry
- [ ] App crash (iframe error) shows error state with retry
- [ ] Network disconnect shows "Connection lost" with reconnect status
- [ ] Invalid tool call doesn't crash -- model receives error and responds gracefully
- [ ] Run status in DB accurately reflects error states
- [ ] No raw error messages or stack traces visible to users

## Validation

- [ ] Simulate LLM timeout (set to 1s temporarily): verify timeout error shown
- [ ] Kill app iframe: verify error state and retry
- [ ] Stop server while connected: verify disconnect handling
- [ ] Send malformed tool parameters: verify graceful handling
- [ ] `pnpm --filter @chatbox/server build` and `pnpm build:web` compile without errors

## Stop and Ask

- None expected; this is primarily robustness work
