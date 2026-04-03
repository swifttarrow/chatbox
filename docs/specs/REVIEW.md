# Spec Review: `docs/specs/` (All Milestones)

## Verdict
**Ready** (after fixes applied below)

The package is well-structured and mostly executable, but has 2 blocking issues and 5 major issues that would cause rework or agent failure during implementation. The task granularity, ordering, and file-path precision are generally strong. The problems are concentrated in type system compatibility, cross-package boundaries, and a few under-specified integration points.

---

## Blocking Findings

### B1. M3-001 designs tool schemas as JSON Schema; Vercel AI SDK requires Zod schemas
**Files:** `m3-plugin-contract/001-tool-schema-format.md`, `m3-plugin-contract/006-dynamic-tool-injection.md`

The codebase confirms `tool()` from `ai` requires `inputSchema: z.object({...})` (Zod), not JSON Schema objects. M3-001 defines a `ToolParameter` interface modeled on JSON Schema (`type`, `properties`, `required`, `enum`). M3-006's "Stop and Ask" acknowledges this might be an issue, but it's predictable and must be resolved in the spec rather than deferred to runtime discovery.

**Impact:** An agent following M3-001 literally will build the wrong abstraction. Every downstream task (M3-003, M3-006, M4-003, M4-004, M5-001, M5-003) depends on tool schema format.

**Fix:** Redesign M3-001 around Zod schemas. App definitions can store tool parameters as Zod schema objects (using `z.object()`). The `ToolSchema` type becomes:
```typescript
interface ToolSchema {
  name: string
  description: string
  parameters: z.ZodObject<any>  // Zod schema, not JSON Schema
}
```
M3-006 then wraps each `ToolSchema` in `tool({ description, inputSchema: schema.parameters })` with an `execute` function that routes to the adapter. Remove the JSON Schema validation from M3-001 and replace with Zod schema validation.

### B2. No task creates the app session automatically when a tool call triggers an app
**Files:** `m3-plugin-contract/006-dynamic-tool-injection.md`, `m4-chess-vertical/004-tool-execution-flow.md`

The current design has a chicken-and-egg problem: M3-006 says "only tools from active app sessions are included," but the user's first message ("let's play chess") occurs *before* any chess session exists. No task addresses how the chess session gets created in the first place.

M3-005 provides a REST endpoint for manual session creation, but nothing in the chat flow triggers it. The model would need chess tools available to call `start_chess_game`, but chess tools are only available when a chess session is active.

**Impact:** The chess integration will not work without this being resolved.

**Fix:** Add one of these approaches to M3-006 or M4-004:
- **(a)** Always inject tool schemas from all enabled apps (not just active sessions) for "launcher" tools like `start_chess_game`. Scope session-bound tools (like `make_move`, `get_board_state`) to active sessions only.
- **(b)** The `start_chess_game` tool execution in M4-004 automatically creates an app session if one doesn't exist. This is the simpler fix — add it to the `executeToolCall` flow: if no session exists for this app, create one.

Option (b) is simpler and should be specified in M4-004.

---

## Major Findings

### M1. Iframe apps cannot import shared bridge types from `src/shared/`
**Files:** `m4-chess-vertical/001-postmessage-protocol.md`, `m4-chess-vertical/005-chess-iframe-app.md`

M4-001 creates `src/shared/bridge/protocol.ts`. M4-005 creates `apps/chess/` as a separate Vite project in a different workspace package. The iframe app has its own `tsconfig.json` and cannot resolve `@shared/*` path aliases. M4-001's "Stop and Ask" mentions this but it's a foreseeable problem.

**Fix:** Either:
- Create a shared `packages/bridge-protocol/` workspace package that both root and `apps/*` depend on
- Or duplicate the types into each iframe app (simpler for MVP, spec should explicitly choose one)

### M2. M2-006 (Client Streaming UI) combines too many concerns
**File:** `m2-streaming-chat/006-client-streaming-ui.md`

This task creates hooks, extends the store with conversation CRUD + streaming state, creates a new BridgeChat component, and wires it into routing. A stateless agent would struggle with scope. The task modifies `src/renderer/packages/bridge/store.ts` (adding ~8 new state fields and ~5 new actions) AND creates new components AND integrates with routing.

**Fix:** Split into two tasks:
- `006a`: Extend bridge store with conversation state, streaming state, and REST API calls
- `006b`: Create BridgeChat component and wire into routing/session view

### M3. No task addresses the iframe mount trigger in the client
**Files:** `m4-chess-vertical/002-iframe-host-component.md`, `m4-chess-vertical/004-tool-execution-flow.md`, `m4-chess-vertical/006-app-state-patches.md`

When the server executes `start_chess_game` and returns a `uiCommand`, M4-004 yields `{ type: 'app_command', appSessionId, command }` as a RunEvent. The WS chat handler sends this to the client. But no task explicitly specifies:
1. What WS message type carries the "mount an iframe" instruction
2. How the bridge store receives this and updates state to render `AppContainer`
3. How `BridgeChat` conditionally renders `AppContainer` based on active app sessions

