# Milestone 5: Additional Apps & Multi-App Routing

## Outcome

Two additional apps are integrated alongside Chess, demonstrating different integration patterns. The chatbot correctly routes user requests to the appropriate app, supports switching between apps in a single conversation, and handles ambiguous queries gracefully. The platform now has 3+ working third-party apps as required by the PRD.

## Scope

- Equation Solver app (server_tool pattern -- computation with optional rich UI)
- Weather Dashboard app (external public pattern -- external API, no user auth, UI rendering)
- Multi-app routing: model selects correct app based on user intent
- App switching: user can use Chess, then Equation Solver, then return to Chess in one conversation
- Ambiguous query handling: model asks for clarification when intent is unclear
- System prompt engineering for multi-app awareness

## Out of Scope

- OAuth-authenticated apps (M6)
- Teacher allowlists / policy enforcement (deferred)
- App marketplace or dynamic registration (MVP uses in-repo bundles only)

## Source Inputs

- PRD: `docs/chat-bridge/prd.md` (Required Third-Party Apps, Testing Scenarios)
- Architecture: `docs/chat-bridge/architecture.md`
- Pre-search: `docs/chat-bridge/pre-search.md`

## Constraints

- Equation Solver: `server_tool` type -- no iframe needed for basic mode; optional math rendering UI
- Weather Dashboard: `hybrid_session` type -- fetches from a public weather API (e.g., Open-Meteo, no API key needed), renders dashboard in iframe
- Both apps must use the same AppAdapter interface defined in M3
- Tool schemas for all 3 apps must coexist; dynamic injection ensures only relevant tools per turn
- The model must correctly refuse to invoke apps for unrelated queries (PRD testing scenario 7)

## Decisions

- **Equation Solver tools**: `solve_equation` (takes equation string, returns solution steps), `plot_function` (takes expression, returns plot data)
- **Weather tools**: `get_weather` (takes location, returns current + forecast), `show_dashboard` (renders interactive weather UI)
- **Weather API**: Open-Meteo (free, no API key, reliable)
- **Equation solving**: Use `mathjs` library for expression parsing and solving
- **Multi-app routing**: Rely on LLM function calling with well-described tool schemas; no custom routing layer

## Assumptions

- M4 Chess vertical is complete and working (proves the full lifecycle)
- M3 plugin contract handles multiple app definitions and sessions
- M2 run orchestrator supports tool calls

## Task Order

1. `001-equation-solver-adapter.md` - Server-side equation solver adapter and tools
2. `003-weather-adapter.md` - Server-side weather adapter with Open-Meteo integration (independent of 001)
3. `004-weather-iframe-app.md` - Weather dashboard iframe app (depends on 003)
4. `005-multi-app-routing.md` - System prompt tuning and multi-app tool injection strategy (depends on 001 + 003)
5. `006-app-switching.md` - Support multiple active/inactive app sessions in one conversation (depends on 005)
6. `002-equation-solver-ui.md` - **OPTIONAL**: math rendering iframe for equation results. Skip if time-constrained; the equation solver works without it (model relays results as text). Only implement after all required tasks are complete.

## Milestone Success Criteria

- User asks "solve x^2 + 3x - 4 = 0" -> model invokes equation solver -> solution displayed
- User asks "what's the weather in Chicago?" -> model invokes weather tool -> dashboard appears
- User switches from weather to chess to equation solver in one conversation
- User asks an ambiguous question -> model asks for clarification or picks the most likely app
- User asks "tell me a joke" -> model responds normally without invoking any app
- All 3 apps listed in `GET /api/apps`

## Milestone Validation

- Use each app via the chat interface and verify correct tool invocation
- Verify app sessions are created/tracked for each app used
- Test the 7 testing scenarios from the PRD in sequence
- `pnpm --filter server build` and `pnpm build:web` compile without errors

## Risks / Follow-ups

- LLM routing accuracy depends heavily on tool descriptions; may need iteration
- Weather API rate limits could affect testing; Open-Meteo is generous but cache results if needed
- Equation solver edge cases (complex numbers, systems of equations) -- scope to basic algebra for MVP
