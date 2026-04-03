# ChatBridge API Documentation

## Overview

ChatBridge is a conversational platform that pairs an LLM-powered chat interface with interactive embedded applications ("apps"). Users converse with an assistant that can invoke tools; those tools may mount rich UI components rendered inside iframes alongside the chat. The system uses a REST API for CRUD operations, a WebSocket connection for real-time messaging, and a postMessage protocol for iframe communication.

---

## Authentication

Most endpoints require identification via one of:

- **Header:** `x-user-id: <userId>` (development / internal)
- **Header:** `Authorization: Bearer <jwt>` (production)

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Register a new user. Body: `{ email, password, name? }`. Returns JWT + user object. |
| POST | `/api/auth/signin` | Authenticate. Body: `{ email, password }`. Returns JWT + user object. |
| GET | `/api/auth/me` | Return the currently authenticated user profile. Requires Bearer token. |

---

## REST Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{ status: "ok" }`. No auth required. |

### Conversations

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/conversations` | Create a new conversation. Optional body: `{ title }`. |
| GET | `/api/conversations` | List conversations for the authenticated user. |
| DELETE | `/api/conversations` | Delete a conversation (or all). Query/body specifies target. |

### Apps

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/apps` | List all registered apps (id, name, description). |
| GET | `/api/apps/:id` | Get full details for a single app, including its tool schema. |

### App Sessions

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/conversations/:id/app-sessions` | Create a new app session within a conversation. Body: `{ appId }`. |
| GET | `/api/conversations/:id/app-sessions` | List active app sessions for a conversation. |

---

## WebSocket Protocol

Connect to:

```
ws://host:3100/ws?userId=<userId>
```

All messages are JSON with a top-level `type` field.

### Client to Server

| Type | Payload | Description |
|------|---------|-------------|
| `chat.user_message` | `{ conversationId, content }` | Send a chat message. The server streams the assistant response back. |
| `app.user_action` | `{ sessionId, action }` | Forward a user action from an app iframe to the server. |
| `ping` | `{}` | Keep-alive ping. |

### Server to Client

| Type | Payload | Description |
|------|---------|-------------|
| `chat.assistant_chunk` | `{ conversationId, delta }` | Streamed token chunk from the assistant. |
| `chat.assistant_done` | `{ conversationId, message }` | Signals the assistant finished its response. Contains the full message. |
| `chat.error` | `{ conversationId, error }` | An error occurred while processing the message. |
| `app.mount` | `{ sessionId, appId, iframeUrl? }` | Instructs the client to mount an app iframe. |
| `app.state_patch` | `{ sessionId, patch }` | JSON-Patch array to apply to the app's client-side state. |
| `app.command` | `{ sessionId, command, args }` | A discrete command for the app (e.g., highlight a square, play a sound). |
| `pong` | `{}` | Reply to client ping. |

### Typical Flow

1. Client opens WebSocket with `userId`.
2. Client sends `chat.user_message`.
3. Server streams `chat.assistant_chunk` events, ending with `chat.assistant_done`.
4. If the assistant invokes a tool that mounts an app, the server sends `app.mount`.
5. Client renders the iframe; the iframe and server exchange state via `app.state_patch` and `app.user_action`.

---

## postMessage Protocol (Iframe Communication)

The host page and each app iframe communicate via `window.postMessage`. All messages carry a `type` field.

| Direction | Type | Payload | Description |
|-----------|------|---------|-------------|
| Host -> Iframe | `app.init` | `{ sessionId, state }` | Sent once after the iframe loads. Provides the initial app state. |
| Iframe -> Host | `app.ready` | `{ sessionId }` | Iframe signals it has rendered and is ready to receive updates. |
| Iframe -> Host | `app.user_action` | `{ sessionId, action }` | User interaction inside the iframe (e.g., a chess move). Host forwards this over WebSocket. |
| Host -> Iframe | `app.state_patch` | `{ sessionId, patch }` | JSON-Patch update relayed from the server. Iframe applies it to local state. |

---

## Tool Schema Format

Tools are defined using Zod schemas that describe parameters the LLM can invoke. Each app exports a tool definition:

```ts
import { z } from "zod";

const myTool = {
  name: "my_tool",
  description: "A short description for the LLM",
  parameters: z.object({
    query: z.string().describe("The search query"),
    limit: z.number().optional().default(10).describe("Max results"),
  }),
};
```

At runtime, Zod schemas are converted to JSON Schema for the LLM's function-calling interface. The `describe()` calls become parameter descriptions in the schema.

---

## Creating a New App

An app consists of up to three pieces:

1. **Adapter** -- Server-side logic that handles tool calls and manages state.
2. **Definition** -- Metadata and tool schema exported so the platform can register the app.
3. **Iframe UI** (optional) -- A front-end rendered inside the chat for rich interaction.

### Steps

1. Create an app directory (e.g., `apps/my-app/`).
2. Define the tool schema using Zod in a definition file.
3. Implement the adapter: receive tool invocations, update state, and optionally emit `app.mount` / `app.state_patch` / `app.command` events.
4. If the app has a UI, build an iframe page that listens for `app.init` and `app.state_patch` postMessages and sends `app.ready` and `app.user_action` back.
5. Register the app so it appears in `GET /api/apps`.

---

## Worked Example: Chess App

The chess app lets a user play chess against the assistant inside the chat.

### Definition

The app registers a `chess_move` tool:

```ts
parameters: z.object({
  move: z.string().describe("UCI move, e.g. e2e4"),
})
```

### Adapter

- On first invocation the adapter initialises a board (FEN string) and emits `app.mount` with the iframe URL.
- Each `chess_move` tool call validates the move, updates the FEN, and emits `app.state_patch` with the new board state.
- The adapter then asks a chess engine (or the LLM) for the opponent move, applies it, and sends another `app.state_patch`.
- Illegal moves return a `chat.error` or a message asking the user to try again.

### Iframe

- Listens for `app.init` to receive the initial FEN and renders a board.
- On `app.state_patch`, updates the board position.
- When the user drags a piece, sends `app.user_action` with the UCI move string.
- The host forwards this as `app.user_action` over the WebSocket, which the adapter processes identically to a tool call.

### Sequence

```
User clicks e2-e4 in iframe
  -> postMessage app.user_action { move: "e2e4" }
  -> WebSocket  app.user_action { move: "e2e4" }
  -> Adapter validates, updates FEN
  -> WebSocket  app.state_patch { fen: "..." }
  -> postMessage app.state_patch to iframe
  -> Board re-renders
```

---

## Error Handling

- REST endpoints return standard HTTP status codes (`400`, `401`, `404`, `500`) with `{ error: "message" }` bodies.
- WebSocket errors arrive as `chat.error` events scoped to a conversation.
- Iframe errors should be caught locally; critical failures can be surfaced via `app.user_action` with an error payload.
