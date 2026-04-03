# Task 003: Run Orchestrator

## Purpose

Implement the run orchestrator that manages the lifecycle of a single conversation turn: receive a user message, persist it, call the LLM, stream the response, and persist the assistant message. This is the central control loop that all future tool-calling and app integration builds on.

## Inputs

- Spec: `docs/specs/m2-streaming-chat/README.md`
- Files: `server/src/ai/stream.ts`, `server/src/db/schema.ts`, `server/src/db/index.ts`

## Outputs

- Create: `server/src/orchestrator/run.ts` (run lifecycle management)
- Create: `server/src/orchestrator/context.ts` (context assembly: build messages array for model)
- Create: `server/src/orchestrator/types.ts` (run-related types)

## Dependencies

- Prior task: `002-conversation-api.md` (conversations exist in DB)
- Required artifacts: `server/src/ai/stream.ts`, `server/src/db/schema.ts`

## Constraints

- Each user message triggers exactly one run
- Run status transitions: `created` -> `streaming_model` -> `succeeded` (or `failed`)
- The orchestrator must persist: the user message, the run record, run steps, and the assistant message
- Context assembly must load conversation message history and build the messages array for the model
- Token counts from the model response must be stored on the run and assistant message
- The orchestrator returns an async iterable of streaming events (text deltas, done, error) -- it does NOT handle WebSocket sending directly
- System prompt (used as the first message in the messages array):
  ```
  You are a helpful AI assistant. Answer questions clearly and concisely. When you don't know something, say so honestly.
  ```
  This baseline prompt is extended in M5-005 with multi-app awareness. For now, keep it simple.

## Required Changes

1. Create `server/src/orchestrator/types.ts`:
   - `RunEvent` discriminated union: `{ type: 'text_delta', delta: string }`, `{ type: 'done', usage: { input: number, output: number } }`, `{ type: 'error', error: string }`
   - `RunContext`: `{ conversationId: string, userId: string }`
2. Create `server/src/orchestrator/context.ts`:
   - `buildModelContext(conversationId: string)`: load messages from DB, format as Vercel AI SDK messages array
   - Include system prompt as first message
   - Order by `created_at` ascending
   - For now, include all messages (pruning/compaction is a later optimization)
3. Create `server/src/orchestrator/run.ts`:
   - `executeRun(userMessage: string, context: RunContext)`: async generator yielding `RunEvent`
   - Steps:
     1. Insert user message into `messages` table
     2. Create `conversation_runs` record with status `created`
     3. Build model context via `buildModelContext`
     4. Update run status to `streaming_model`
     5. Call `streamChatCompletion` with context
     6. Yield `text_delta` events as they arrive
     7. On completion: insert assistant message, update run to `succeeded` with token counts
     8. Yield `done` event
     9. On error: update run to `failed`, yield `error` event

## Acceptance Criteria

- [ ] `executeRun()` returns an async generator of `RunEvent`
- [ ] User message is persisted before model call begins
- [ ] Run record tracks status transitions and token usage
- [ ] Assistant response is persisted after streaming completes
- [ ] Error during model call results in `failed` run status and `error` event
- [ ] Context includes full conversation history

## Validation

- [ ] `pnpm --filter @chatbox/server build` compiles without errors
- [ ] Write a temporary test that calls `executeRun("Hello", { conversationId, userId })` and logs all yielded events (verify text deltas arrive)
- [ ] After run: `SELECT * FROM messages WHERE conversation_id = '...'` shows user + assistant messages
- [ ] After run: `SELECT * FROM conversation_runs WHERE conversation_id = '...'` shows completed run with token counts

## Stop and Ask

- If the Vercel AI SDK streaming API differs from expected (e.g., `streamText` return shape), investigate the SDK docs before adapting
