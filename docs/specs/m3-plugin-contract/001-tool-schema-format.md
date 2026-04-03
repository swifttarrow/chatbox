# Task 001: Tool Schema Format & Validation

## Purpose

Define the TypeScript types and validation logic for tool schemas that apps register with the platform. These schemas tell the LLM what tools are available and how to call them. The Vercel AI SDK's `tool()` function requires **Zod schemas** (not JSON Schema) for parameter definitions, so app tool schemas must be defined using Zod.

## Inputs

- Spec: `docs/specs/m3-plugin-contract/README.md`
- Files: `server/src/db/schema.ts` (app_definitions table)
- Codebase reference: `src/renderer/packages/model-calls/toolsets/web-search.ts` (existing tool() usage pattern)

## Outputs

- Create: `server/src/apps/types.ts` (tool schema types, app definition types)
- Create: `server/src/apps/validation.ts` (validation utilities)
- Modify: `server/package.json` (add `zod` dependency if not already present)

## Dependencies

- Prior task: none within M3 (requires M1-M2 complete)
- Required artifacts: `server/src/db/schema.ts`

## Constraints

- Tool parameter schemas must be **Zod objects** (`z.ZodObject<any>`), NOT JSON Schema
- The Vercel AI SDK `tool()` function requires: `{ description: string, inputSchema: ZodSchema, execute: async (input) => result }`
- Each tool definition has: `name`, `description`, `parameters` (Zod schema)
- Use Zod for both parameter definitions AND validation of app definitions
- Tool names must be unique within an app
- Tool names should be snake_case, alphanumeric + underscore only
- Tool schemas are defined in code (not stored as JSON in DB); the `app_definitions.tool_schemas` JSONB column stores a **serialized summary** for API responses (tool names + descriptions), not the live Zod objects

## Required Changes

1. Add `zod` to `server/package.json` dependencies (if not already present from Drizzle)
2. Create `server/src/apps/types.ts`:
   ```typescript
   import { z } from 'zod'

   // A single tool that an app exposes to the LLM
   interface ToolDefinition {
     name: string              // e.g., "start_chess_game"
     description: string       // human-readable, shown to LLM for routing
     parameters: z.ZodObject<any>  // Zod schema for input validation
     isLauncher?: boolean      // true = always available (even without active session); used to start app interactions
   }

   type AppType = 'server_tool' | 'hybrid_session' | 'client_widget'

   interface AppDefinition {
     id: string                // e.g., "chess"
     version: string
     appType: AppType
     displayName: string
     description: string       // shown to LLM for routing
     tools: ToolDefinition[]   // live Zod-based tool definitions
     sessionSchemaVersion: number
     uiUrl: string | null
     enabled: boolean
     authRequirements: 'none' | 'internal' | 'oauth'
     allowedOrigins: string[]
   }

   // Serializable summary for DB storage and API responses (no Zod objects)
   interface AppDefinitionRecord {
     id: string
     version: string
     appType: AppType
     displayName: string
     description: string
     toolSummaries: { name: string; description: string; parameterNames: string[] }[]
     sessionSchemaVersion: number
     uiUrl: string | null
     enabled: boolean
     authRequirements: 'none' | 'internal' | 'oauth'
     allowedOrigins: string[]
   }
   ```
3. Create `server/src/apps/validation.ts`:
   - `validateAppDefinition(def: AppDefinition)`: validate tool names unique, snake_case, descriptions non-empty, Zod parameters are ZodObject instances
   - `toAppDefinitionRecord(def: AppDefinition): AppDefinitionRecord`: convert live definition to DB-storable format
   - `validateToolName(name: string): boolean`: snake_case check

## Acceptance Criteria

- [ ] `ToolDefinition` and `AppDefinition` types exported from `server/src/apps/types.ts`
- [ ] `ToolDefinition.parameters` is `z.ZodObject<any>` (Zod, not JSON Schema)
- [ ] Validation catches: missing fields, duplicate tool names, non-snake_case names
- [ ] `toAppDefinitionRecord()` produces a JSON-serializable object for DB storage
- [ ] Types are directly compatible with Vercel AI SDK's `tool({ description, inputSchema, execute })` pattern

## Validation

- [ ] `pnpm --filter @chatbox/server build` compiles without errors
- [ ] Unit test or inline script: create a `ToolDefinition` with `z.object({ color: z.string() })`, validate it passes; create one with duplicate names, validate it throws
- [ ] Verify: `tool({ description: def.description, inputSchema: def.parameters })` compiles without type errors

## Stop and Ask

- None expected; this design matches confirmed Vercel AI SDK behavior
