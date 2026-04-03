# Task 002: Conversation CRUD REST API

## Purpose

Create REST endpoints for conversation lifecycle: create, list, get (with messages), and delete conversations. These endpoints support the chatbox client in loading history and managing conversations.

## Inputs

- Spec: `docs/specs/m2-streaming-chat/README.md`
- Files: `server/src/app.ts`, `server/src/db/schema.ts`, `server/src/db/index.ts`

## Outputs

- Create: `server/src/routes/conversations.ts` (conversation CRUD routes)
- Modify: `server/src/app.ts` (mount conversation routes)

## Dependencies

- Prior task: `001-server-ai-provider.md` (only for package.json sync; functionally independent)
- Required artifacts: `server/src/db/schema.ts` (conversations, messages tables), `server/src/app.ts`

## Constraints

- All routes namespaced under `/api/conversations`
- User ID comes from a placeholder `x-user-id` header (real auth in M6)
- Conversations are scoped to the requesting user
- Message history returns messages ordered by `created_at` ascending
- Pagination via `limit` and `offset` query params on list endpoint (default limit: 50)

## Required Changes

1. Create `server/src/routes/conversations.ts` with these endpoints:

   **POST /api/conversations**
   - Body: `{ title?: string }`
   - Creates conversation for the user
   - Returns: `{ id, title, createdAt }`

   **GET /api/conversations**
   - Query: `?limit=50&offset=0`
   - Returns: `{ conversations: [{ id, title, createdAt, updatedAt }], total: number }`
   - Ordered by `updated_at` descending

   **GET /api/conversations/:id**
   - Returns: `{ id, title, createdAt, messages: [{ id, role, content, createdAt, ... }] }`
   - Messages ordered by `created_at` ascending

   **DELETE /api/conversations/:id**
   - Soft delete or hard delete (hard delete for MVP)
   - Returns: `{ success: true }`
   - Only the owning user can delete

2. Modify `server/src/app.ts`:
   - Import and mount conversation routes: `app.use('/api/conversations', conversationRoutes)`

## Acceptance Criteria

- [ ] `POST /api/conversations` creates a conversation and returns it
- [ ] `GET /api/conversations` lists user's conversations (most recent first)
- [ ] `GET /api/conversations/:id` returns conversation with message history
- [ ] `DELETE /api/conversations/:id` removes the conversation
- [ ] User isolation: user A cannot see/delete user B's conversations
- [ ] Invalid conversation ID returns 404

## Validation

- [ ] `curl -X POST http://localhost:3100/api/conversations -H "Content-Type: application/json" -H "x-user-id: user1" -d '{"title":"Test"}'` returns 201 with conversation object
- [ ] `curl http://localhost:3100/api/conversations -H "x-user-id: user1"` returns the created conversation
- [ ] `curl http://localhost:3100/api/conversations/<id> -H "x-user-id: user1"` returns conversation with empty messages array
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- If the conversations table schema differs from what task 002 of M1 defined, reconcile before implementing
