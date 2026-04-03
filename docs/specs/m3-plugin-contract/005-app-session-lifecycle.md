# Task 005: App Session Lifecycle

## Purpose

Implement app session management: creating, retrieving, updating, and disposing app sessions within conversations. App sessions are the server-side representation of an active app interaction.

## Inputs

- Spec: `docs/specs/m3-plugin-contract/README.md`
- Files: `server/src/db/schema.ts` (app_sessions table), `server/src/apps/adapter.ts`

## Outputs

- Create: `server/src/apps/sessions.ts` (app session CRUD operations)
- Create: `server/src/routes/app-sessions.ts` (REST endpoints for app sessions)
- Modify: `server/src/app.ts` (mount session routes)

## Dependencies

- Prior task: `004-app-definition-api.md`
- Required artifacts: `server/src/db/schema.ts`, `server/src/apps/adapter.ts`

## Constraints

- App sessions belong to a conversation
- Only one active session per app per conversation (can have completed/disposed sessions)
- Domain state initialized via `adapter.getInitialState()` on creation
- State version increments on every domain_state update
- Session statuses: `active`, `completed`, `disposed`, `error`

## Required Changes

1. Create `server/src/apps/sessions.ts`:
   - `createAppSession(conversationId, appId, userId)`: create session with initial state
   - `getAppSession(sessionId)`: get session by ID
   - `getActiveAppSessions(conversationId)`: get all active sessions for a conversation
   - `updateDomainState(sessionId, newState)`: update state and increment version
   - `updateSessionStatus(sessionId, status)`: transition status
   - `disposeAppSession(sessionId)`: set status to disposed

2. Create `server/src/routes/app-sessions.ts`:

   **POST /api/conversations/:conversationId/app-sessions**
   - Body: `{ appId: string }`
   - Creates session, returns: `{ id, appId, status, domainState, stateVersion }`

   **GET /api/conversations/:conversationId/app-sessions**
   - Returns all sessions for the conversation (active and completed)

   **GET /api/app-sessions/:sessionId**
   - Returns session with current domain state

   **DELETE /api/app-sessions/:sessionId**
   - Disposes the session

3. Modify `server/src/app.ts`: mount routes

## Acceptance Criteria

- [ ] Creating an app session persists it with initial domain state
- [ ] Duplicate active session for same app in same conversation is rejected
- [ ] Domain state updates increment state_version
- [ ] Disposing a session sets status to `disposed`
- [ ] Sessions are scoped to conversations

## Validation

- [ ] `curl -X POST .../api/conversations/:id/app-sessions -d '{"appId":"chess"}'` creates session
- [ ] `curl .../api/conversations/:id/app-sessions` lists sessions
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- If the adapter registry doesn't have the adapter registered yet (Chess adapter is M4), use the NoopAdapter for initial testing
