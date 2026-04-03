# Task 001: Platform User Authentication

## Purpose

Add user authentication to the ChatBridge server so conversations are tied to real user accounts. Users can sign up, sign in, and their sessions are secured with JWTs.

## Inputs

- Spec: `docs/specs/m6-auth-deploy-polish/README.md`
- Files: `server/src/app.ts`, `server/src/db/schema.ts`, `server/src/config.ts`

## Outputs

- Create: `server/src/auth/middleware.ts` (JWT verification middleware)
- Create: `server/src/auth/utils.ts` (password hashing, JWT generation)
- Create: `server/src/routes/auth.ts` (sign up, sign in, me endpoints)
- Modify: `server/src/app.ts` (mount auth routes, apply middleware)
- Modify: `server/src/ws/gateway.ts` (verify JWT on WebSocket upgrade)
- Modify: `server/package.json` (add bcrypt, jsonwebtoken)
- Modify: `server/src/config.ts` (add JWT_SECRET)
- Create: `src/renderer/packages/bridge/auth.ts` (client-side auth)

## Dependencies

- Prior task: none within M6 (requires M1-M5 complete)
- Required artifacts: `server/src/db/schema.ts` (users, sessions tables)

## Constraints

- Use bcrypt for password hashing
- Use JWT for session tokens (short-lived: 7 days)
- Auth middleware replaces the `x-user-id` header placeholder
- WebSocket connections must include JWT in query params or first message
- Client stores JWT in localStorage (acceptable for MVP; httpOnly cookie is better but complex with WS)
- Sign-up requires: email, password, display name
- Sign-in requires: email, password

## Required Changes

1. Add to `server/package.json`: `bcryptjs`, `jsonwebtoken`; devDeps: `@types/bcryptjs`, `@types/jsonwebtoken`
2. Add to `server/src/config.ts`: `JWT_SECRET` (required env var)
3. Create `server/src/auth/utils.ts`:
   - `hashPassword(password)`: bcrypt hash
   - `verifyPassword(password, hash)`: bcrypt compare
   - `generateToken(userId, email)`: sign JWT
   - `verifyToken(token)`: verify and decode JWT
4. Create `server/src/auth/middleware.ts`:
   - Express middleware: extract Bearer token from Authorization header, verify, attach `req.userId`
   - Reject 401 if missing or invalid
5. Create `server/src/routes/auth.ts`:
   - `POST /api/auth/signup`: create user, return JWT
   - `POST /api/auth/signin`: verify credentials, return JWT
   - `GET /api/auth/me`: return current user info (requires auth)
6. Modify `server/src/app.ts`:
   - Mount auth routes (public, no middleware)
   - Apply auth middleware to `/api/conversations`, `/api/apps`, `/api/app-sessions`
7. Modify `server/src/ws/gateway.ts`:
   - Extract JWT from `?token=` query param on upgrade
   - Verify token, extract userId
   - Reject connection if invalid
8. Create `src/renderer/packages/bridge/auth.ts`:
   - `signUp(email, password, displayName)`: POST to auth API
   - `signIn(email, password)`: POST to auth API
   - `getStoredToken()`: read from localStorage
   - `setStoredToken(token)`: write to localStorage
   - `clearToken()`: remove from localStorage
   - Auto-include token in bridge API calls and WebSocket URL

## Acceptance Criteria

- [ ] Sign up creates user in database with hashed password
- [ ] Sign in returns valid JWT
- [ ] Protected routes reject requests without valid JWT
- [ ] WebSocket connections require valid JWT
- [ ] Client stores and sends JWT automatically
- [ ] `GET /api/auth/me` returns current user info

## Validation

- [ ] `curl -X POST .../api/auth/signup -d '{"email":"test@test.com","password":"pass123","displayName":"Test"}'` returns JWT
- [ ] Use returned JWT: `curl -H "Authorization: Bearer <token>" .../api/auth/me` returns user info
- [ ] `curl .../api/conversations` without token returns 401
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- If the team prefers OAuth-only auth (Google/GitHub sign-in), adapt to use passport.js or similar instead of credentials
