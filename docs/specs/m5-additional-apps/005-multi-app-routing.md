# Task 005: Multi-App Routing & System Prompt

## Purpose

Ensure the model correctly routes user requests to the right app when multiple apps are available. This requires system prompt engineering and proper tool description quality.

## Inputs

- Spec: `docs/specs/m5-additional-apps/README.md`
- Files: `server/src/orchestrator/context.ts`, `server/src/apps/definitions/`

## Outputs

- Modify: `server/src/orchestrator/context.ts` (enhance system prompt for multi-app awareness)
- Modify: `server/src/apps/definitions/chess.ts` (refine tool descriptions)
- Modify: `server/src/apps/definitions/equation-solver.ts` (refine tool descriptions)
- Modify: `server/src/apps/definitions/weather.ts` (refine tool descriptions)

## Dependencies

- Prior task: `003-weather-adapter.md`, `001-equation-solver-adapter.md`
- Required artifacts: All app definitions, `server/src/orchestrator/context.ts`

## Constraints

- The model must pass these routing tests (from PRD):
  1. "let's play chess" -> chess tools
  2. "solve x^2 - 5x + 6 = 0" -> equation solver
  3. "what's the weather in Paris?" -> weather tools
  4. "tell me a joke" -> no tool call (pure text response)
  5. Ambiguous: "can you help me?" -> asks clarification
  6. "what can you do?" -> describes available apps
- Do NOT build a custom routing layer; rely on well-described tools + system prompt
- Tool descriptions must be clear and distinct (no overlap in when to use each tool)

## Required Changes

1. Modify system prompt in `server/src/orchestrator/context.ts`:
   ```
   You are a helpful AI assistant with access to interactive apps.
   When a user wants to use an app, call the appropriate tool.
   Only use tools when the user's request clearly matches an app's capabilities.
   For general questions, respond with text only.
   If the user's request is ambiguous, ask for clarification.
   When an app is active, you can see its current state and reference it in your responses.
   Available apps are provided as tools below.
   ```
2. Refine tool descriptions in each app definition to be:
   - Clear about WHEN to use the tool (trigger phrases)
   - Clear about what it does
   - Distinct from other tools (no ambiguity between apps)
3. Test and iterate on descriptions until routing is reliable

## Acceptance Criteria

- [ ] "let's play chess" triggers chess tool call
- [ ] "solve x^2 - 5x + 6 = 0" triggers equation solver
- [ ] "what's the weather in Paris?" triggers weather tool
- [ ] "tell me a joke" gets a text response with no tool calls (PRD scenario 7: refuse unrelated queries)
- [ ] "what can you do?" lists available apps/capabilities in text
- [ ] "what can you do?" lists available capabilities
- [ ] Ambiguous requests get clarification, not wrong tool calls

## Validation

- [ ] Run through all 7 PRD testing scenarios manually
- [ ] Verify correct tool calls in server logs for each scenario
- [ ] `pnpm --filter @chatbox/server build` compiles without errors

## Stop and Ask

- If the model consistently misroutes despite good descriptions, consider adding few-shot examples to the system prompt
