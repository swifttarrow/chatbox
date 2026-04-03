# Milestone 2: Streaming Chat via ChatBridge

## Outcome

Users can chat with an AI model through the ChatBridge server. The chatbox client connects to ChatBridge via WebSocket, sends user messages, and receives streaming assistant responses. Conversations and messages are persisted in PostgreSQL. The existing chatbox UI renders streamed tokens in real time. This replaces direct client-to-LLM calls for bridge-enabled conversations.

## Scope

- Server-side AI provider integration using Vercel AI SDK
- Conversation CRUD REST endpoints
- Message persistence (user + assistant messages)
- WebSocket message types for chat: `chat.user_message`, `chat.assistant_chunk`, `chat.assistant_done`, `chat.error`
- Run orchestrator skeleton: create run, call model, stream response, persist result
- Chatbox client: new bridge WebSocket client, bridge-aware message submission, streaming token rendering
- Conversation history loading on session open

## Out of Scope

- Tool/function calling (M3-M4)
- App registration or iframe rendering (M3-M4)
- Multi-provider selection UI (use a single configurable provider for MVP)
- Platform auth (M6 -- use placeholder user ID for now)

## Source Inputs

- PRD: `docs/chat-bridge/prd.md`
- Architecture: `docs/chat-bridge/architecture.md`
- Pre-search: `docs/chat-bridge/pre-search.md`

## Constraints

- Use Vercel AI SDK (`ai` package) on the server for model calls -- same SDK the client already uses
- Streaming must happen over the existing WebSocket connection (no separate SSE endpoint)
- Messages stored in the `messages` table with role, content, token counts
- Conversation runs stored in `conversation_runs` table
- The client bridge module must not break existing direct-to-LLM chat functionality; bridge mode is opt-in per conversation or via config flag

## Decisions

- **Provider**: Anthropic Claude via `@ai-sdk/anthropic` on the server (configurable via env var `LLM_PROVIDER` and `LLM_API_KEY`)
- **Streaming format**: Each WebSocket frame is a JSON envelope with `type` field; assistant chunks carry `delta` text
- **Run model**: Each user message creates a `conversation_run` row; run steps track model call start/end/tokens

## Assumptions

- M1 server, database, and WebSocket gateway are complete and working
- A valid LLM API key is available as an environment variable on the server

## Task Order

1. `001-server-ai-provider.md` - Integrate Vercel AI SDK on the server with streaming support
2. `002-conversation-api.md` - REST endpoints for conversation CRUD and message history
3. `003-run-orchestrator.md` - Run lifecycle: receive user message over WS, call model, stream response, persist
4. `004-ws-chat-protocol.md` - Define and implement chat-specific WebSocket message types
5. `005-client-bridge-module.md` - Chatbox client WebSocket client and bridge integration
6. `006-client-bridge-store.md` - Extend bridge store with conversation CRUD, message state, and streaming handlers
7. `007-client-chat-ui.md` - Bridge chat UI components: message rendering, conversation sidebar, layout, route

## Milestone Success Criteria

- User types a message in chatbox -> message appears in UI -> streamed assistant response renders token by token
- Refreshing the page reloads the conversation from the server (persistent history)
- Multiple conversations can be created and switched between
- `conversation_runs` and `messages` tables populated correctly after each exchange

## Milestone Validation

- Send a message via the chatbox UI with bridge mode enabled; observe streaming response
- `SELECT * FROM messages WHERE conversation_id = '...'` shows both user and assistant messages
- Open a new browser tab, navigate to the same conversation, see full history
- `pnpm --filter server build` compiles without errors
- `pnpm build:web` compiles the client without errors

## Risks / Follow-ups

- Token counting accuracy depends on provider; Vercel AI SDK provides usage info for most providers
- The bridge module adds a new code path to the client; careful to isolate from existing stores
