# Task 003: App Definition Seeding

## Purpose

Load in-repo app definitions into the database at server startup. This ensures apps are discoverable via the API and their tool schemas are available for the run orchestrator.

## Inputs

- Spec: `docs/specs/m3-plugin-contract/README.md`
- Files: `server/src/apps/types.ts`, `server/src/apps/validation.ts`, `server/src/db/schema.ts`

## Outputs

- Create: `server/src/apps/registry.ts` (app definitions and seeding logic)
- Create: `server/src/apps/definitions/chess.ts` (Chess app definition)
- Create: `server/src/apps/definitions/index.ts` (export all definitions)
- Modify: `server/src/index.ts` (call seed on startup)

## Dependencies

- Prior task: `002-app-adapter-interface.md`
- Required artifacts: `server/src/apps/types.ts`, `server/src/apps/validation.ts`, `server/src/db/schema.ts`

## Constraints

- Definitions are upserted (insert or update on conflict) so restarts don't fail
- Validation runs before insertion -- invalid definitions fail loudly at startup
- Each definition file exports an `AppDefinition` object
- Chess is the first definition; Equation Solver and Weather are added in M5

## Required Changes

1. Create `server/src/apps/definitions/chess.ts`:
   ```typescript
   import { z } from 'zod'
   import type { AppDefinition } from '../types.js'

   export const chessDefinition: AppDefinition = {
     id: 'chess',
     version: '1.0.0',
     appType: 'hybrid_session',
     displayName: 'Chess',
     description: 'Play an interactive chess game. The user can start a new game, make moves, ask for help analyzing the board, and play until checkmate or draw.',
     tools: [
       {
         name: 'start_chess_game',
         description: 'Start a new chess game. Call this when the user wants to play chess.',
         parameters: z.object({ color: z.enum(['white', 'black']).optional().describe('The color the user plays as. Default white.') }),
         isLauncher: true
       },
       {
         name: 'get_board_state',
         description: 'Get the current chess board state including FEN, legal moves, and game status.',
         parameters: z.object({})
       },
       {
         name: 'suggest_move',
         description: 'Analyze the current board position and suggest a good move for the user.',
         parameters: z.object({})
       }
     ],
     sessionSchemaVersion: 1,
     uiUrl: null,  // updated to the chess app URL when M4-005 creates the iframe app; update the definition file and re-seed
     enabled: true,
     authRequirements: 'none',
     allowedOrigins: []
   }
   ```
2. Create `server/src/apps/definitions/index.ts`: export array of all definitions
3. Create `server/src/apps/registry.ts`:
   - `seedAppDefinitions()`: validate each definition, convert to `AppDefinitionRecord` via `toAppDefinitionRecord()`, upsert into `app_definitions` table
   - `getAppDefinition(appId: string): AppDefinition | undefined`: look up the in-memory definition (with live Zod schemas) by app ID
   - `getAllAppDefinitions(): AppDefinition[]`: return all registered definitions
   - Maintain an in-memory `Map<string, AppDefinition>` populated at startup alongside DB seeding
   - Log each seeded app
4. Modify `server/src/index.ts`:
   - After DB connection: call `seedAppDefinitions()`
   - Log success or fail

## Acceptance Criteria

- [ ] Server startup seeds chess definition into `app_definitions` table
- [ ] Restarting the server doesn't create duplicates (upsert)
- [ ] Invalid definitions cause startup failure with clear error message
- [ ] `SELECT * FROM app_definitions WHERE id = 'chess'` returns the definition with tool schemas

## Validation

- [ ] Start server: `pnpm --filter @chatbox/server dev`; check logs for "Seeded app: chess"
- [ ] Query DB: `psql $DATABASE_URL -c "SELECT id, display_name FROM app_definitions"`
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- If the `app_definitions` table schema from M1 doesn't match the `AppDefinition` type, reconcile the schema first
