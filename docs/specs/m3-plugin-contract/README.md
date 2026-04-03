# Milestone 3: Plugin Contract & App Registration

## Outcome

The ChatBridge server has a complete app registration system. Apps are defined with metadata, tool schemas, and session configuration. The run orchestrator dynamically injects only eligible tool schemas into each model turn. App sessions can be created and tracked per conversation. The foundation is ready for M4 to wire up actual tool execution and iframe rendering.

## Scope

- App definition seeding (in-repo app definitions loaded at server start)
- App definition REST API (list available apps, get app details)
- Tool schema format (Zod-based, compatible with Vercel AI SDK function calling)
- Dynamic per-turn tool injection in the run orchestrator
- App session lifecycle: create, get state, update state, dispose
- App session REST + WebSocket events
- App adapter interface (abstract base that Chess, Equation Solver, etc. will implement)

## Out of Scope

- Actual tool execution logic (M4 -- Chess adapter)
- Iframe mounting or postMessage (M4)
- OAuth/auth requirements on apps (M6)
- Teacher allowlists (deferred -- eligibility based on app `enabled` flag for MVP)

## Source Inputs

- PRD: `docs/chat-bridge/prd.md`
- Architecture: `docs/chat-bridge/architecture.md`
- Pre-search: `docs/chat-bridge/pre-search.md`

## Constraints

- Tool schemas must be compatible with Vercel AI SDK's `tool()` format for function calling
- App definitions stored in `app_definitions` table but seeded from code (not user-created for MVP)
- Per-turn injection must filter tools by: active app sessions in conversation, app enabled flag, and (placeholder) auth readiness
- App session state split: `domain_state` (JSON, server-validated, feeds model) vs `view_state` (JSON, ephemeral, does not feed model)

## Decisions

- **App types**: `server_tool` (pure computation), `hybrid_session` (long-lived with UI), `client_widget` (deferred)
- **Tool schema storage**: JSON column on `app_definitions` table; validated at seed/registration time
- **Adapter pattern**: Each app implements an `AppAdapter` interface with methods: `onToolCall`, `onUserAction`, `getSnapshot`, `getInitialState`
- **Seeding**: App definitions loaded from `server/src/apps/registry.ts` at startup; inserted/updated in DB

## Assumptions

- M1 database schema includes `app_definitions` and `app_sessions` tables
- M2 run orchestrator exists and can be extended with tool injection

## Task Order

1. `001-tool-schema-format.md` - Define the tool schema TypeScript types and validation
2. `002-app-adapter-interface.md` - Define the AppAdapter abstract interface
3. `003-app-definition-seeding.md` - Seed app definitions into DB at server startup
4. `004-app-definition-api.md` - REST endpoints to list and get app definitions
5. `005-app-session-lifecycle.md` - App session CRUD: create, get, update state, dispose
6. `006-dynamic-tool-injection.md` - Extend run orchestrator to inject eligible tools per turn

## Milestone Success Criteria

- `GET /api/apps` returns list of registered apps with their tool schemas
- Creating an app session for a conversation persists it in `app_sessions`
- The run orchestrator includes tool schemas in model calls when an app session is active
- The model can emit a tool call that the orchestrator recognizes (even if not yet executed)
- App adapter interface is defined and a no-op stub adapter exists for testing

## Milestone Validation

- `curl http://localhost:3100/api/apps` returns JSON array with at least one app definition
- `curl -X POST http://localhost:3100/api/conversations/:id/app-sessions -d '{"appId":"chess"}'` creates a session
- Send a chat message with an active chess app session; observe tool schemas in the model's function calling config (server logs)
- `pnpm --filter server build` compiles without errors

## Risks / Follow-ups

- Tool schema format must align with whichever LLM provider is used; Vercel AI SDK abstracts this but edge cases may arise
- The adapter interface will be refined when implementing Chess (M4); keep it minimal now
