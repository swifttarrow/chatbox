# Task 001: Equation Solver Adapter

## Purpose

Implement a server_tool-type app that solves mathematical equations. This demonstrates the simpler app pattern: stateless computation with no persistent UI session.

## Inputs

- Spec: `docs/specs/m5-additional-apps/README.md`
- Files: `server/src/apps/adapter.ts`, `server/src/apps/types.ts`

## Outputs

- Create: `server/src/apps/adapters/equation-solver.ts`
- Create: `server/src/apps/definitions/equation-solver.ts`
- Modify: `server/src/apps/definitions/index.ts` (add equation solver)
- Modify: `server/package.json` (add `mathjs`)

## Dependencies

- Prior task: none within M5 (requires M3-M4 complete)
- Required artifacts: `server/src/apps/adapter.ts`

## Constraints

- App type: `server_tool` (no persistent session state needed for basic solving)
- Use `mathjs` library for expression evaluation and equation solving
- Tools: `solve_equation`, `evaluate_expression`, `simplify_expression`
- Tool parameters defined as Zod schemas (matching M3-001 convention)
- Keep results concise and formatted for the model to relay to the user
- Handle: basic algebra, arithmetic, calculus expressions, unit conversions

## Required Changes

1. Add `mathjs` to `server/package.json`
2. Create `server/src/apps/definitions/equation-solver.ts`:
   - `id`: 'equation-solver'
   - `appType`: 'server_tool'
   - `displayName`: 'Equation Solver'
   - `description`: 'Solve mathematical equations, evaluate expressions, and simplify algebra. Handles algebra, arithmetic, calculus, and unit conversions.'
   - Tools (parameters as Zod schemas):
     - `solve_equation`: params `z.object({ equation: z.string().describe('The equation to solve, e.g. "x^2 + 3x - 4 = 0"') })` -- solve for unknowns
     - `evaluate_expression`: params `z.object({ expression: z.string().describe('The expression to evaluate, e.g. "sin(pi/4) * sqrt(2)"') })` -- evaluate numeric expression
     - `simplify_expression`: params `z.object({ expression: z.string().describe('The expression to simplify, e.g. "(x^2 - 1) / (x - 1)"') })` -- simplify algebraic expression
3. Create `server/src/apps/adapters/equation-solver.ts`:
   - Implements `AppAdapter`
   - `onToolCall`:
     - `solve_equation`: parse and solve using mathjs
     - `evaluate_expression`: evaluate using mathjs, return numeric result
     - `simplify_expression`: simplify using mathjs
   - `onUserAction`: no-op (server_tool, no iframe interaction)
   - `getSnapshot`: minimal (just last result)
   - `getInitialState`: `{}`
   - Handle errors gracefully (invalid expressions -> clear error message)
4. Update `server/src/apps/definitions/index.ts` to include equation solver

## Acceptance Criteria

- [ ] `solve_equation({equation: "x^2 + 3x - 4 = 0"})` returns roots `[1, -4]`
- [ ] `evaluate_expression({expression: "sin(pi/4) * sqrt(2)"})` returns `1`
- [ ] `simplify_expression({expression: "(x^2 - 1) / (x - 1)"})` returns `x + 1`
- [ ] Invalid input returns clear error, not crash
- [ ] App definition seeded on server startup

## Validation

- [ ] `pnpm --filter @chatbox/server build` compiles without errors
- [ ] Server startup logs seeding of equation-solver
- [ ] `curl http://localhost:3100/api/apps` lists equation-solver
- [ ] Send "solve x^2 + 3x - 4 = 0" in chat with equation solver active -> correct result

## Stop and Ask

- If mathjs cannot handle a particular equation type, document the limitation rather than adding a complex solver
