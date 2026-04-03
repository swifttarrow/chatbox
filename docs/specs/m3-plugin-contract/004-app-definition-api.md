# Task 004: App Definition REST API

## Purpose

Expose REST endpoints for listing and retrieving app definitions so the chatbox client can display available apps and their capabilities to the user.

## Inputs

- Spec: `docs/specs/m3-plugin-contract/README.md`
- Files: `server/src/db/schema.ts`, `server/src/app.ts`

## Outputs

- Create: `server/src/routes/apps.ts` (app definition routes)
- Modify: `server/src/app.ts` (mount app routes)

## Dependencies

- Prior task: `003-app-definition-seeding.md`
- Required artifacts: `server/src/db/schema.ts` (app_definitions table), `server/src/app.ts`

## Constraints

- Only return enabled apps in list endpoint
- Tool schemas included in detail endpoint (needed for client to understand capabilities)
- No mutation endpoints for MVP (definitions are code-seeded only)

## Required Changes

1. Create `server/src/routes/apps.ts`:

   **GET /api/apps**
   - Returns: `{ apps: [{ id, displayName, description, appType, version, enabled }] }`
   - Only includes enabled apps
   - Does NOT include full tool schemas in list (keeps payload small)

   **GET /api/apps/:appId**
   - Returns: full app definition including tool schemas
   - 404 if not found or not enabled

2. Modify `server/src/app.ts`:
   - Mount: `app.use('/api/apps', appRoutes)`

## Acceptance Criteria

- [ ] `GET /api/apps` returns list of enabled apps
- [ ] `GET /api/apps/chess` returns full chess definition with tool schemas
- [ ] `GET /api/apps/nonexistent` returns 404
- [ ] Disabled apps do not appear in list

## Validation

- [ ] `curl http://localhost:3100/api/apps` returns JSON with chess in the list
- [ ] `curl http://localhost:3100/api/apps/chess` returns full definition
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- None expected
