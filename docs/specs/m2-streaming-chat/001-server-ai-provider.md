# Task 001: Server-Side AI Provider Integration

## Purpose

Integrate the Vercel AI SDK on the ChatBridge server so it can call an LLM and stream responses. This is the core capability that powers all chat and tool-calling features.

## Inputs

- Spec: `docs/specs/m2-streaming-chat/README.md`
- Files: `server/src/config.ts`, `server/package.json`

## Outputs

- Create: `server/src/ai/provider.ts` (configured AI provider instance)
- Create: `server/src/ai/stream.ts` (streaming helper that wraps `streamText`)
- Modify: `server/package.json` (add ai, @ai-sdk/anthropic, @ai-sdk/openai)
- Modify: `server/src/config.ts` (add LLM config vars)
- Modify: `server/.env.example` (add LLM env vars)

## Dependencies

- Prior task: none within M2 (requires M1 complete)
- Required artifacts: `server/package.json`, `server/src/config.ts`

## Constraints

- Use `ai` (Vercel AI SDK core) and `@ai-sdk/anthropic` as default provider
- Support switching provider via `LLM_PROVIDER` env var (anthropic or openai)
- API key via `LLM_API_KEY` env var
- Model name via `LLM_MODEL` env var (default: `claude-sonnet-4-20250514`)
- The streaming helper must return an async iterable of text deltas and a final usage summary
- Do NOT add Express routes here -- just the AI module

## Required Changes

1. Add to `server/package.json` dependencies: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`
2. Add to `server/src/config.ts`: `LLM_PROVIDER` (default "anthropic"), `LLM_API_KEY` (required), `LLM_MODEL` (default "claude-sonnet-4-20250514")
3. Add to `server/.env.example`: `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`
4. Create `server/src/ai/provider.ts`:
   - Export `getProvider()` function that returns the configured AI provider based on `LLM_PROVIDER`
   - Export `getModel()` function that returns the model instance
5. Create `server/src/ai/stream.ts`:
   - Export `streamChatCompletion(messages, options?)` function
   - Uses `streamText` from Vercel AI SDK
   - Accepts messages array (system + conversation history)
   - Accepts optional `tools` parameter (for future M3 integration)
   - Returns the `streamText` result (which provides `textStream`, `fullStream`, `usage`, etc.)
   - Includes a system prompt parameter (default: a basic helpful assistant prompt)

## Acceptance Criteria

- [ ] `server/src/ai/provider.ts` exports `getProvider()` and `getModel()`
- [ ] `server/src/ai/stream.ts` exports `streamChatCompletion()`
- [ ] Provider switches correctly based on `LLM_PROVIDER` env var
- [ ] Streaming works (can iterate over text deltas)
- [ ] TypeScript compiles without errors

## Validation

- [ ] `pnpm --filter @chatbox/server build` compiles without errors
- [ ] Write a simple test script or add a temporary route that calls `streamChatCompletion` with a test message and logs streamed tokens (remove after verification)

## Stop and Ask

- If `LLM_API_KEY` is not available, ask the user which provider and key to use
