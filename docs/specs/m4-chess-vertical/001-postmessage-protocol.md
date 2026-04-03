# Task 001: postMessage Protocol Library

## Purpose

Implement the typed postMessage envelope library used for communication between the chatbox host and app iframes. This is the trust boundary -- the host validates every message before forwarding to the server.

## Inputs

- Spec: `docs/specs/m4-chess-vertical/README.md`
- Architecture: postMessage protocol from `docs/chat-bridge/architecture.md`

## Outputs

- Create: `src/shared/bridge/protocol.ts` (shared message types and envelope validation)
- Create: `src/shared/bridge/constants.ts` (protocol version, message type enums)

## Dependencies

- Prior task: none within M4 (requires M3 complete)
- Required artifacts: none (new shared module)

## Constraints

- Types must be usable in both the chatbox host (renderer) AND iframe apps
- Protocol version: `"1.0"`
- Every envelope must include: `protocolVersion`, `appSessionId`, `eventId`, `type`, `payload`
- The host validates: origin, required fields, known message type, matching appSessionId
- Use `crypto.randomUUID()` for eventId generation (available in modern browsers and Node)

## Required Changes

1. Create `src/shared/bridge/constants.ts`:
   ```typescript
   export const BRIDGE_PROTOCOL_VERSION = '1.0'

   // Server/host -> iframe
   export const AppCommandTypes = {
     INIT: 'app.init',
     COMMAND: 'app.command',
     STATE_PATCH: 'app.state_patch',
     RESET: 'app.reset',
     DISPOSE: 'app.dispose',
   } as const

   // Iframe -> host
   export const AppEventTypes = {
     READY: 'app.ready',
     USER_ACTION: 'app.user_action',
     UI_EVENT: 'app.ui_event',
     ERROR: 'app.error',
     ACK: 'app.ack',
   } as const
   ```

2. Create `src/shared/bridge/protocol.ts`:
   - `BridgeEnvelope` type: `{ protocolVersion: string, appSessionId: string, eventId: string, type: string, payload: unknown }`
   - `createEnvelope(type, appSessionId, payload)`: factory function that adds protocolVersion and eventId
   - `validateEnvelope(data: unknown): BridgeEnvelope | null`: validate required fields, return null if invalid
   - `isValidOrigin(origin: string, allowedOrigins: string[]): boolean`: check message origin
   - Type-specific payload interfaces for each message type:
     - `AppInitPayload`: `{ domainState: unknown, config?: unknown }`
     - `AppStatePatchPayload`: `{ domainState: unknown, stateVersion: number }`
     - `AppUserActionPayload`: `{ action: string, data: Record<string, unknown> }`
     - `AppReadyPayload`: `{ appId: string }`
     - `AppErrorPayload`: `{ code: string, message: string }`
     - `AppAckPayload`: `{ ackedEventId: string }`

## Acceptance Criteria

- [ ] All message types have TypeScript interfaces
- [ ] `createEnvelope` produces valid envelopes with UUID eventIds
- [ ] `validateEnvelope` rejects messages missing required fields
- [ ] `isValidOrigin` correctly checks origin against allowlist
- [ ] Types are importable from both renderer and potential iframe builds

## Validation

- [ ] `pnpm build:web` compiles without errors (shared types used by renderer)
- [ ] `pnpm --filter @chatbox/server build` compiles without errors (if server imports shared types)
- [ ] Manual test: `createEnvelope('app.ready', 'session-1', { appId: 'chess' })` returns valid envelope

## Shared Type Strategy

The iframe apps (`apps/chess/`, etc.) are separate Vite projects and cannot import from `src/shared/` via path aliases. To share these types:

- **MVP approach**: Copy `src/shared/bridge/protocol.ts` and `src/shared/bridge/constants.ts` into each iframe app as `src/bridge-protocol.ts`. This is acceptable duplication for 2-3 apps.
- **Better approach (if time allows)**: Create a `packages/bridge-protocol/` workspace package with its own `package.json` and `tsconfig.json`, and have both the root renderer and iframe apps depend on `@chatbox/bridge-protocol`. Add `packages/*` to `pnpm-workspace.yaml`.

For this task, create the types in `src/shared/bridge/` as specified. M4-005 (chess iframe app) will copy them as needed. If a shared package is preferred, do that in M4-005 instead.

## Stop and Ask

- None expected; the shared type strategy is documented above
