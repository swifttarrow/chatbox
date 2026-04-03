# Task 004: WebSocket Chat Protocol

## Purpose

Define and implement the WebSocket message types for chat, and wire the run orchestrator to the WebSocket gateway so users can send messages and receive streaming responses over the persistent connection.

## Inputs

- Spec: `docs/specs/m2-streaming-chat/README.md`
- Files: `server/src/ws/gateway.ts`, `server/src/ws/types.ts`, `server/src/orchestrator/run.ts`

## Outputs

- Modify: `server/src/ws/types.ts` (add chat message types)
- Create: `server/src/ws/handlers/chat.ts` (handle incoming chat messages, drive orchestrator)
- Modify: `server/src/ws/gateway.ts` (route incoming messages to handlers)

## Dependencies

- Prior task: `003-run-orchestrator.md`
- Required artifacts: `server/src/orchestrator/run.ts`, `server/src/ws/gateway.ts`, `server/src/ws/types.ts`

## Constraints

- All WebSocket messages are JSON envelopes with `type` field
- Client sends `chat.user_message` with `{ conversationId, content }`
- Server sends `chat.assistant_chunk` with `{ conversationId, runId, delta }`
- Server sends `chat.assistant_done` with `{ conversationId, runId, messageId, usage }`
- Server sends `chat.error` with `{ conversationId, runId?, error }`
- One run at a time per conversation (reject if a run is already in progress)
- The handler iterates over the orchestrator's async generator and sends each event as a WS message

## Required Changes

1. Add to `server/src/ws/types.ts`:
   - Client message types: `chat.user_message`
   - Server message types: `chat.assistant_chunk`, `chat.assistant_done`, `chat.error`
   - Type definitions for each message's payload
2. Create `server/src/ws/handlers/chat.ts`:
   - `handleChatMessage(ws, userId, message)` async function
   - Validate: `conversationId` and `content` present
   - Call `executeRun(content, { conversationId, userId })`
   - Iterate over yielded events:
     - `text_delta` -> send `chat.assistant_chunk` to the user's connection
     - `done` -> send `chat.assistant_done`
     - `error` -> send `chat.error`
   - Track active runs per conversation to prevent concurrent runs
3. Modify `server/src/ws/gateway.ts`:
   - On message received: parse JSON, switch on `type`
   - Route `chat.user_message` to `handleChatMessage`
   - Unknown types: send `error` message back

## Acceptance Criteria

- [ ] Client can send `{ type: "chat.user_message", conversationId: "...", content: "Hello" }` over WebSocket
- [ ] Server streams back `chat.assistant_chunk` messages with text deltas
- [ ] Server sends `chat.assistant_done` when streaming is complete
- [ ] Server sends `chat.error` if something fails
- [ ] Concurrent messages to the same conversation are rejected while a run is in progress
- [ ] Messages to non-existent conversations return an error

## Validation

- [ ] Using wscat (install via `npm install -g wscat`): connect, send a chat.user_message, observe assistant_chunk and assistant_done messages
- [ ] `pnpm --filter @chatbox/server build` compiles without errors
- [ ] Database has both user and assistant messages after the exchange

## Stop and Ask

- If the WebSocket gateway from M1 task 004 has a different message dispatch pattern than expected, adapt rather than rewrite
