# Task 006: Client Bridge Store — Conversations & Streaming State

## Purpose

Extend the bridge Zustand store with conversation management (CRUD via REST API) and streaming state (partial assistant message, chunk accumulation). This provides the data layer that the UI components in task 007 will consume.

## Inputs

- Spec: `docs/specs/m2-streaming-chat/README.md`
- Files: `src/renderer/packages/bridge/store.ts` (from task 005), `src/renderer/packages/bridge/client.ts`
- Server endpoints: `GET /api/conversations`, `GET /api/conversations/:id`, `POST /api/conversations`, `DELETE /api/conversations/:id`

## Outputs

- Modify: `src/renderer/packages/bridge/store.ts` (add conversation + streaming state and actions)
- Create: `src/renderer/packages/bridge/hooks.ts` (React hooks wrapping store selectors)
- Modify: `src/renderer/packages/bridge/types.ts` (add BridgeMessage, BridgeConversation types)

## Dependencies

- Prior task: `005-client-bridge-module.md`
- Required artifacts: `src/renderer/packages/bridge/store.ts`, `src/renderer/packages/bridge/client.ts`

## Constraints

- All REST calls use the bridge server URL from config (same base as WebSocket)
- Conversation and message types are independent of the existing chatbox `Message`/`Session` types — define `BridgeMessage` and `BridgeConversation` types specific to the bridge
- Streaming state must support: idle, waiting (user message sent, no tokens yet), streaming (tokens arriving), done
- The store must NOT import from or modify existing chatbox stores (`chatStore.ts`, `settingsStore.ts`)

## Required Changes

1. Add to `src/renderer/packages/bridge/types.ts`:
   ```typescript
   interface BridgeConversation {
     id: string
     title: string
     createdAt: string
     updatedAt: string
   }

   interface BridgeMessage {
     id: string
     role: 'user' | 'assistant' | 'system' | 'tool'
     content: string
     toolCallId?: string
     toolName?: string
     createdAt: string
   }

   type StreamingState = 'idle' | 'waiting' | 'streaming' | 'done'
   ```

2. Extend `src/renderer/packages/bridge/store.ts`:
   - **Conversation state:**
     - `conversations: BridgeConversation[]`
     - `currentConversationId: string | null`
     - `loadConversations()`: `GET /api/conversations` → set `conversations`
     - `loadConversation(id: string)`: `GET /api/conversations/:id` → set `messages`, `currentConversationId`
     - `createConversation(title?: string)`: `POST /api/conversations` → add to `conversations`, set as current
     - `deleteConversation(id: string)`: `DELETE /api/conversations/:id` → remove from `conversations`
   - **Message state:**
     - `messages: BridgeMessage[]` (for the current conversation)
     - `streamingContent: string` (partial assistant response being built up)
     - `streamingState: StreamingState`
   - **Streaming handlers** (called from the WebSocket client's onMessage):
     - On `chat.assistant_chunk`: append `delta` to `streamingContent`, set `streamingState: 'streaming'`
     - On `chat.assistant_done`: create final `BridgeMessage` from `streamingContent`, push to `messages`, clear `streamingContent`, set `streamingState: 'done'`
     - On `chat.error`: set error state, clear streaming state
   - **Send action:**
     - `sendMessage(content: string)`: push a local user `BridgeMessage` to `messages`, send `chat.user_message` over WS, set `streamingState: 'waiting'`

3. Create `src/renderer/packages/bridge/hooks.ts`:
   - `useBridgeConversations()`: returns `{ conversations, currentConversationId, loadConversations, createConversation, deleteConversation, selectConversation }`
   - `useBridgeChat()`: returns `{ messages, streamingContent, streamingState, sendMessage, connectionStatus }`
   - Each hook uses `useStore` with selectors for minimal re-renders

## Acceptance Criteria

- [ ] `loadConversations()` fetches and stores conversation list from server
- [ ] `createConversation()` creates on server and adds to local state
- [ ] `sendMessage()` adds user message to local state and sends over WS
- [ ] Incoming `chat.assistant_chunk` messages accumulate in `streamingContent`
- [ ] `chat.assistant_done` finalizes the assistant message in `messages`
- [ ] `useBridgeChat()` and `useBridgeConversations()` hooks return correct data
- [ ] No imports from existing chatbox stores

## Validation

- [ ] Call `loadConversations()` from browser console; verify conversations state populated
- [ ] Call `sendMessage("Hello")` with active WS; verify user message in state and streaming begins
- [ ] `pnpm build:web` compiles without errors

## Stop and Ask

- If the server REST API response format differs from the types defined here, adapt the types to match the server
