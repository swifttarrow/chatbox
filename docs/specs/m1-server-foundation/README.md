# Milestone 1: ChatBridge Server Foundation

## Outcome

A standalone ChatBridge server exists as a pnpm workspace package at `server/`, with Express, TypeScript, a PostgreSQL database (via Drizzle ORM), a WebSocket gateway, and a health-check endpoint. The server starts, connects to Postgres, and accepts WebSocket connections. No chat or plugin logic yet -- just the skeleton that all later milestones build on.

## Scope

- Initialize `server/` workspace package with TypeScript, Express, and dev tooling
- Define and migrate the core PostgreSQL schema (users, conversations, messages, app definitions, app sessions, runs, run steps, app events, oauth connections, audit log)
- Stand up a WebSocket gateway that accepts authenticated connections
- Health-check HTTP endpoint
- Environment-based configuration (DATABASE_URL, PORT, etc.)
- CORS configuration for chatbox client origin

## Out of Scope

- AI/LLM integration (M2)
- App registration API (M3)
- Iframe or postMessage protocol (M4)
- Deployment to Railway (M6)
- Platform user authentication beyond a placeholder middleware (M6)

## Source Inputs

- PRD: `docs/chat-bridge/prd.md`
- Architecture: `docs/chat-bridge/architecture.md`
- Pre-search: `docs/chat-bridge/pre-search.md`

## Constraints

- Server must be TypeScript (matches existing codebase)
- Use Express for HTTP (well-known, sufficient for MVP)
- Use Drizzle ORM for type-safe schema and migrations
- Use `ws` library for WebSocket (lightweight, no Socket.io overhead)
- PostgreSQL as the only persistence store for ChatBridge
- Server must be a pnpm workspace package (add `server` to `pnpm-workspace.yaml`)
- Node >= 20 (matches root `package.json` engine requirement)

## Decisions

- **ORM**: Drizzle ORM -- lightweight, TypeScript-first, good migration story
- **HTTP framework**: Express -- simple, well-understood, sufficient for this scope
- **WebSocket**: `ws` library -- standard, no unnecessary abstraction
- **Schema**: All entities from architecture doc modeled in Drizzle from day one (even if unused until later milestones), so later tasks only add logic, not schema changes
- **Config**: Environment variables via `dotenv` for local dev; Railway injects in production

## Assumptions

- PostgreSQL is available locally for development (e.g., via Docker or system install)
- The chatbox client will connect to the server via configurable URL (added in M2)

## Task Order

1. `001-init-server-package.md` - Scaffold the server workspace package (must exist before anything else)
2. `002-database-schema.md` - Define Drizzle schema and run initial migration (needed by all server logic)
3. `003-express-app.md` - Set up Express with middleware, CORS, health endpoint
4. `004-websocket-gateway.md` - WebSocket upgrade handler on the Express server
5. `005-dev-scripts.md` - Dev workflow: start, build, migrate commands; Docker Compose for Postgres

## Milestone Success Criteria

- `pnpm --filter server dev` starts the server without errors
- `GET /health` returns 200 with `{ status: "ok", db: "connected" }`
- WebSocket connection to `ws://localhost:<PORT>/ws` succeeds and stays open
- Database tables exist and match the Drizzle schema
- `pnpm install` from root resolves the server workspace

## Milestone Validation

- `curl http://localhost:3100/health` returns 200
- `wscat -c ws://localhost:3100/ws` connects successfully (install wscat via `npm install -g wscat` if needed)
- `pnpm --filter server db:migrate` runs without error
- `pnpm --filter server build` compiles without TypeScript errors

## Risks / Follow-ups

- Schema may need minor adjustments as M3-M4 reveal edge cases; Drizzle migrations handle this
- WebSocket auth is placeholder (session token check) until M6 adds real auth
