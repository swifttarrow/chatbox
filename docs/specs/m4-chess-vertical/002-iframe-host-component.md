# Task 002: Iframe Host Component

## Purpose

Build the chatbox client component that mounts, manages, and communicates with app iframes. This component is the host side of the trust boundary -- it renders the iframe, listens for postMessage events, validates them, and forwards to the server via the bridge WebSocket.

## Inputs

- Spec: `docs/specs/m4-chess-vertical/README.md`
- Files: `src/shared/bridge/protocol.ts`, `src/renderer/packages/bridge/store.ts`

## Outputs

- Create: `src/renderer/components/bridge/AppIframe.tsx` (iframe mount + postMessage handler)
- Create: `src/renderer/components/bridge/AppContainer.tsx` (wrapper with loading/error states)

## Dependencies

- Prior task: `001-postmessage-protocol.md`
- Required artifacts: `src/shared/bridge/protocol.ts`, `src/renderer/packages/bridge/store.ts`

## Constraints

- Iframe `sandbox` attribute: `allow-scripts` (minimum needed for React app in iframe)
- Iframe `src` from app definition's `uiUrl` (configurable per app)
- Must validate postMessage `origin` against app's `allowedOrigins`
- Must validate envelope structure before forwarding to server
- Must forward validated messages to ChatBridge server via the bridge WebSocket
- Must receive commands from server (via WS) and forward to iframe via `postMessage`
- Show loading spinner while iframe loads, error state on timeout (10s default)

## Required Changes

1. Create `src/renderer/components/bridge/AppIframe.tsx`:
   - Props: `appSessionId`, `appId`, `uiUrl`, `allowedOrigins`, `initialState`
   - Render `<iframe>` with:
     - `src={uiUrl}` (with `?appSessionId=xxx&protocolVersion=1.0` query params)
     - `sandbox="allow-scripts"`
     - `style`: fill container, no border
   - On mount: listen for `window.message` events
   - On message:
     - Check `event.origin` against `allowedOrigins`
     - Validate envelope via `validateEnvelope`
     - Check `appSessionId` matches
     - Forward valid messages to server via bridge WebSocket
   - Expose `sendToIframe(envelope)` method via ref or callback
   - On `app.ready` from iframe: send `app.init` with initial domain state
   - Cleanup: remove event listener on unmount

2. Create `src/renderer/components/bridge/AppContainer.tsx`:
   - Props: `appSessionId`, `appId`, `uiUrl`, `allowedOrigins`, `initialState`
   - States: `loading`, `ready`, `error`, `disposed`
   - Renders `AppIframe` when active
   - Shows spinner during loading
   - Shows error message with retry button on timeout/error
   - Shows "App ended" when disposed
   - Timeout: if no `app.ready` within 10s, show error

3. Extend bridge store or create hook to:
   - Route incoming WS messages (app commands) to the correct iframe via appSessionId
   - Register/unregister iframe refs by appSessionId

## Acceptance Criteria

- [ ] Iframe renders with correct sandbox attributes
- [ ] postMessage from iframe is validated (origin + envelope)
- [ ] Invalid messages are silently dropped (logged in dev)
- [ ] Valid messages forwarded to server over WebSocket
- [ ] Server commands forwarded to correct iframe via postMessage
- [ ] Loading spinner shown until `app.ready` received
- [ ] Timeout error shown if iframe doesn't respond within 10s

## Validation

- [ ] Mount AppContainer with a test HTML page as uiUrl; verify iframe renders
- [ ] Send a postMessage from the test page; verify it's validated and forwarded
- [ ] `pnpm build:web` compiles without errors

## Stop and Ask

- If `allow-scripts` alone is insufficient for the chess board library (e.g., needs `allow-same-origin` for fonts/assets), test and adjust sandbox flags carefully
