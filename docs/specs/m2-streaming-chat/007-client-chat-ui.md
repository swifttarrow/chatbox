# Task 007: Bridge Chat UI & Conversation Sidebar

## Purpose

Create the visual components for bridge-mode chat: a conversation sidebar for listing/creating/switching conversations, and a BridgeChat component that renders messages with streaming. This task consumes the store and hooks from task 006.

## Inputs

- Spec: `docs/specs/m2-streaming-chat/README.md`
- Files: `src/renderer/packages/bridge/hooks.ts` (from task 006), `src/renderer/packages/bridge/store.ts`, `src/renderer/components/chat/Message.tsx` (existing, for reference)

## Outputs

- Create: `src/renderer/components/bridge/BridgeChat.tsx` (main chat view: message list + input)
- Create: `src/renderer/components/bridge/BridgeConversationList.tsx` (sidebar: conversation list + new conversation button)
- Create: `src/renderer/components/bridge/BridgeLayout.tsx` (layout combining sidebar + chat)
- Create: `src/renderer/components/bridge/BridgeMessageItem.tsx` (single message rendering)
- Create: `src/renderer/routes/bridge.tsx` (route for bridge mode at `/bridge`)

## Dependencies

- Prior task: `006-client-bridge-store.md`
- Required artifacts: `src/renderer/packages/bridge/hooks.ts`, `src/renderer/packages/bridge/types.ts`

## Constraints

- Use Mantine components for UI consistency (already in project: `@mantine/core`)
- Implement as a standalone route at `/bridge` (avoids modifying the existing session routing)
- Message rendering should visually match the existing chat style but use `BridgeMessage` data
- Do NOT reuse the existing `Message.tsx` directly (its props expect the chatbox `Message` type with `contentParts`, `cancel`, `generating`, etc.) — create a simpler `BridgeMessageItem` that handles `BridgeMessage`
- The sidebar must support: listing conversations (most recent first), creating a new conversation, selecting a conversation, deleting a conversation
- Auto-scroll to bottom when new messages arrive
- Show a typing indicator (animated dots) when `streamingState` is `'waiting'` or `'streaming'`

## Required Changes

1. Create `src/renderer/components/bridge/BridgeMessageItem.tsx`:
   - Props: `message: BridgeMessage`, `isStreaming?: boolean`
   - Render: avatar (user/assistant icon), role label, message content as markdown
   - For assistant messages during streaming: show `streamingContent` with a blinking cursor
   - For tool messages: show tool name and result in a collapsible panel
   - Use Mantine `Paper`, `Text`, `Avatar` components

2. Create `src/renderer/components/bridge/BridgeChat.tsx`:
   - Uses `useBridgeChat()` hook
   - Renders message list (scrollable, auto-scroll to bottom on new message)
   - Renders typing indicator when `streamingState !== 'idle'`
   - Renders input area at bottom: text input + send button
   - Input sends message via `sendMessage()` on Enter or button click
   - Disabled input while streaming (prevent double-send)
   - Shows "No conversation selected" when `currentConversationId` is null

3. Create `src/renderer/components/bridge/BridgeConversationList.tsx`:
   - Uses `useBridgeConversations()` hook
   - Renders list of conversations with title and date
   - "New Conversation" button at top
   - Click on conversation: calls `selectConversation(id)` which calls `loadConversation(id)` from store
   - Right-click or menu: delete conversation option
   - Active conversation highlighted
   - Calls `loadConversations()` on mount

4. Create `src/renderer/components/bridge/BridgeLayout.tsx`:
   - Two-panel layout: sidebar (250px, collapsible) + main chat area
   - Sidebar renders `BridgeConversationList`
   - Main area renders `BridgeChat`
   - Initiates bridge WebSocket connection on mount via store's `connect()`
   - Cleans up connection on unmount via store's `disconnect()`

5. Create `src/renderer/routes/bridge.tsx`:
   - Register route at `/bridge` using TanStack Router's `createFileRoute`
   - Renders `BridgeLayout`
   - Example:
     ```typescript
     import { createFileRoute } from '@tanstack/react-router'
     import { BridgeLayout } from '@/components/bridge/BridgeLayout'

     export const Route = createFileRoute('/bridge')({
       component: BridgeLayout,
     })
     ```

## Acceptance Criteria

- [ ] Navigating to `/bridge` shows the bridge layout with sidebar and chat
- [ ] Sidebar lists existing conversations from the server
- [ ] Clicking "New Conversation" creates one and selects it
- [ ] Typing a message and pressing Enter sends it; user message appears immediately
- [ ] Assistant response streams in token by token with typing indicator
- [ ] Refreshing the page at `/bridge` reconnects and reloads conversations
- [ ] Switching conversations loads the correct message history
- [ ] Existing routes (`/`, `/session/:id`) remain unaffected
- [ ] `pnpm build:web` compiles without errors

## Validation

- [ ] Open `http://localhost:5173/bridge` in browser
- [ ] Create a conversation, send a message, see streaming response
- [ ] Create a second conversation, switch between them
- [ ] Refresh page — conversations and messages persist
- [ ] Navigate to `/` — existing chatbox UI works as before

## Stop and Ask

- If TanStack Router file-based routing doesn't support adding `/bridge` easily (e.g., requires config changes), use a manual route definition instead
- If Mantine components are not importable in this context, use plain HTML/CSS with Tailwind