This is spread across M4-002, M4-004, and M4-006, but the critical "first mount" path falls between the cracks.

**Fix:** Add explicit steps to M4-004:
- Define a `app.mount` WS message type (or use `app.init`) sent when a new app session is created via tool call
- Add to bridge store: `onAppMount(appSessionId, appId, uiUrl, initialState)` handler
- Add to BridgeChat: render `AppContainer` when `activeAppSessions` is non-empty

### M4. M6-006 Dockerfile won't work with pnpm workspaces
**File:** `m6-auth-deploy-polish/006-railway-deployment.md`

The Dockerfile copies only `server/` contents, but pnpm workspaces require the root `pnpm-lock.yaml` and `pnpm-workspace.yaml` for dependency resolution. The `COPY package.json pnpm-lock.yaml ./` line would fail because those files are in the workspace root, not `server/`.

**Fix:** The Dockerfile should:
1. Set context to the repo root
2. Copy root `pnpm-lock.yaml` and `pnpm-workspace.yaml`
3. Copy `server/package.json`
4. Run `pnpm install --filter @chatbox/server`
5. Copy server source and build

### M5. No task creates the auth UI (sign-in/sign-up screens)
**File:** `m6-auth-deploy-polish/001-platform-auth.md`

M6-001 creates server-side auth endpoints and `src/renderer/packages/bridge/auth.ts` (API client functions), but no task creates the actual React sign-in/sign-up UI components. A user cannot authenticate without a form.

**Fix:** Either add a task `001b-auth-ui.md` that creates sign-in/sign-up components, or expand M6-001's Required Changes section with explicit client-side component creation.

---

## Minor Findings

### m1. Validation steps assume `wscat` is installed
**Files:** `m1-server-foundation/004-websocket-gateway.md`, `m1-server-foundation/005-dev-scripts.md`

Multiple tasks use `wscat -c ws://...` in validation. Not all environments have this. Add a note: "Install via `npm install -g wscat` if not available, or use browser DevTools WebSocket inspector."

### m2. M6-002 doesn't resolve Spotify vs GitHub choice
**File:** `m6-auth-deploy-polish/002-oauth-flow.md`

The task says "Spotify OR GitHub" but doesn't pick one. A stateless agent needs a decision. The spec should choose one and name the specific OAuth scopes, endpoints, and data shape.

### m3. M5-002 ordering implies it blocks M5-003, but it's marked optional
**File:** `m5-additional-apps/002-equation-solver-ui.md`

Task 002 is between tasks 001 and 003 in the ordering. The README says task 002 is "Optional: math rendering iframe." If it's optional, it should be after all required tasks or clearly marked as skippable in the README task order.

### m4. M4-003 chess adapter `execute` function placement unclear
**File:** `m4-chess-vertical/003-chess-adapter.md`

The adapter has `onToolCall` which handles tool execution, but M3-006 / M4-004 need to wire `tool()` objects with `execute` callbacks that route to the adapter. The spec should clarify: the `tool()` `execute` function calls `adapter.onToolCall()` — this happens in M4-004 but the connection could be more explicit.

### m5. `server/src/db/schema.ts` in M1-002 is a very large task
**File:** `m1-server-foundation/002-database-schema.md`

11 tables with all columns, foreign keys, enums, and defaults in one task. This is implementable but at the upper boundary of single-task scope. Consider noting this in the README.

### m6. M1-001 says "Do NOT add Express here" but lists `tsx` as dev dep
**File:** `m1-server-foundation/001-init-server-package.md`

Minor: the task says to add `tsx` for dev and `tsc` for build, but also says `type: module`. Verify `tsx` works correctly with `type: module` in the package.json (it does, but worth noting).

### m7. Weather adapter uses `fetch()` assuming Node 20 native
**File:** `m5-additional-apps/003-weather-adapter.md`

Fine for Node 20+, but should be noted as a constraint (already is in M1 README: Node >= 20).

---

## Coverage Notes

All coverage gaps have been addressed:

- **Auth UI components** — added `m6-auth-deploy-polish/001b-auth-ui.md`
- **Conversation sidebar** — added `m2-streaming-chat/007-client-chat-ui.md` with `BridgeConversationList` component
- **App session auto-creation** — M3-006 launcher/session tool split + M4-004 auto-create in `executeToolCall`
- **M4-006/007 duplication** — clarified: task 006 creates `app-events.ts` with core move cycle; task 007 extends it with completion logic only
- **Page refresh / reconnect** — added `m4-chess-vertical/008-reconnect-and-restore.md`

---

## Recommended Fix Order

1. **B1** — Redesign M3-001 tool schema format around Zod (cascading impact on M3-003, M3-006, M4-003, M5-001, M5-003)
2. **B2** — Add auto-session-creation to M4-004 and split tool injection into "launcher tools" vs "session tools" in M3-006
3. **M3** — Add iframe mount trigger to M4-004 and bridge store handler
4. **M1** — Resolve shared bridge types strategy (shared package vs duplication)
5. **M5** — Add auth UI task to M6
6. **M2** — Split M2-006 into two tasks
7. **M4** — Fix Dockerfile for pnpm workspaces
8. **m2** — Resolve Spotify vs GitHub in M6-002
9. **m3** — Reorder M5-002 as optional/last

