# Milestone 6: Auth, Security, Deployment & Polish

## Outcome

The platform has user authentication, OAuth2 support for at least one external authenticated app, hardened security (CSP, iframe sandboxing), graceful error handling, production deployment on Railway, API documentation for third-party developers, and a cost analysis. The application is production-ready and publicly accessible.

## Scope

- Platform user authentication (sign up, sign in, session management)
- OAuth2 flow for GitHub (external authenticated app)
- CSP headers and iframe sandbox hardening
- Error handling: timeouts, app crashes, invalid tool calls, network failures
- Loading states and progress indicators throughout the UX
- Railway deployment: server + PostgreSQL + static app hosting
- API documentation for third-party developers
- AI cost analysis (dev spend + production projections)

## Out of Scope

- Teacher allowlists and policy management (future feature)
- Multi-region deployment
- CI/CD pipeline (nice-to-have, not required)
- Client widget app type

## Source Inputs

- PRD: `docs/chat-bridge/prd.md` (Auth, Performance, Submission Requirements)
- Architecture: `docs/chat-bridge/architecture.md`
- Pre-search: `docs/chat-bridge/pre-search.md`

## Constraints

- Auth must support the three app categories: internal (no auth), external public (API key), external authenticated (OAuth2)
- OAuth tokens stored server-side only; never in iframe or client JS
- CSP must allow only known app origins for iframe `src`
- All timeouts must transition runs to a persisted terminal or recoverable state
- Error states must be user-visible (not silent failures)
- Deployment must be publicly accessible with a stable URL

## Decisions

- **Platform auth**: NextAuth.js (or Lucia Auth) with credentials + optional OAuth providers
- **OAuth app**: GitHub integration (demonstrates external authenticated pattern; instant sandbox access, familiar API)
- **Deployment**: Railway for ChatBridge server + PostgreSQL; chatbox web build as static site (Vercel, Railway static, or Netlify)
- **API docs**: OpenAPI spec generated from Express routes + markdown developer guide

## Assumptions

- M1-M5 are complete; all 3 apps work end-to-end
- Railway account is available for deployment
- At least one OAuth provider's developer credentials are available

## Task Order

1. `001-platform-auth.md` - User authentication: sign up, sign in, session tokens, middleware
1b. `001b-auth-ui.md` - Sign-in/sign-up UI components in the chatbox client
2. `002-oauth-flow.md` - OAuth2 integration for GitHub (external authenticated app)
3. `003-csp-and-sandbox.md` - Content Security Policy headers and iframe sandbox hardening
4. `004-error-handling.md` - Timeout management, error states, recovery flows
5. `005-loading-states.md` - Spinners, progress indicators, streaming visual cues
6. `006-railway-deployment.md` - Deploy server, database, and static apps to Railway
7. `007-api-documentation.md` - Developer-facing API docs and integration guide
8. `008-cost-analysis.md` - AI development spend tracking and production cost projections

## Milestone Success Criteria

- Users can sign up, sign in, and have their conversations persisted to their account
- At least one app requires OAuth; the consent flow works end-to-end
- CSP headers block unauthorized iframe sources
- App timeout shows a user-friendly error with retry option
- Invalid tool calls don't crash the conversation
- The app is deployed and accessible at a public URL
- API documentation covers app registration, tool schemas, and the plugin lifecycle
- Cost analysis includes dev spend and projections for 100/1K/10K/100K users

## Milestone Validation

- Sign up a new user, sign in, create a conversation, verify it persists across sessions
- Trigger the OAuth flow for the authenticated app; verify token stored server-side
- Inspect response headers for CSP; verify iframe from unknown origin is blocked
- Simulate app timeout (e.g., kill iframe); verify error state and recovery
- Visit the deployed URL from an external device/network
- Review API docs for completeness
- `pnpm --filter server build` and `pnpm build:web` compile without errors

## Risks / Follow-ups

- GitHub OAuth developer app requires setup at github.com/settings/developers
- Railway free tier limits may require paid plan for PostgreSQL
- Cost projections are estimates; document assumptions clearly
