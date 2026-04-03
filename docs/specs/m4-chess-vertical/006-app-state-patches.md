# Task 006: State Patch Flow (Server -> Host -> Iframe)

## Purpose

Implement the full state patch pipeline: when a user makes a move via the iframe, the host forwards it to the server, the server validates and updates state, and sends the new state back through the host to the iframe. Also handle the reverse: user actions from iframe flowing up to the server.

## Inputs

- Spec: `docs/specs/m4-chess-vertical/README.md`
- Files: `server/src/ws/gateway.ts`, `server/src/orchestrator/tool-executor.ts`, `src/renderer/components/bridge/AppIframe.tsx`, `src/renderer/packages/bridge/store.ts`

## Outputs

- Create: `server/src/ws/handlers/app-events.ts` (handle app events from client)
- Modify: `server/src/ws/gateway.ts` (route app event messages)
- Modify: `server/src/ws/types.ts` (add user action WS types)
- Modify: `src/renderer/packages/bridge/store.ts` (handle app commands from server, forward to iframe)
- Modify: `src/renderer/components/bridge/AppIframe.tsx` (receive and forward server commands)

## Dependencies

- Prior task: `004-tool-execution-flow.md`, `005-chess-iframe-app.md`
- Required artifacts: All files listed in Inputs

## Constraints

- User action flow: iframe -> postMessage -> host validates -> WS to server -> adapter validates -> state update -> WS state_patch to host -> postMessage to iframe
- The server is the single source of truth for domain state
- The host validates envelope structure but does NOT validate game logic
- State patches include the new `stateVersion` for consistency
- If the server rejects an action (invalid move), send an error back through the same path

## Required Changes

1. Add WS message types to `server/src/ws/types.ts`:
   - Client -> server: `app.user_action` (forwarded from iframe via host)
   - Server -> client: `app.state_patch`, `app.command`, `app.error`

2. Create `server/src/ws/handlers/app-events.ts`:
   - `handleAppUserAction(ws, userId, message)`:
     - Extract `appSessionId`, `action`, `payload`
     - Call `handleUserAction(action, payload, appSessionId)` from tool-executor
     - If success: send `app.state_patch` back to client with new domain state
     - If error: send `app.error` back to client
     - After user action in chess (if AI's turn): execute AI move, send another state_patch
   - **Note:** Completion handling (`isComplete`) is deferred to task 007. This task handles the core move → validate → patch cycle only.

3. Modify `server/src/ws/gateway.ts`:
   - Route `app.user_action` messages to `handleAppUserAction`

4. Modify `src/renderer/packages/bridge/store.ts`:
   - Handle incoming `app.state_patch` messages from WS
   - Route to the correct iframe by `appSessionId`
   - Handle `app.error` messages (display in UI)

5. Modify `src/renderer/components/bridge/AppIframe.tsx`:
   - Add method to receive commands from the store and forward via postMessage to iframe
   - Use `useEffect` to subscribe to incoming app commands for this session

## Acceptance Criteria

- [ ] User clicks a piece in iframe -> move sent to server -> server validates -> new state sent back -> board updates
- [ ] Invalid move -> error sent back -> iframe shows error (board doesn't change)
- [ ] AI opponent move -> state_patch sent -> board updates with opponent's move
- [ ] State version increments on each successful move
- [ ] Full round trip < 500ms for a local setup

## Validation

- [ ] Play a chess game through the full UI: make moves, see board update, see AI respond
- [ ] Make an illegal move: verify board doesn't change and error is shown
- [ ] Check `app_sessions` table: domain_state reflects the current board position
- [ ] `pnpm --filter @chatbox/server build` and `pnpm build:web` compile without errors

## Stop and Ask

- If the WebSocket message routing becomes complex (many message types), consider adding a message dispatcher pattern rather than nested if/switch
