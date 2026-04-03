# Task 002: Equation Solver UI (Optional Rich Rendering)

## Purpose

Add an optional iframe UI for the equation solver that renders formatted math (LaTeX) and step-by-step solutions. If time is tight, the model can relay results as markdown text instead -- this task is lower priority than other M5 tasks.

## Inputs

- Spec: `docs/specs/m5-additional-apps/README.md`
- Files: `src/shared/bridge/protocol.ts`, `apps/chess/` (as reference for app structure)

## Outputs

- Create: `apps/equation-solver/package.json`
- Create: `apps/equation-solver/vite.config.ts`
- Create: `apps/equation-solver/tsconfig.json`
- Create: `apps/equation-solver/index.html`
- Create: `apps/equation-solver/src/main.tsx`
- Create: `apps/equation-solver/src/App.tsx`
- Create: `apps/equation-solver/src/bridge.ts`
- Modify: `server/src/apps/definitions/equation-solver.ts` (set uiUrl)

## Dependencies

- Prior task: `001-equation-solver-adapter.md`
- Required artifacts: `src/shared/bridge/protocol.ts`, equation solver adapter

## Constraints

- Use KaTeX for LaTeX math rendering (fast, lightweight)
- Display: input equation, solution steps, final answer
- Receives results via `app.state_patch` from server
- No user interaction needed (display-only for MVP)
- Same postMessage protocol as chess iframe

## Required Changes

1. Create `apps/equation-solver/` project (mirror chess app structure)
2. Dependencies: `react`, `react-dom`, `katex`, `react-katex`
3. Create bridge.ts (copy pattern from chess, simplify)
4. Create App.tsx:
   - On `app.init` or `app.state_patch`: display equation and solution
   - Render math using KaTeX
   - Show: original equation, steps (if available), result
5. Update equation solver definition `uiUrl` to point to app dev server (port 3201)

## Acceptance Criteria

- [ ] Math renders correctly with KaTeX formatting
- [ ] Equation and solution displayed when state patch received
- [ ] Works inside sandboxed iframe
- [ ] `pnpm --filter @chatbox/equation-solver-app dev` starts on port 3201

## Validation

- [ ] Solve an equation via chat; see formatted result in iframe
- [ ] `pnpm --filter @chatbox/equation-solver-app build` succeeds

## Stop and Ask

- If this task is blocking higher-priority work, skip the iframe UI and have the model return results as markdown text only
