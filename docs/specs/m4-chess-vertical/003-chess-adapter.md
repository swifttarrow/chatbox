# Task 003: Chess App Adapter (Server-Side)

## Purpose

Implement the Chess adapter that handles tool calls from the model and user actions from the iframe. This adapter owns game logic: starting games, validating moves, tracking state (FEN), and detecting game end conditions.

## Inputs

- Spec: `docs/specs/m4-chess-vertical/README.md`
- Files: `server/src/apps/adapter.ts`, `server/src/apps/types.ts`

## Outputs

- Create: `server/src/apps/adapters/chess.ts` (Chess adapter implementation)
- Modify: `server/package.json` (add `chess.js` dependency)
- Modify: `server/src/apps/registry.ts` or startup (register chess adapter)

## Dependencies

- Prior task: none within M4 for server-side work (requires M3 adapter interface)
- Required artifacts: `server/src/apps/adapter.ts` (AppAdapter abstract class)

## Constraints

- Use `chess.js` library for all game logic (MIT license, well-maintained)
- Domain state shape: `{ fen: string, pgn: string, turn: 'w' | 'b', isCheck: boolean, isCheckmate: boolean, isDraw: boolean, isStalemate: boolean, isGameOver: boolean, moveHistory: string[], playerColor: 'white' | 'black' }`
- Move validation via chess.js -- reject invalid moves with clear error messages
- The adapter must NOT import WebSocket or Express -- it receives structured inputs and returns structured outputs

## Required Changes

1. Add `chess.js` to `server/package.json` dependencies
2. Create `server/src/apps/adapters/chess.ts`:

   **`getInitialState()`**: return default domain state (starting FEN, empty history, white to move)

   **`onToolCall(input)`**: handle three tools:
   - `start_chess_game`: create new Chess instance, set player color from params, return initial state + UI command to init iframe
   - `get_board_state`: return current FEN, turn, legal moves count, game status
   - `suggest_move`: analyze position (use chess.js to get legal moves, pick a reasonable one -- random or simple heuristic for MVP), return suggestion as text

   **`onUserAction(input)`**: handle user actions:
   - `make_move`: validate move `{from, to, promotion?}` via chess.js
     - If valid: update FEN, add to history, check for game end, return new state + UI patch
     - If game over after move: set `isComplete: true`
     - If invalid: return error with explanation
   - After user moves (if not game over): optionally trigger AI opponent move (simple: random legal move for MVP)

   **`getSnapshot(domainState, appSessionId)`**: return compact snapshot:
   ```typescript
   {
     app: 'chess',
     appSessionId,
     stateVersion: /* from session */,
     source: 'server_validated',
     summary: {
       fen: domainState.fen,
       turn: domainState.turn === 'w' ? 'white' : 'black',
       status: domainState.isGameOver ? 'game_over' : 'in_progress',
       lastMove: domainState.moveHistory.at(-1) ?? null,
       totalMoves: domainState.moveHistory.length,
       isCheck: domainState.isCheck
     }
   }
   ```

3. Register chess adapter in `server/src/apps/registry.ts` at startup

## Acceptance Criteria

- [ ] `start_chess_game` creates valid initial state
- [ ] `make_move` with valid move updates FEN correctly
- [ ] `make_move` with invalid move returns error (not crash)
- [ ] Game end detection works: checkmate, stalemate, draw
- [ ] `get_board_state` returns accurate state information
- [ ] `suggest_move` returns a legal move suggestion
- [ ] Snapshot is compact and includes essential game info
- [ ] AI opponent makes moves after user moves (simple random for MVP)

## Validation

- [ ] `pnpm --filter @chatbox/server build` compiles without errors
- [ ] Unit test or script: create adapter, call `onToolCall` with `start_chess_game`, then `onUserAction` with `make_move({from:'e2',to:'e4'})`, verify FEN changes
- [ ] Test invalid move: `make_move({from:'e2',to:'e5'})` returns error
- [ ] Test checkmate detection: set up a known checkmate FEN and verify `isGameOver`

## Stop and Ask

- If `chess.js` API has changed from expected (v1 vs v0), check the latest docs
