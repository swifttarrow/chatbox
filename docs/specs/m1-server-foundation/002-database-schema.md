# Task 002: Database Schema with Drizzle ORM

## Purpose

Define the complete PostgreSQL schema using Drizzle ORM and create the initial migration. All core entities from the architecture are defined upfront so later milestones add logic, not schema.

## Inputs

- Spec: `docs/specs/m1-server-foundation/README.md`
- Architecture entities: User, Session, Conversation, Message, App definition, App session, Conversation run, Run step, App event, OAuth connection, Audit log
- Prior task: `001-init-server-package.md` (server package must exist)

## Outputs

- Create: `server/src/db/schema.ts` (all Drizzle table definitions)
- Create: `server/src/db/index.ts` (database client initialization)
- Create: `server/drizzle.config.ts` (Drizzle Kit configuration)
- Create: `server/src/db/migrations/` (generated migration files)
- Modify: `server/package.json` (add drizzle-orm, drizzle-kit, postgres dependencies and migration scripts)

## Dependencies

- Prior task: `001-init-server-package.md`
- Required artifacts: `server/package.json`, `server/tsconfig.json`

## Constraints

- Use `drizzle-orm` with `postgres` driver (node-postgres)
- All IDs should be UUIDs (use `uuid` column type with `gen_random_uuid()` default)
- Timestamps: `created_at` and `updated_at` on all tables
- JSON columns for flexible state storage (app session domain_state, view_state, tool schemas)
- Message role enum: `system`, `user`, `assistant`, `tool`
- App type enum: `server_tool`, `hybrid_session`, `client_widget`
- Run status enum: `created`, `streaming_model`, `invoking_tool`, `awaiting_app_ack`, `awaiting_user_action`, `running`, `succeeded`, `failed`, `cancelled`, `timed_out`
- Environment variable `DATABASE_URL` for connection string

## Required Changes

1. Add dependencies to `server/package.json`: `drizzle-orm`, `postgres` (node-postgres), `dotenv`; devDeps: `drizzle-kit`
2. Add scripts to `server/package.json`: `db:generate` (drizzle-kit generate), `db:migrate` (drizzle-kit migrate), `db:studio` (drizzle-kit studio)
3. Create `server/.env.example` with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chatbridge`
4. Create `server/drizzle.config.ts` pointing to schema file and DATABASE_URL
5. Create `server/src/db/schema.ts` with these tables:

   **users**: id (uuid pk), email (text unique), display_name (text), password_hash (text nullable), created_at, updated_at

   **sessions**: id (uuid pk), user_id (fk users), token (text unique), expires_at (timestamp), created_at

   **conversations**: id (uuid pk), user_id (fk users), title (text), created_at, updated_at

   **messages**: id (uuid pk), conversation_id (fk conversations), role (enum), content (text), tool_call_id (text nullable), tool_name (text nullable), token_count_input (int nullable), token_count_output (int nullable), metadata (jsonb nullable), created_at

   **app_definitions**: id (text pk, e.g. "chess"), version (text), app_type (enum), display_name (text), description (text), tool_schemas (jsonb), session_schema_version (int), ui_url (text nullable), enabled (boolean default true), auth_requirements (text default "none"), allowed_origins (jsonb nullable), created_at, updated_at

   **app_sessions**: id (uuid pk), conversation_id (fk conversations), app_id (fk app_definitions), status (text default "active"), domain_state (jsonb), view_state (jsonb nullable), state_version (int default 0), created_at, updated_at

   **conversation_runs**: id (uuid pk), conversation_id (fk conversations), status (enum), trigger_message_id (uuid nullable), model (text nullable), token_count_input (int nullable), token_count_output (int nullable), error (text nullable), started_at (timestamp), completed_at (timestamp nullable), created_at

   **run_steps**: id (uuid pk), run_id (fk conversation_runs), step_type (text), app_id (text nullable), tool_name (text nullable), input (jsonb nullable), output (jsonb nullable), status (text), duration_ms (int nullable), created_at

   **app_events**: id (uuid pk), app_session_id (fk app_sessions), event_type (text), payload (jsonb), source (text), correlation_id (text nullable), created_at

   **oauth_connections**: id (uuid pk), user_id (fk users), provider (text), access_token_encrypted (text), refresh_token_encrypted (text nullable), expires_at (timestamp nullable), scopes (text nullable), created_at, updated_at

   **audit_log**: id (uuid pk), user_id (uuid nullable), action (text), resource_type (text), resource_id (text nullable), metadata (jsonb nullable), created_at

6. Create `server/src/db/index.ts` that initializes Drizzle with postgres driver using DATABASE_URL
7. Run `pnpm --filter @chatbox/server db:generate` to produce migration SQL

## Acceptance Criteria

- [ ] All 11 tables defined in `server/src/db/schema.ts`
- [ ] `server/src/db/index.ts` exports a configured Drizzle client
- [ ] `server/drizzle.config.ts` is valid
- [ ] Migration files generated in `server/src/db/migrations/`
- [ ] `pnpm --filter @chatbox/server db:migrate` creates all tables in PostgreSQL
- [ ] All foreign key relationships defined
- [ ] UUID defaults, timestamp defaults, and enum types in place

## Validation

- [ ] `pnpm --filter @chatbox/server db:migrate` runs without error against a local PostgreSQL
- [ ] Connect to the database and verify all 11 tables exist: `psql $DATABASE_URL -c "\dt"`
- [ ] `pnpm --filter @chatbox/server build` compiles without TypeScript errors

## Stop and Ask

- If PostgreSQL is not available locally, ask about Docker setup (covered in task 005)
- If the architecture doc's entity list has changed, reconcile before proceeding
