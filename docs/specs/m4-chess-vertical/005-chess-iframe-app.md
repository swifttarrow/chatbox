# Task 005: Chess Iframe App

## Purpose

Build the chess iframe application -- a standalone React app that renders an interactive chess board, communicates with the host via postMessage, and displays game state received from the server.

## Inputs

- Spec: `docs/specs/m4-chess-vertical/README.md`
- Files: `src/shared/bridge/protocol.ts` (postMessage types)

## Outputs

- Create: `apps/chess/package.json`
- Create: `apps/chess/vite.config.ts`
- Create: `apps/chess/tsconfig.json`
- Create: `apps/chess/index.html`
- Create: `apps/chess/src/main.tsx` (React entry point)
- Create: `apps/chess/src/App.tsx` (main chess app component)
- Create: `apps/chess/src/components/Board.tsx` (chess board using react-chessboard)
- Create: `apps/chess/src/bridge.ts` (postMessage communication with host)
- Create: `apps/chess/src/bridge-protocol.ts` (copy of `src/shared/bridge/protocol.ts`, adapted for standalone use)
- Create: `apps/chess/src/bridge-constants.ts` (copy of `src/shared/bridge/constants.ts`)
- Create: `apps/chess/src/types.ts` (chess-specific types: `ChessDomainState`, `ChessMove`, matching server adapter's domain state shape from M4-003)
- Modify: `pnpm-workspace.yaml` (add `apps/*` to workspace packages)

## Dependencies

- Prior task: `001-postmessage-protocol.md` (protocol types)
- Required artifacts: `src/shared/bridge/protocol.ts`

## Constraints

- Standalone Vite + React + TypeScript project in `apps/chess/`
- Must work inside a sandboxed iframe
- Uses `react-chessboard` for the board UI
- Communicates ONLY via `window.parent.postMessage` and `window.addEventListener('message')`
- Never accesses parent DOM, localStorage, or cookies
- Board orientation matches player color
- Shows: current turn indicator, move history, game status (check, checkmate, draw)
- Clicking a piece shows legal move highlights (via react-chessboard)
- On move: sends `app.user_action` with `{action: 'make_move', data: {from, to, promotion}}`
- On receiving `app.state_patch`: updates board to new FEN

## Required Changes

1. Add `apps/*` to `pnpm-workspace.yaml` packages
2. Create `apps/chess/package.json`:
   - name: `@chatbox/chess-app`
   - dependencies: `react`, `react-dom`, `react-chessboard`, `chess.js` (for client-side display only)
   - devDependencies: `vite`, `@vitejs/plugin-react`, `typescript`
3. Create `apps/chess/vite.config.ts`:
   - React plugin, dev server on port 3200
   - Build output to `dist/`
4. Create `apps/chess/src/bridge.ts`:
   - `sendToHost(type, payload)`: create envelope and postMessage to parent
   - `onHostMessage(callback)`: listen for validated messages from host
   - Extract `appSessionId` from URL query params
   - On load: send `app.ready` to host
5. Create `apps/chess/src/App.tsx`:
   - Initialize bridge communication
   - State: `fen`, `playerColor`, `gameStatus`, `moveHistory`, `isMyTurn`
   - On `app.init`: set initial state from payload
   - On `app.state_patch`: update FEN, move history, game status
   - On `app.dispose`: show game ended
   - Render Board component + status panel
6. Create `apps/chess/src/components/Board.tsx`:
   - Use `Chessboard` from `react-chessboard`
   - Props: `fen`, `playerColor`, `onMove`, `disabled`
   - `onPieceDrop(from, to)`: call onMove callback
   - Board orientation based on player color
   - Legal move highlights (use chess.js locally for display)
   - Disable interaction when not user's turn or game over

## Acceptance Criteria

- [ ] `pnpm --filter @chatbox/chess-app dev` starts on port 3200
- [ ] Chess board renders with correct starting position
- [ ] Clicking a piece shows legal move squares
- [ ] Dragging a piece to a legal square sends `app.user_action` via postMessage
- [ ] Receiving `app.state_patch` updates the board position
- [ ] Board orientation flips based on player color
- [ ] Game status displayed (whose turn, check, checkmate, draw)
- [ ] Move history displayed as a scrollable list
- [ ] App sends `app.ready` on load

## Validation

- [ ] Open `http://localhost:3200` directly -- board should render (without postMessage, just static)
- [ ] Open in iframe context with the host component -- full communication flow works
- [ ] `pnpm --filter @chatbox/chess-app build` produces `apps/chess/dist/index.html`
- [ ] No console errors about CSP or sandbox violations

## Bridge Protocol Types

The shared bridge types from `src/shared/bridge/protocol.ts` and `src/shared/bridge/constants.ts` (created in M4-001) are not directly importable from the iframe app (separate Vite project, no access to `@shared/*` path aliases).

**Required**: Copy `src/shared/bridge/protocol.ts` and `src/shared/bridge/constants.ts` into `apps/chess/src/bridge-protocol.ts` and `apps/chess/src/bridge-constants.ts`. Strip any imports that reference `@shared/` paths. These are small files (~100 lines each) and duplication is acceptable for 2-3 apps.

The `bridge.ts` file in this app must import from these local copies and use the same message types and envelope format as the host.

## Stop and Ask

- If `react-chessboard` doesn't work inside a sandboxed iframe (e.g., needs `allow-same-origin` for SVG pieces), test and adjust sandbox flags in the host component
