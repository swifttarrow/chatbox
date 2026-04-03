# Task 002: OAuth2 Flow for Authenticated App

## Purpose

Implement OAuth2 integration for one external authenticated app, demonstrating the platform's ability to handle apps that require user authorization. This satisfies the PRD requirement for at least one app with auth.

## Inputs

- Spec: `docs/specs/m6-auth-deploy-polish/README.md`
- Files: `server/src/db/schema.ts` (oauth_connections table), `server/src/apps/adapter.ts`

## Outputs

- Create: `server/src/auth/oauth.ts` (OAuth2 flow utilities)
- Create: `server/src/routes/oauth.ts` (OAuth endpoints: initiate, callback)
- Create: `server/src/apps/adapters/spotify.ts` OR `server/src/apps/adapters/github-app.ts`
- Create: `server/src/apps/definitions/spotify.ts` OR `server/src/apps/definitions/github-app.ts`
- Modify: `server/src/app.ts` (mount OAuth routes)
- Modify: `server/src/apps/definitions/index.ts`

## Dependencies

- Prior task: `001-platform-auth.md`
- Required artifacts: Auth middleware, oauth_connections table

## Constraints

- OAuth provider: **GitHub** (simpler scopes, familiar API, instant developer app creation at github.com/settings/developers)
- OAuth scopes: `repo` (read repos), `user:email` (read email)
- Tokens stored server-side in `oauth_connections` table (encrypted at rest if feasible, plaintext for MVP)
- Refresh tokens handled server-side
- Iframe NEVER has access to OAuth tokens
- Consent flow: user clicks "Connect" -> redirect to provider -> callback stores tokens -> app becomes usable
- If user hasn't connected, tool call returns "Please connect your [provider] account first" with a connect URL

## Required Changes

1. Create `server/src/auth/oauth.ts`:
   - `getAuthorizationUrl(provider, userId, redirectUri)`: generate OAuth URL with state param
   - `exchangeCode(provider, code, redirectUri)`: exchange auth code for tokens
   - `refreshAccessToken(provider, refreshToken)`: refresh expired token
   - `getAccessToken(userId, provider)`: get valid access token (refresh if needed)
   - `storeTokens(userId, provider, accessToken, refreshToken, expiresAt)`: persist in DB
2. Create `server/src/routes/oauth.ts`:
   - `GET /api/oauth/:provider/authorize`: redirect to provider's OAuth page
   - `GET /api/oauth/:provider/callback`: handle redirect, exchange code, store tokens, redirect back to app
   - `GET /api/oauth/:provider/status`: check if user has connected this provider
   - `DELETE /api/oauth/:provider`: disconnect (revoke/remove tokens)
3. Create `server/src/apps/adapters/github-app.ts` and `server/src/apps/definitions/github-app.ts`:
   - App ID: `github`
   - App type: `server_tool` (no iframe needed)
   - Tools:
     - `list_repos`: params `{ sort?: 'updated' | 'stars' }` -- list user's repos
     - `get_repo_info`: params `{ owner: string, repo: string }` -- get repo details (stars, issues, language)
     - `search_repos`: params `{ query: string }` -- search GitHub repos
   - `onToolCall`: check auth status first via `getAccessToken(userId, 'github')`
     - If not connected: return `{ success: false, error: 'Please connect your GitHub account', connectUrl: '/api/oauth/github/authorize' }`
     - If connected: call GitHub API with access token, return results
   - Auth requirements: `oauth`
   - GitHub API base: `https://api.github.com`
4. Mount routes, update definitions index, seed on startup

## Acceptance Criteria

- [ ] User can initiate OAuth flow from the chat (model provides connect link)
- [ ] OAuth callback stores tokens in database
- [ ] App tools work after OAuth connection
- [ ] Expired tokens are automatically refreshed
- [ ] Disconnecting removes tokens
- [ ] Iframe never has access to tokens

## Validation

- [ ] Click OAuth connect link -> redirected to provider -> callback succeeds -> tokens stored
- [ ] Use the app tool after connecting -> API call succeeds
- [ ] Check `oauth_connections` table: tokens present for user
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- If OAuth provider dev app credentials are not available, use a mock OAuth server for testing and document the setup
