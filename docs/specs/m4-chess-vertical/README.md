# Milestone 4: Chess Vertical Slice

## Outcome

A complete end-to-end chess experience works inside the chat. The user says "let's play chess," the model invokes the chess tool, a board appears in an iframe, the user makes moves, the model can analyze the board state, and the game ends naturally. This is the first full proof of the plugin contract: tool invocation -> iframe UI -> user interaction -> completion signaling -> context retention.

## Scope

- Chess app adapter on the server (move validation, game state, FEN tracking)
- Chess app iframe UI (interactive board, legal move display, game status)
- postMessage protocol implementation (host <-> iframe typed envelopes)
- Iframe mounting component in chatbox client
- Tool execution flow: model emits tool call -> server executes via adapter -> result returned to model
- User action flow: iframe emits move -> host validates envelope -> server validates move -> state updated
- Completion signaling: game over detected -> app session marked complete -> model informed
- Context retention: model can reference board state in subsequent turns

## Out of Scope

- Multiple apps in one conversation (M5)
- OAuth or external APIs (M6)
- Sophisticated error recovery UI (M6 -- basic error states only here)

## Source Inputs

- PRD: `docs/chat-bridge/prd.md` (Chess requirements section)
- Architecture: `docs/chat-bridge/architecture.md`
- Pre-search: `docs/chat-bridge/pre-search.md`

## Constraints

- Chess logic must use `chess.js` library for move validation and FEN generation
- Board UI must use `react-chessboard` or equivalent in the iframe app
- Iframe served from `apps/chess/` as a separate build (Vite single-page app)
- Iframe sandbox attributes: `allow-scripts` only (no `allow-same-origin` unless required for rendering)
- All chess state is server-authoritative; iframe is a view
- postMessage envelopes must include: `protocolVersion`, `appSessionId`, `eventId`, `type`, `payload`
- The chatbox host validates postMessage origin before forwarding to server

## Decisions

- **Chess library**: `chess.js` for game logic (MIT, well-maintained, handles all rules)
- **Board UI**: `react-chessboard` (React component, customizable, works in iframe)
- **App build**: Separate Vite project in `apps/chess/` producing a standalone `index.html` + assets
- **Iframe serving**: Dev: Vite dev server on separate port; Prod: static files served by ChatBridge server or separate static host
- **Move flow**: User clicks -> iframe sends `app.user_action` with `{from, to, promotion?}` -> host forwards -> server validates via chess.js -> server sends `app.state_patch` with new FEN + move history -> iframe updates board

## Assumptions

- M3 app adapter interface, app session lifecycle, and dynamic tool injection are complete
- M2 run orchestrator handles tool calls (routes to adapter)
- M1 WebSocket gateway is working

## Task Order

1. `001-postmessage-protocol.md` - Implement typed postMessage envelope library (shared types + host validation)
2. `002-iframe-host-component.md` - Chatbox client component that mounts/manages app iframes
3. `003-chess-adapter.md` - Server-side chess adapter: tool handlers, move validation, state management
4. `004-tool-execution-flow.md` - Wire run orchestrator to execute tool calls via app adapters; auto-create sessions; iframe mount trigger
5. `005-chess-iframe-app.md` - Build the chess iframe app (board UI, postMessage integration)
6. `006-app-state-patches.md` - Server -> host -> iframe state patch flow for user actions (moves)
7. `007-completion-and-context.md` - Game completion signaling, context retention for follow-up turns
8. `008-reconnect-and-restore.md` - Restore active app sessions on page refresh and WebSocket reconnect

## Milestone Success Criteria

- User sends "let's play chess" -> model responds and chess board appears in chat
- User clicks a piece and makes a legal move -> board updates -> server state updated
- User makes an illegal move -> error message shown (not a crash)
- User asks "what should I do?" mid-game -> model analyzes current FEN and suggests a move
- Game reaches checkmate/stalemate -> board shows result -> model acknowledges game end
- Refreshing the page restores the chess board in its current state
- Conversation history includes tool call/result messages

## Milestone Validation

- Play a complete chess game through the chat interface
- Verify `app_sessions` row has correct FEN after each move
- Verify `messages` table includes tool call and tool result entries
- Ask the model about the game after it ends; confirm it references the result
- `pnpm --filter server build` and `pnpm build:web` compile without errors
- Iframe loads without console errors; postMessage communication visible in DevTools

## Risks / Follow-ups

- `react-chessboard` may need specific sandbox permissions; test early
- Model may not reliably detect "let's play chess" without system prompt tuning -- include chess tool description in system prompt
- FEN strings in model context must be compact to avoid token bloat