---

## Fixes Applied

All blocking, major, minor, and coverage findings have been fixed:

**Blocking:**
1. **B1 FIXED**: M3-001 redesigned around Zod schemas. `ToolDefinition.parameters` is now `z.ZodObject<any>`. Added `AppDefinitionRecord` for DB-serializable format. Updated M3-003 chess definition with Zod params. Updated M5-001 and M5-003 tool params to Zod.
2. **B2 FIXED**: M3-006 now splits tools into **launcher tools** (always available) and **session tools** (only when session active). M4-004 auto-creates app sessions on first tool call when no session exists.

**Major:**
3. **M1 FIXED**: M4-001 and M4-005 now document the shared type strategy (copy types for MVP or create shared workspace package).
4. **M2 FIXED**: M2-006 split into `006-client-bridge-store.md` (store + hooks) and `007-client-chat-ui.md` (components + sidebar + route). Old `006-client-streaming-ui.md` removed.
5. **M3 FIXED**: M4-004 now explicitly defines `app.mount` WS message type, bridge store handler, and the full iframe mount trigger flow.
6. **M4 FIXED**: M6-006 Dockerfile moved to repo root with proper pnpm workspace handling.
7. **M5 FIXED**: Added `001b-auth-ui.md` with sign-in/sign-up UI components. Updated M6 README task order.

**Minor:**
8. **m2 FIXED**: M6-002 now specifies GitHub as the OAuth provider with specific scopes, API endpoints, and tool definitions.
9. **m3 FIXED**: M5 README reordered to put optional task 002 last.
10. **wscat FIXED**: All validation steps referencing `wscat` now include install instructions.

**Coverage:**
11. **Conversation sidebar FIXED**: Added `BridgeConversationList` component in M2 task 007.
12. **M4-006/007 duplication FIXED**: Clarified that 006 creates `app-events.ts` with core move cycle; 007 extends with completion logic only.
13. **Reconnect/restore FIXED**: Added `m4-chess-vertical/008-reconnect-and-restore.md` for restoring app sessions on page refresh and WS reconnect.

## Ready-To-Implement Check

- [x] Tasks are complete
- [x] Dependencies are explicit
- [x] Inputs and outputs are defined
- [x] Acceptance criteria are testable
- [x] No hidden context is required

---

## Second-Pass Review Fixes

A thorough re-review of all 48 files identified additional issues, all now fixed:

**M3 — Tool Schema & Plugin Contract:**
- Added `isLauncher?: boolean` field to `ToolDefinition` in M3-001 (resolves ambiguous launcher identification)
- Marked `start_chess_game` as `isLauncher: true` in M3-003 chess definition
- Updated M3-006 to use explicit `isLauncher` field instead of contradictory heuristics ("starts with start_" vs "first tool")
- Fixed M3 README: replaced `validateTransition` with `getInitialState` in adapter method list (matches M3-002 implementation)
- Clarified `uiUrl` lifecycle in M3-003 (null at seed time, updated when M4-005 creates iframe app)

**M4 — Chess Vertical:**
- Removed `resign` tool from M4-007 (wasn't in chess definition; resignation handled as user action from iframe instead)
- Made shared type copy explicit in M4-005: must copy `protocol.ts` and `constants.ts` to `apps/chess/src/`
- Added `bridge-protocol.ts` and `bridge-constants.ts` to M4-005 outputs
- Specified chess-specific types in M4-005 outputs (`ChessDomainState`, `ChessMove`)
- Fixed M4-008 component references: `BridgeLayout.tsx` (not ambiguous "BridgeChat or BridgeLayout")

**M5 — Additional Apps:**
- Resolved M5-006 ambiguity: explicit `AppTabs.tsx` component (not "or create AppTabs")
- Updated M5-006 outputs: creates `AppTabs.tsx`, modifies `BridgeLayout.tsx`
- Added PRD scenario 7 explicitly to M5-005 acceptance criteria
- Specified weather cache strategy in M5-003 (in-memory Map, keyed by lat/lon, global, 10min TTL)

**M6 — Auth, Deploy, Polish:**
- Fixed M6-006 Outputs: `Dockerfile` and `railway.toml` at repo root (was incorrectly `server/Dockerfile`)
- Added explicit app build/copy instructions to M6-006 (pnpm build commands, static file serving config, env-aware uiUrl)
- Specified exact AuthGate placement in M6-001b: wraps `BridgeLayout.tsx` content

**M2 — Streaming Chat:**
- Defined system prompt explicitly in M2-003 (was "basic helpful assistant prompt" — now provides exact text)

## Remaining Notes (informational, non-blocking)

- M1-002 (database schema) is a large task (11 tables) but fully deterministic with explicit column definitions
- Some DB design details (FK cascade rules, exact error message strings) are left to implementation judgment — these are standard patterns that a capable agent can decide
- camelCase API responses vs snake_case DB columns is a standard serialization concern, not specified per-endpoint
