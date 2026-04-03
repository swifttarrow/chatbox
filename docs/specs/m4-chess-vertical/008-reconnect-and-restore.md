# Task 008: Reconnect & Restore Active App Sessions

## Purpose

When a user refreshes the page or reconnects after a network drop, active app sessions must be restored: the iframe remounted, domain state replayed, and the board (or other app UI) returned to its current position. Without this, any page refresh loses the active game.

## Inputs

- Spec: `docs/specs/m4-chess-vertical/README.md`
- Files: `src/renderer/packages/bridge/store.ts`, `src/renderer/components/bridge/AppIframe.tsx`, `src/renderer/components/bridge/BridgeLayout.tsx`, `server/src/routes/app-sessions.ts`

## Outputs

- Modify: `src/renderer/packages/bridge/store.ts` (restore app sessions on reconnect)
- Modify: `src/renderer/components/bridge/BridgeLayout.tsx` (created in M2-007; ensure AppContainer renders when activeAppSessions is populated after restore)
- Modify: `src/renderer/components/bridge/AppIframe.tsx` (handle re-init with existing state)

## Dependencies

- Prior task: `007-completion-and-context.md`
- Required artifacts: `src/renderer/packages/bridge/store.ts` (with `activeAppSessions`), server REST API for app sessions

## Constraints

- On reconnect/page load: fetch active app sessions for the current conversation via `GET /api/conversations/:id/app-sessions`
- For each active session: populate `activeAppSessions` in the store, which triggers `AppContainer` rendering
- When the iframe sends `app.ready`, the host sends `app.init` with the current `domainState` from the server (already handled in M4-002's AppIframe component)
- Completed sessions should be shown in their final state (game-over overlay) but not re-mounted as interactive
- The server is the source of truth — the client never caches domain state across page loads

## Required Changes

1. Modify `src/renderer/packages/bridge/store.ts`:
   - Add `restoreAppSessions(conversationId: string)`:
     - Fetch `GET /api/conversations/:conversationId/app-sessions`
     - For each session with status `active`: add to `activeAppSessions` map with `{ appId, appSessionId, uiUrl, domainState, status: 'active' }`
     - For each session with status `completed`: add with `status: 'completed'` (shown as read-only)
   - Call `restoreAppSessions()` inside `loadConversation(id)` (from M2 task 006) after loading messages
   - Also call `restoreAppSessions()` on WebSocket reconnect if a `currentConversationId` is set

2. Modify `src/renderer/components/bridge/BridgeLayout.tsx` (created in M2-007):
   - When `activeAppSessions` changes from empty to populated, render `AppContainer` for each session
   - This should already work if `AppContainer` renders based on `activeAppSessions` (from M4-004's store changes)
   - Ensure completed sessions render with the game-over overlay, not an interactive iframe

3. Modify `src/renderer/components/bridge/AppIframe.tsx`:
   - On `app.ready` from the iframe after remount: send `app.init` with the restored `domainState`
   - The iframe receives the current board position and renders it (same flow as initial load)
   - No special "restore" message type needed — `app.init` with current state handles both first load and restore

## Acceptance Criteria

- [ ] Refresh the page mid-chess-game → board reappears in the correct position
- [ ] Refresh the page after game ends → game-over state shown correctly
- [ ] Network disconnect + reconnect → app sessions restored without user action
- [ ] Switching to a conversation with an active chess game → board appears
- [ ] Switching to a conversation with no app sessions → no iframe rendered
- [ ] Active session's `domainState` matches server after restore (verify FEN)

## Validation

- [ ] Start a chess game, make 3 moves, refresh the page → board shows all 3 moves played
- [ ] Complete a chess game, refresh → game-over overlay shown with correct result
- [ ] Open two browser tabs with the same conversation → both show the chess board
- [ ] `pnpm build:web` compiles without errors

## Stop and Ask

- If the `GET /api/conversations/:id/app-sessions` endpoint returns too much data (e.g., full event history), ensure it only returns current domain state and session metadata
