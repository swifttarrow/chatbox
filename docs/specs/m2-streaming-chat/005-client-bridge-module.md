# Task 005: Chatbox Client Bridge Module

## Purpose

Add a bridge module to the chatbox client that manages a WebSocket connection to the ChatBridge server. This module handles connection lifecycle, message sending/receiving, and exposes a clean API for the UI layer.

## Inputs

- Spec: `docs/specs/m2-streaming-chat/README.md`
- Files: `src/renderer/stores/chatStore.ts`, `src/renderer/stores/settingsStore.ts`
- WebSocket protocol: `server/src/ws/types.ts`

## Outputs

- Create: `src/renderer/packages/bridge/client.ts` (WebSocket client)
- Create: `src/renderer/packages/bridge/types.ts` (message types mirroring server)
- Create: `src/renderer/packages/bridge/store.ts` (Zustand store for bridge state)
- Create: `src/renderer/packages/bridge/index.ts` (public API)

## Dependencies

- Prior task: `004-ws-chat-protocol.md` (server protocol must be defined)
- Required artifacts: `server/src/ws/types.ts` (message type definitions to mirror)

## Constraints

- The bridge module must be opt-in: existing direct-to-LLM chat remains functional
- WebSocket URL configurable via settings (default: `ws://localhost:3100/ws`)
- Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- The Zustand store tracks: connection status, active runs, error state
- The client must handle: connection open/close, message parsing, type-safe dispatch
- Do NOT modify existing stores -- the bridge store is independent; integration happens in task 006

## Required Changes

1. Create `src/renderer/packages/bridge/types.ts`:
   - Mirror server message types: `ChatUserMessage`, `ChatAssistantChunk`, `ChatAssistantDone`, `ChatError`
   - `BridgeConnectionStatus`: `connecting`, `connected`, `disconnected`, `reconnecting`
2. Create `src/renderer/packages/bridge/client.ts`:
   - `BridgeClient` class:
     - `connect(url: string, userId: string)`: establish WebSocket connection
     - `disconnect()`: close connection
     - `send(message: object)`: send typed message
     - `onMessage(callback)`: register message handler
     - `onStatusChange(callback)`: register status handler
     - Auto-reconnect logic with exponential backoff
     - JSON parse/stringify with error handling
3. Create `src/renderer/packages/bridge/store.ts`:
   - Zustand store with:
     - `connectionStatus`: BridgeConnectionStatus
     - `bridgeUrl`: string (from settings)
     - `userId`: string (placeholder for now)
     - `activeRunId`: string | null
     - `connect()`: action to initiate connection
     - `disconnect()`: action to close connection
     - `sendChatMessage(conversationId: string, content: string)`: send user message
     - `onChunk`, `onDone`, `onError`: internal handlers that will be used by UI layer
4. Create `src/renderer/packages/bridge/index.ts`:
   - Re-export store, types, and client

## Acceptance Criteria

- [ ] `BridgeClient` connects to `ws://localhost:3100/ws` and stays connected
- [ ] Auto-reconnect works when server is restarted
- [ ] `sendChatMessage` sends a properly formatted `chat.user_message`
- [ ] Incoming `chat.assistant_chunk` messages are dispatched to registered handlers
- [ ] Connection status is tracked in Zustand store
- [ ] Module does not affect existing chat functionality

## Validation

- [ ] Import and call `connect()` from browser console; verify WebSocket opens in DevTools Network tab
- [ ] Send a message via `sendChatMessage`; observe server response in DevTools
- [ ] Stop the server; observe reconnection attempts in console
- [ ] `pnpm build:web` compiles without errors
- [ ] Existing `pnpm dev:web` chat functionality is unaffected

## Stop and Ask

- If the existing chatbox settings store structure makes it unclear where to add the bridge URL setting, ask before modifying settingsStore
