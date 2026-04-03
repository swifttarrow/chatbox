# Task 001b: Authentication UI Components

## Purpose

Create the sign-in and sign-up UI components in the chatbox client so users can authenticate before using bridge-mode conversations.

## Inputs

- Spec: `docs/specs/m6-auth-deploy-polish/README.md`
- Files: `src/renderer/packages/bridge/auth.ts` (from task 001), `src/renderer/packages/bridge/store.ts`

## Outputs

- Create: `src/renderer/components/bridge/AuthForm.tsx` (sign-in/sign-up form)
- Create: `src/renderer/components/bridge/AuthGate.tsx` (wrapper that shows auth form if not authenticated)
- Modify: `src/renderer/packages/bridge/store.ts` (add auth state: token, user, isAuthenticated)

## Dependencies

- Prior task: `001-platform-auth.md` (server auth endpoints must exist)
- Required artifacts: `src/renderer/packages/bridge/auth.ts`

## Constraints

- Use Mantine form components (already in project dependencies)
- Auth state persisted in localStorage via bridge auth utilities
- On app load: check for stored token, validate via `GET /api/auth/me`, set auth state
- AuthGate wraps BridgeChat -- if not authenticated, show AuthForm instead
- Minimal UI: email + password fields, sign-in/sign-up toggle, error display

## Required Changes

1. Modify `src/renderer/packages/bridge/store.ts`:
   - Add: `token: string | null`, `user: { id, email, displayName } | null`, `isAuthenticated: boolean`
   - Add: `checkAuth()`: load token from localStorage, verify with server, set user state
   - Add: `signIn(email, password)`: call auth API, store token, set user state
   - Add: `signUp(email, password, displayName)`: call auth API, store token, set user state
   - Add: `signOut()`: clear token and user state
   - On `connect()`: include token in WebSocket URL query params

2. Create `src/renderer/components/bridge/AuthForm.tsx`:
   - Props: `onSuccess(): void`
   - Toggle between sign-in and sign-up modes
   - Form fields: email (required), password (required), displayName (sign-up only)
   - Submit calls store `signIn` or `signUp`
   - Show error on failure (wrong credentials, email taken, etc.)
   - Show loading spinner during submission

3. Create `src/renderer/components/bridge/AuthGate.tsx`:
   - Props: `children: ReactNode`
   - If `isAuthenticated`: render children
   - If not authenticated and checking: show loading spinner
   - If not authenticated: render `AuthForm` with `onSuccess` that triggers child render

4. Modify `src/renderer/components/bridge/BridgeLayout.tsx` (created in M2-007):
   - Wrap the entire layout content with `<AuthGate>...</AuthGate>`
   - This means: navigating to `/bridge` shows the auth form if not logged in, or the full bridge layout if authenticated
   - AuthGate calls `checkAuth()` from the bridge store on mount to verify any stored token

## Acceptance Criteria

- [ ] User sees sign-in form when not authenticated
- [ ] Sign-up creates account and logs in
- [ ] Sign-in with valid credentials succeeds and shows chat
- [ ] Invalid credentials show error message
- [ ] Refreshing the page preserves auth state (token in localStorage)
- [ ] Sign-out clears state and shows auth form

## Validation

- [ ] Open bridge mode: see auth form
- [ ] Sign up with new email: form disappears, chat appears
- [ ] Refresh page: still authenticated
- [ ] Sign out: auth form appears again
- [ ] `pnpm build:web` compiles without errors

## Stop and Ask

- If Mantine form components are not available in the renderer build, use plain HTML form elements
