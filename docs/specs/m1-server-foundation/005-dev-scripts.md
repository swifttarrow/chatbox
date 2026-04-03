# Task 005: Development Scripts & Docker Compose

## Purpose

Provide a smooth developer experience: a single command to start PostgreSQL locally, run migrations, and start the dev server. This ensures any developer (or agent) can get the server running quickly.

## Inputs

- Spec: `docs/specs/m1-server-foundation/README.md`
- Prior tasks: `001` through `004`
- Files: `server/package.json`, `server/drizzle.config.ts`

## Outputs

- Create: `server/docker-compose.yml` (PostgreSQL for local development)
- Create: `server/.env` (local development environment variables, gitignored)
- Create: `server/.gitignore`
- Modify: `server/package.json` (add convenience scripts)
- Modify: root `.gitignore` if needed (ensure `server/.env` is ignored)

## Dependencies

- Prior task: `004-websocket-gateway.md`
- Required artifacts: All server source files from tasks 001-004

## Constraints

- Docker Compose must use PostgreSQL 16
- Default database name: `chatbridge`
- Default credentials: `postgres:postgres` (local dev only)
- `.env` must never be committed; `.env.example` already exists from task 002
- Dev script should handle the common case: DB up, migrate, start server

## Required Changes

1. Create `server/docker-compose.yml`:
   ```yaml
   services:
     postgres:
       image: postgres:16
       environment:
         POSTGRES_DB: chatbridge
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
       ports:
         - "5432:5432"
       volumes:
         - pgdata:/var/lib/postgresql/data
   volumes:
     pgdata:
   ```
2. Create `server/.gitignore`:
   ```
   node_modules/
   dist/
   .env
   ```
3. Create `server/.env` (copied from `.env.example`):
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chatbridge
   PORT=3100
   CLIENT_ORIGIN=http://localhost:5173
   NODE_ENV=development
   ```
4. Add/update scripts in `server/package.json`:
   - `"db:up"`: `"docker compose up -d"`
   - `"db:down"`: `"docker compose down"`
   - `"db:generate"`: `"drizzle-kit generate"`
   - `"db:migrate"`: `"drizzle-kit migrate"`
   - `"db:studio"`: `"drizzle-kit studio"`
   - `"dev"`: `"tsx watch src/index.ts"`
   - `"build"`: `"tsc"`
   - `"start"`: `"node dist/index.js"`
   - `"setup"`: `"pnpm db:up && sleep 2 && pnpm db:migrate"`
5. Verify `.gitignore` at root level includes `server/.env` or `**/.env`

## Acceptance Criteria

- [ ] `pnpm --filter @chatbox/server db:up` starts PostgreSQL container
- [ ] `pnpm --filter @chatbox/server db:migrate` creates all tables
- [ ] `pnpm --filter @chatbox/server dev` starts the server with hot reload
- [ ] `pnpm --filter @chatbox/server setup` does DB + migration in one command
- [ ] `server/.env` is gitignored
- [ ] `server/.env.example` documents all required env vars

## Validation

- [ ] Run `pnpm --filter @chatbox/server setup` from a clean state
- [ ] Run `pnpm --filter @chatbox/server dev` and verify health check: `curl http://localhost:3100/health`
- [ ] Connect via wscat: `wscat -c "ws://localhost:3100/ws?userId=test"` (install via `npm install -g wscat` if not available)
- [ ] `docker ps` shows running PostgreSQL container
- [ ] `git status` does not show `server/.env` as tracked

## Stop and Ask

- If Docker is not available on the machine, suggest an alternative (e.g., local PostgreSQL install, or Neon/Supabase free tier for dev)
