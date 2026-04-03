# Task 007: Completion Signaling & Context Retention

## Purpose

Implement game completion detection and signaling, and ensure the model retains awareness of app state across conversation turns. After a chess game ends, the model should know the result and be able to discuss it.

## Inputs

- Spec: `docs/specs/m4-chess-vertical/README.md`
- Files: `server/src/apps/adapters/chess.ts`, `server/src/orchestrator/run.ts`, `server/src/orchestrator/context.ts`, `server/src/apps/sessions.ts`

## Outputs

- Modify: `server/src/ws/handlers/app-events.ts` (handle completion signaling)
- Modify: `server/src/orchestrator/context.ts` (inject app snapshots into model context)
- Modify: `server/src/apps/adapters/chess.ts` (completion detection refinement)
- Modify: `src/renderer/components/bridge/AppContainer.tsx` (show game-over UI state)
- Modify: `src/renderer/packages/bridge/store.ts` (handle completion events)

## Dependencies

- Prior task: `006-app-state-patches.md`
- Required artifacts: All M4 files

## Constraints

- Completion detected server-side (checkmate, stalemate, draw, resignation)
- On completion: app session status set to `completed`, completion reason stored
- Model must see app state in subsequent turns (via snapshot in context)
- After game ends, chess tools should still work for `get_board_state` but not `make_move`
- The iframe shows a clear game-over state (result, option to start new game)

## Required Changes

1. Modify `server/src/ws/handlers/app-events.ts` (created in task 006):
   - In `handleAppUserAction`, add a check after the adapter returns: if `result.isComplete === true`:
     - Call `updateSessionStatus(appSessionId, 'completed')`
     - Store completion reason in domain state (e.g., `"checkmate_white"`, `"stalemate"`, `"draw"`)
     - Send `app.command` with type `game_over` to client (includes result and winner)
     - Insert a tool-role message into the conversation summarizing the game result (e.g., "Chess game ended: Checkmate. White wins in 24 moves.") so the model has this in its context for follow-up turns
   - This builds on the existing `handleAppUserAction` from task 006 — do not recreate the function, only extend the success path with completion logic

2. Modify `server/src/orchestrator/context.ts`:
   - In `buildModelContext`, include app snapshots for active AND recently completed sessions
   - Format snapshot as a tool-role message or system context addition:
     ```
     [Chess Game State]
     Status: Checkmate - White wins
     Final position: [FEN]
     Moves played: 24
     ```
   - For active games: include current board state
   - For completed games: include final result and summary

3. Modify `server/src/apps/adapters/chess.ts`:
   - Refine `getSnapshot` for completed games (include result, final position)
   - On tool call when game is over: return informative error ("Game is already over. Start a new game to play again.")
   - Note: resign functionality could be added as a user action from the iframe (button click → `app.user_action` with `action: 'resign'`), handled in `onUserAction`. No new tool definition needed — the model doesn't resign, the user does.

4. Modify `src/renderer/components/bridge/AppContainer.tsx`:
   - On completion: show game result overlay (e.g., "Checkmate! You win!" or "Stalemate - Draw")
   - Show "New Game" button that creates a new app session

5. Modify `src/renderer/packages/bridge/store.ts`:
   - Handle `app.completed` or completion-signaling WS message
   - Update local session state to reflect game over

## Acceptance Criteria

- [ ] Checkmate ends the game with correct winner displayed
- [ ] Stalemate/draw detected and displayed correctly
- [ ] After game ends, asking "how did the game go?" -> model references the result
- [ ] After game ends, asking "let's play again" -> new game starts (new app session)
- [ ] App session in DB has status `completed` after game ends
- [ ] Model context includes app state for active and recently completed sessions
- [ ] Board shows game-over state (no more moves allowed)

## Validation

- [ ] Play a game to checkmate; verify game-over UI and model awareness
- [ ] After game ends, send a message asking about the game; verify model knows the result
- [ ] Start a new game in the same conversation; verify it works independently
- [ ] Check database: app_sessions has one completed and one active session
- [ ] `pnpm --filter @chatbox/server build` and `pnpm build:web` compile without errors

## Stop and Ask

- If reaching checkmate is tedious for testing, use chess.js to set up a pre-checkmate FEN position and test from there
