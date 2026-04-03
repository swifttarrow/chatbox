# Task 006: Railway Deployment

## Purpose

Deploy the ChatBridge server, PostgreSQL database, and app static files to Railway so the application is publicly accessible.

## Inputs

- Spec: `docs/specs/m6-auth-deploy-polish/README.md`
- Files: `server/package.json`, `server/Dockerfile` (to create)

## Outputs

- Create: `Dockerfile` at repo root (multi-stage build for server; must be at root for pnpm workspace access)
- Create: `railway.toml` at repo root (Railway configuration)
- Create: `railway.toml` (root Railway project config, if needed)
- Modify: `server/src/config.ts` (production environment handling)
- Modify: `server/.env.example` (document production env vars)

## Dependencies

- Prior task: `001-platform-auth.md` (JWT_SECRET needed for production)
- Required artifacts: Working server, all app builds

## Constraints

- Railway deployment must include: ChatBridge server, PostgreSQL (managed)
- App static files (chess, weather, equation-solver) served by ChatBridge server or separate static service
- Production env vars: DATABASE_URL (Railway Postgres), JWT_SECRET, LLM_API_KEY, CLIENT_ORIGIN, PORT
- Server must bind to Railway's PORT env var
- CORS must allow the production client origin
- WebSocket must work over Railway's proxy (wss://)

## Required Changes

1. Create `Dockerfile` at the **repo root** (not inside server/), because pnpm workspaces require the root lockfile:
   ```dockerfile
   FROM node:20-slim AS builder
   WORKDIR /app
   # Copy workspace root files needed for pnpm install
   COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
   COPY server/package.json ./server/
   RUN npm install -g pnpm && pnpm install --filter @chatbox/server --frozen-lockfile
   COPY server/ ./server/
   # Also copy shared types if server imports from src/shared/
   COPY src/shared/ ./src/shared/
   RUN cd server && pnpm build

   FROM node:20-slim
   WORKDIR /app
   COPY --from=builder /app/server/dist ./dist
   COPY --from=builder /app/server/node_modules ./node_modules
   COPY --from=builder /app/server/package.json ./
   EXPOSE 3100
   CMD ["node", "dist/index.js"]
   ```
2. Create `railway.toml` at the **repo root** (matching Dockerfile location):
   ```toml
   [build]
   dockerfile = "Dockerfile"

   [deploy]
   healthcheckPath = "/health"
   healthcheckTimeout = 30
   ```
3. Modify `server/src/config.ts`:
   - Accept `PORT` from Railway (they set it)
   - Accept `DATABASE_URL` from Railway Postgres service
   - Ensure all config works in production mode
4. Build and serve app static files:
   - Option A: serve from `server/public/apps/` (copy built app files)
   - Option B: separate static file service on Railway
   - Option A is simpler for MVP
5. Add a root-level build script in `server/package.json`:
   ```json
   "build:apps": "pnpm --filter @chatbox/chess-app build && pnpm --filter @chatbox/weather-app build && mkdir -p public/apps/chess public/apps/weather && cp -r ../apps/chess/dist/* public/apps/chess/ && cp -r ../apps/weather/dist/* public/apps/weather/"
   ```
   Run this before the server build or as part of the Dockerfile.
6. Configure Express to serve static files from `/apps/` path:
   ```typescript
   app.use('/apps', express.static('public/apps'))
   ```
   Add this in `server/src/app.ts`.
7. Update app definitions' `uiUrl` to use production URLs:
   - Chess: `uiUrl: process.env.NODE_ENV === 'production' ? '/apps/chess/index.html' : 'http://localhost:3200'`
   - Weather: `uiUrl: process.env.NODE_ENV === 'production' ? '/apps/weather/index.html' : 'http://localhost:3202'`

## Acceptance Criteria

- [ ] Server deploys to Railway and starts successfully
- [ ] PostgreSQL database provisioned and connected
- [ ] Health check passes at `https://<domain>/health`
- [ ] WebSocket connections work over wss://
- [ ] App iframes load from production URLs
- [ ] All features work in production environment

## Validation

- [ ] Visit `https://<railway-domain>/health` -- returns ok
- [ ] Open the deployed chatbox -- chat works with streaming
- [ ] Play chess through the deployed app
- [ ] Check server logs in Railway dashboard for errors

## Stop and Ask

- If Railway requires specific configuration for WebSocket support, check their docs
- If the free tier doesn't support PostgreSQL, consider Neon or Supabase as alternatives
