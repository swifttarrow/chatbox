# Task 001: Initialize Server Workspace Package

## Purpose

Create the `server/` directory as a pnpm workspace package with TypeScript, Express, and development tooling. This is the foundation every other server-side task builds on.

## Inputs

- Spec: `docs/specs/m1-server-foundation/README.md`
- Root config: `pnpm-workspace.yaml`, `package.json`, `tsconfig.json`

## Outputs

- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts` (minimal entry point that logs "ChatBridge server starting")
- Modify: `pnpm-workspace.yaml` (add `server` to packages list)

## Dependencies

- Prior task: none

## Constraints

- Node >= 20 (match root engine requirement)
- TypeScript strict mode
- Package name: `@chatbox/server`
- Use `tsx` for dev (fast TypeScript execution without compile step)
- Use `tsup` or `tsc` for production build
- Do NOT add Express or other runtime deps here -- that is task 003

## Required Changes

1. Create `server/package.json` with:
   - `name`: `@chatbox/server`
   - `version`: `0.0.1`
   - `private`: true
   - `type`: `module`
   - `scripts`: `dev` (tsx watch), `build` (tsc or tsup), `start` (node dist/index.js)
   - `devDependencies`: `typescript`, `tsx`, `@types/node`
2. Create `server/tsconfig.json` with:
   - `target`: `es2022`
   - `module`: `nodenext`
   - `moduleResolution`: `nodenext`
   - `strict`: true
   - `outDir`: `dist`
   - `rootDir`: `src`
   - `esModuleInterop`: true
   - `skipLibCheck`: true
3. Create `server/src/index.ts` with a minimal console.log startup message
4. Add `server` to `pnpm-workspace.yaml` packages array
5. Run `pnpm install` from root to link the workspace

## Acceptance Criteria

- [ ] `server/package.json` exists with correct name and scripts
- [ ] `server/tsconfig.json` exists with strict TypeScript config
- [ ] `server/src/index.ts` exists and is valid TypeScript
- [ ] `pnpm-workspace.yaml` includes `server` in packages
- [ ] `pnpm --filter @chatbox/server dev` starts and logs the startup message
- [ ] `pnpm --filter @chatbox/server build` produces `server/dist/index.js`

## Validation

- [ ] `pnpm install` from root completes without errors
- [ ] `pnpm --filter @chatbox/server dev` outputs "ChatBridge server starting"
- [ ] `ls server/dist/index.js` exists after build

## Stop and Ask

- If `pnpm-workspace.yaml` has an unexpected format or additional packages not documented, ask before modifying
