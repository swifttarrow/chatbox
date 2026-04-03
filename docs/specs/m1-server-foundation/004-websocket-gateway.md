# Task 004: WebSocket Gateway

## Purpose

Add a WebSocket upgrade handler to the Express server so clients can establish persistent bidirectional connections. This gateway will carry all real-time communication (chat streaming, app events, state patches) in later milestones.

## Inputs

- Spec: `docs/specs/m1-server-foundation/README.md`
- Prior task: `003-express-app.md`
- Files: `server/src/index.ts`, `server/src/app.ts`

## Outputs

- Create: `server/src/ws/gateway.ts` (WebSocket server setup and connection handling)
- Create: `server/src/ws/types.ts` (WebSocket message envelope types)
- Create: `server/src/ws/connection-manager.ts` (track active connections by user/conversation)
- Modify: `server/src/index.ts` (attach WebSocket server to HTTP server)
- Modify: `server/package.json` (add `ws` dependency)

## Dependencies

- Prior task: `003-express-app.md`
- Required artifacts: `server/src/index.ts` (HTTP server), `server/src/app.ts`

## Constraints

- Use `ws` library (not Socket.io)
- WebSocket path: `/ws`
- Each connection must be associated with a user ID (placeholder: extract from query param `?userId=` for now; real auth in M6)
- Connection manager must track connections by user ID for targeted message delivery
- All WebSocket messages must be JSON with a `type` field
- Implement heartbeat ping/pong to detect stale connections (30s interval)
- Log connection open, close, and errors

## Required Changes

1. Add to `server/package.json`: `ws`; devDeps: `@types/ws`
2. Create `server/src/ws/types.ts`:
   - `WsEnvelope` type: `{ type: string, payload?: unknown, eventId?: string, correlationId?: string, conversationId?: string, appSessionId?: string }`
   - `WsMessageType` enum or string union for known types (start with `ping`, `pong`, `error`)
3. Create `server/src/ws/connection-manager.ts`:
   - `ConnectionManager` class with:
     - `addConnection(userId: string, ws: WebSocket)`: register
     - `removeConnection(userId: string, ws: WebSocket)`: unregister
     - `sendToUser(userId: string, message: WsEnvelope)`: send to all connections for a user
     - `sendToConnection(ws: WebSocket, message: WsEnvelope)`: send to specific connection
     - `getConnections(userId: string)`: get all connections for a user
   - Export singleton instance
4. Create `server/src/ws/gateway.ts`:
   - `createWebSocketServer(server: http.Server)` function
   - Handle `upgrade` on path `/ws`
   - On connection: extract userId from URL query params, register with ConnectionManager
   - On message: parse JSON, validate `type` field exists, dispatch (for now, echo back or log)
   - On close: unregister from ConnectionManager
   - On error: log and close
   - Heartbeat: ping every 30s, terminate connections that don't pong within 10s
5. Modify `server/src/index.ts`:
   - After `app.listen()`, get the `http.Server` instance
   - Call `createWebSocketServer(server)`
   - Note: `app.listen()` returns `http.Server` -- use that

## Acceptance Criteria

- [ ] WebSocket server accepts connections at `ws://localhost:3100/ws`
- [ ] Connection requires `?userId=xxx` query parameter (rejects without it)
- [ ] ConnectionManager tracks connections per user
- [ ] Sending a JSON message to the WebSocket logs it on the server
- [ ] Heartbeat ping/pong keeps connections alive
- [ ] Stale connections (no pong) are terminated
- [ ] Connection close is logged and cleaned up

## Validation

- [ ] `wscat -c "ws://localhost:3100/ws?userId=test"` connects successfully (install wscat via `npm install -g wscat` if not available, or use browser DevTools WebSocket inspector)
- [ ] `wscat -c "ws://localhost:3100/ws"` (no userId) is rejected
- [ ] Sending `{"type":"ping"}` via wscat receives a response
- [ ] Server logs show connection open, messages received, and connection close
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- If the ws library requires different upgrade handling than expected with Express, investigate before proceeding
