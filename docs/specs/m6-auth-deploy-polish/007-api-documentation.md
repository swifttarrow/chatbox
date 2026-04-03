# Task 007: API Documentation

## Purpose

Create developer-facing documentation that explains how to build and register a third-party app on the ChatBridge platform. This is required by the PRD.

## Inputs

- Spec: `docs/specs/m6-auth-deploy-polish/README.md`
- Files: `server/src/routes/`, `server/src/apps/types.ts`, `src/shared/bridge/protocol.ts`

## Outputs

- Create: `docs/api/README.md` (API overview and getting started)
- Create: `docs/api/app-registration.md` (how to register an app)
- Create: `docs/api/tool-schemas.md` (tool schema format reference)
- Create: `docs/api/postmessage-protocol.md` (iframe communication protocol)
- Create: `docs/api/rest-endpoints.md` (REST API reference)

## Dependencies

- Prior task: all previous milestones (docs describe the implemented system)
- Required artifacts: All server routes, types, protocol definitions

## Constraints

- Documentation must be accurate to the implemented system
- Include code examples in TypeScript/JavaScript
- Cover the full plugin lifecycle: register -> tool call -> UI render -> user action -> completion
- Include the chess app as a worked example

## Required Changes

1. `docs/api/README.md`: overview, architecture diagram (text), getting started guide
2. `docs/api/app-registration.md`: app definition format, tool schema requirements, how to seed a new app
3. `docs/api/tool-schemas.md`: Zod schema format, parameter types, examples for each app
4. `docs/api/postmessage-protocol.md`: message types, envelope format, security requirements, lifecycle events
5. `docs/api/rest-endpoints.md`: all REST endpoints with request/response examples

## Acceptance Criteria

- [ ] A developer can read the docs and understand how to build a new app
- [ ] All endpoints documented with request/response examples
- [ ] postMessage protocol fully documented with all message types
- [ ] Tool schema format documented with examples
- [ ] Chess app used as a complete worked example

## Validation

- [ ] Review docs for accuracy against actual implementation
- [ ] Verify all documented endpoints exist and return expected responses

## Stop and Ask

- None expected
