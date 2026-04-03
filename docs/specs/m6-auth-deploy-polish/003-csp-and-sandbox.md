# Task 003: CSP & Iframe Sandbox Hardening

## Purpose

Apply Content Security Policy headers and finalize iframe sandbox attributes to enforce the security boundaries defined in the architecture.

## Inputs

- Spec: `docs/specs/m6-auth-deploy-polish/README.md`
- Architecture: CSP and sandbox requirements from `docs/chat-bridge/architecture.md`
- Files: `server/src/app.ts`, `src/renderer/components/bridge/AppIframe.tsx`

## Outputs

- Create: `server/src/middleware/csp.ts` (CSP header middleware)
- Modify: `server/src/app.ts` (apply CSP middleware)
- Modify: `src/renderer/components/bridge/AppIframe.tsx` (finalize sandbox attributes)

## Dependencies

- Prior task: none (can parallel with 001-002)
- Required artifacts: `server/src/app.ts`, `src/renderer/components/bridge/AppIframe.tsx`

## Constraints

- CSP must allow: own origin, known app iframe origins, ChatBridge WS/API origin
- CSP must block: inline scripts (except where necessary), external unknown origins
- Iframe sandbox: `allow-scripts` minimum; add `allow-same-origin` only if required by app libraries
- `frame-src` directive restricts which URLs can be loaded in iframes
- `connect-src` allows WebSocket connections to ChatBridge

## Required Changes

1. Create `server/src/middleware/csp.ts`:
   - Build CSP header string based on known app origins:
     ```
     default-src 'self';
     script-src 'self';
     style-src 'self' 'unsafe-inline';
     frame-src <app-origins>;
     connect-src 'self' ws://localhost:3100 wss://<production-domain>;
     img-src 'self' data:;
     ```
   - App origins read from app definitions (or config)
   - Different policies for dev vs production
2. Apply CSP middleware in `server/src/app.ts`
3. Finalize iframe sandbox in `AppIframe.tsx`:
   - Test each app with minimal sandbox: `allow-scripts`
   - Add `allow-same-origin` only if needed (document why for each app)
   - Add `allow-forms` only if an app needs form submission

## Acceptance Criteria

- [ ] CSP header present on all server responses
- [ ] Iframes from unknown origins are blocked by frame-src
- [ ] Inline script injection in iframe is blocked
- [ ] All three apps still function with the CSP in place
- [ ] Sandbox attributes are as restrictive as possible while apps work

## Validation

- [ ] Inspect response headers: CSP policy present
- [ ] Open browser DevTools console: no CSP violations for normal app usage
- [ ] Try loading an iframe from a non-allowed origin: blocked
- [ ] All apps render and function correctly

## Stop and Ask

- If an app library requires `allow-same-origin` in the sandbox, document the security trade-off clearly
