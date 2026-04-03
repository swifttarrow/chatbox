# Task 006: Dynamic Per-Turn Tool Injection

## Purpose

Extend the run orchestrator to dynamically inject eligible tool schemas into the LLM's function calling configuration on each turn. Tools are split into two categories: **launcher tools** (always available for enabled apps, used to start new app sessions) and **session tools** (only available when an app session is active). This solves the bootstrap problem: the user can say "let's play chess" before any chess session exists.

## Inputs

- Spec: `docs/specs/m3-plugin-contract/README.md`
- Files: `server/src/orchestrator/run.ts`, `server/src/orchestrator/context.ts`, `server/src/apps/sessions.ts`, `server/src/apps/registry.ts`, `server/src/ai/stream.ts`

## Outputs

- Modify: `server/src/orchestrator/context.ts` (add tool assembly)
- Modify: `server/src/orchestrator/run.ts` (pass tools to model call)
- Create: `server/src/orchestrator/tools.ts` (build Vercel AI SDK tools from app definitions)

## Dependencies

- Prior task: `005-app-session-lifecycle.md`
- Required artifacts: `server/src/apps/sessions.ts`, `server/src/apps/types.ts`, `server/src/apps/registry.ts`, `server/src/ai/stream.ts`

## Constraints

- **Launcher tools** (e.g., `start_chess_game`): always injected for all enabled apps, regardless of active sessions. Identified by the `isLauncher: true` field on the `ToolDefinition` (defined in M3-001). Each app should have exactly one launcher tool.
- **Session tools** (e.g., `get_board_state`, `suggest_move`): tools where `isLauncher` is false or undefined. Only injected when the app has an active session in this conversation.
- Tool definitions are Zod-based (from `AppDefinition.tools`); wrap each in `tool({ description, inputSchema: def.parameters })` with an `execute` stub that routes to the tool executor (M4-004 will provide real execution).
- App snapshots injected into system prompt or as context messages for active sessions.
- If no app sessions are active and no apps are enabled, no tools are included (pure chat mode).
- Token budget awareness: log total tool schema token estimate per turn (actual enforcement deferred).

## Required Changes

1. Create `server/src/orchestrator/tools.ts`:
   - `buildToolsForTurn(conversationId: string)`:
     - Get all enabled app definitions from `registry.getAllAppDefinitions()`
     - Get active app sessions for the conversation
     - For each enabled app:
       - Include tools where `isLauncher === true` always (regardless of session)
       - Include tools where `isLauncher` is falsy only if an active session exists for this app
     - For each included tool definition, create a Vercel AI SDK `tool()`:
       ```typescript
       tool({
         description: def.description,
         inputSchema: def.parameters,  // already a Zod schema
         execute: async (args) => {
           // Placeholder: return tool name + args for logging
           // M4-004 replaces this with real adapter routing
           return { toolName: def.name, args, appId, appSessionId }
         }
       })
       ```
     - Key each tool by its name in the returned `Record<string, Tool>`
     - Attach `appId` and `appSessionId` (if session exists) as closure context in the execute function
   - `buildAppContext(conversationId: string)`:
     - For each active app session, get adapter snapshot
     - Format as context message (system or tool role) to inject into messages

2. Modify `server/src/orchestrator/context.ts`:
   - `buildModelContext` now also calls `buildAppContext` to include app state
   - App context inserted after system prompt, before conversation history

3. Modify `server/src/orchestrator/run.ts`:
   - In `executeRun`: call `buildToolsForTurn` and pass `tools` to `streamChatCompletion`
   - Handle tool call responses from the model (detect `tool-call` in stream via `fullStream`)
   - For now: if model emits a tool call, log it (the `execute` stub returns placeholder data)
   - Add `RunEvent` types: `{ type: 'tool_call', toolName: string, args: unknown }`, `{ type: 'tool_result', toolName: string, result: unknown }`

4. Modify `server/src/ai/stream.ts`:
   - Ensure `streamChatCompletion` accepts and forwards `tools` parameter to `streamText`
   - Use `maxSteps: 3` (or configurable) to allow the model to call tools and continue generating

## Acceptance Criteria

- [ ] `start_chess_game` tool is available even WITHOUT an active chess session (launcher tool)
- [ ] `get_board_state` and `suggest_move` are only available WITH an active chess session (session tools)
- [ ] When no apps are enabled, no tools are included
- [ ] Model can emit a tool call (visible in server logs)
- [ ] App state snapshot appears in the model's context for active sessions
- [ ] Tool definitions use Zod schemas directly (no JSON Schema conversion)

## Validation

- [ ] Send "let's play chess" in a new conversation (no app session yet) -> model can call `start_chess_game` (launcher tool available)
- [ ] After session is created: `get_board_state` and `suggest_move` also become available
- [ ] Without any enabled apps: "let's play chess" gets a normal text response
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- If the launcher/session tool distinction creates complexity, simplify by always injecting all tools from all enabled apps (accepting the token cost for MVP)
