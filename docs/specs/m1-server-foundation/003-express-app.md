# Task 003: Express Application Setup

## Purpose

Set up the Express HTTP server with middleware (JSON parsing, CORS, request logging), a health-check endpoint that verifies database connectivity, and structured error handling.

## Inputs

- Spec: `docs/specs/m1-server-foundation/README.md`
- Prior task: `002-database-schema.md` (database client must exist)
- Files: `server/src/db/index.ts`

## Outputs

- Create: `server/src/app.ts` (Express app configuration)
- Create: `server/src/routes/health.ts` (health-check route)
- Create: `server/src/middleware/error-handler.ts` (centralized error handling)
- Create: `server/src/middleware/request-logger.ts` (request logging)
- Create: `server/src/config.ts` (environment configuration)
- Modify: `server/src/index.ts` (import app, start HTTP server)
- Modify: `server/package.json` (add express, cors, and type dependencies)

## Dependencies

- Prior task: `002-database-schema.md`
- Required artifacts: `server/src/db/index.ts` (database client)

## Constraints

- CORS must allow the chatbox client origin (configurable via `CLIENT_ORIGIN` env var, default `http://localhost:5173`)
- Health endpoint must verify DB connectivity (run a simple query)
- All routes return JSON
- Error handler must not leak stack traces in production
- Use `dotenv` for environment variable loading (already added in task 002)

## Required Changes

1. Add to `server/package.json` dependencies: `express`, `cors`; devDeps: `@types/express`, `@types/cors`
2. Create `server/src/config.ts`:
   - Export config object reading from `process.env`: `PORT` (default 3100), `DATABASE_URL`, `CLIENT_ORIGIN`, `NODE_ENV`
   - Validate required vars at startup (throw if DATABASE_URL missing)
3. Create `server/src/middleware/request-logger.ts`:
   - Simple middleware logging `${method} ${url} ${status} ${duration}ms`
4. Create `server/src/middleware/error-handler.ts`:
   - Express error handler (4-arg middleware)
   - Log error, return `{ error: message }` with appropriate status code
   - Hide stack trace when `NODE_ENV=production`
5. Create `server/src/routes/health.ts`:
   - `GET /health` -> query DB with `SELECT 1` -> return `{ status: "ok", db: "connected" }`
   - If DB query fails -> return 503 `{ status: "error", db: "disconnected" }`
6. Create `server/src/app.ts`:
   - Create Express app
   - Apply: JSON body parser, CORS (with CLIENT_ORIGIN), request logger
   - Mount `/health` route
   - Apply error handler (last)
   - Export the app (do NOT call `listen` here)
7. Modify `server/src/index.ts`:
   - Import config, load dotenv
   - Import app from `./app`
   - Call `app.listen(config.PORT)` and log the port

## Acceptance Criteria

- [ ] `server/src/app.ts` exports configured Express app
- [ ] `GET /health` returns 200 with `{ status: "ok", db: "connected" }` when DB is available
- [ ] `GET /health` returns 503 when DB is unavailable
- [ ] CORS headers present in responses (Access-Control-Allow-Origin)
- [ ] Request logging visible in console
- [ ] Unknown routes return 404 JSON response
- [ ] Errors return structured JSON, not HTML

## Validation

- [ ] `pnpm --filter @chatbox/server dev` starts server on port 3100
- [ ] `curl http://localhost:3100/health` returns `{"status":"ok","db":"connected"}`
- [ ] `curl -I http://localhost:3100/health` shows CORS headers
- [ ] `curl http://localhost:3100/nonexistent` returns 404 JSON
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- If the database is not running, this endpoint will return 503 -- that is expected, not a bug
