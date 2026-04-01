# ChatBridge Architecture

## Executive Summary

ChatBridge is a chat platform that lets the assistant work with interactive third-party apps inside the conversation UI. The key design decision is that apps may control UI, but the server controls truth. This keeps the system flexible enough to support chess, an equation solver, and an OAuth-backed external app without letting browser code become authoritative for security, persistence, or model context.

The platform uses sandboxed iframes for app UI, server-side orchestration for LLM and tool execution, app-specific server adapters for canonical state transitions, and bounded per-turn tool injection so prompt size stays manageable. The MVP proves one complete hybrid app flow with Chess, then extends the same contract to simpler and more authenticated apps.

## Purpose

TutorMeAI needs a plugin surface that allows third-party apps to live inside chat while preserving safety, teacher control, and conversational continuity. Students should be able to launch an app such as chess, interact with it, ask the assistant questions mid-flow, and continue the conversation naturally after the app interaction ends.

The architecture must support:

- real-time streaming chat
- persistent multi-turn conversations
- third-party app registration and discovery
- secure in-chat UI rendering
- bidirectional communication between chat and app
- durable app state across turns
- graceful error handling and recovery
- platform auth plus at least one authenticated app

## Design Principles

- **Server-authoritative execution**: Any result that affects persistence, model context, auth, or external systems must be produced or validated on the server.
- **Sandboxed app UI**: Third-party app code runs only inside sandboxed iframes and is treated as untrusted at runtime, even when bundled in-repo.
- **Explicit provenance**: The system distinguishes server-validated state, client-reported events, and user-supplied content.
- **Durable app sessions**: Long-lived interactions such as chess are modeled as app sessions, not one-off request/response tool calls.
- **Bounded context**: The model sees compact app snapshots and only the tools relevant to the current conversation.
- **Policy first**: Teacher allowlists and auth state help decide which apps and tools are exposed.
- **MVP discipline**: Build one full vertical end-to-end before optimizing for a broad ecosystem.

## Terminology


| Term               | Meaning                                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Host**           | The ChatBridge web app shell. Owns chat UI, realtime connection, iframe containers, and host-side message routing.                 |
| **App**            | A sandboxed integration rendered in an iframe. May provide custom UI and app-specific client interactions.                         |
| **App adapter**    | Server-side code that owns canonical state transitions, validation, and any secure external API access for an app.                 |
| **Tool**           | A server-invocable capability exposed to the model. A tool may or may not involve an app UI.                                       |
| **App session**    | A persisted interaction instance for an app within a conversation.                                                                 |
| **Plugin surface** | The platform contract for app registration, tool discovery, UI embedding, bidirectional events, completion, and context retention. |


"Plugin" and "app" refer to the same product concept. "App" emphasizes UI. "Plugin surface" emphasizes the platform contract.

## Architecture Overview

ChatBridge consists of five main parts:

1. **Host shell**
  Renders chat, mounts iframe apps, and routes validated browser events.
2. **Realtime gateway**
  Carries streaming assistant output, run status, app commands, and app events between browser and server.
3. **Run orchestrator**
  Owns prompt assembly, model calls, tool invocation, persistence, and continuation logic.
4. **App adapters**
  Implement server-side validation and state transitions for each app.
5. **Persistent store**
  Stores users, sessions, conversations, messages, app sessions, OAuth connections, and execution records.

## Execution Model and Trust Boundary

### Where code runs

- The **LLM orchestration loop** runs on the **server**.
- **Tool execution** runs on the **server**.
- **App adapters** run on the **server**.
- **Third-party app UI** runs in the **browser** inside **sandboxed iframes**.
- The **host shell** runs in the browser and forwards validated app events to the server.

### Authority model

The system uses three trust classes:


| Class                | Examples                                                          | Trust level                                         |
| -------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| **Server-validated** | Tool outputs, canonical chess state, OAuth-backed asset access    | Trusted for persistence and model context           |
| **Client-reported**  | Iframe ready signals, camera changes, move attempts, local errors | Untrusted until accepted or validated by the server |
| **User-supplied**    | Chat text, uploaded parameters, manual choices                    | Treated as user input, not system truth             |


The server is authoritative for:

- tool outputs
- canonical app state
- app session lifecycle
- auth and OAuth state
- persistence
- what gets injected back into model context

The browser is never authoritative for any state that affects correctness, security, or persistence.

### Canonical invocation flow

1. The server assembles context and calls the LLM.
2. The model emits assistant text or a tool call.
3. The server executes the tool directly or dispatches to an app adapter.
4. If UI is needed, the server emits a typed app command to the host.
5. The host forwards the command to the target iframe using `postMessage`.
6. The iframe renders UI and emits user actions or UI events.
7. The host validates the browser-side envelope and forwards the event to the server.
8. The server validates, persists, updates app session state, and decides whether to continue the run.
9. Only server-approved results or snapshots are re-injected into the next model turn.

This means iframes act as **views/controllers**, not trusted runtimes.

## App Model

ChatBridge supports three app patterns.

### 1. Server tool

A pure server-executed capability with optional UI.

Examples:

- Equation Solver
- text transformation or analysis tools

Characteristics:

- model calls a server tool
- server computes the result
- UI is optional and non-authoritative

### 2. Hybrid session app

A long-lived app with interactive UI and server-owned domain state.

Examples:

- Chess
- 3D Model Viewer

Characteristics:

- server owns canonical state
- iframe renders and collects user actions
- app adapter validates transitions
- model can inspect app state across turns

### 3. Client widget

A browser-only widget whose outputs are treated as user input or advisory client data.

Characteristics:

- not trusted by default
- not used for canonical state or secure actions
- not required for MVP

**MVP constraint**: focus on server tools and hybrid session apps. Do not rely on client widgets for meaningful system behavior.

## Plugin Surface

The plugin surface is split into two contracts.

### A. Tool contract

Used for model-visible capabilities.

Responsibilities:

- registration
- schema definition
- eligibility rules
- invocation
- server-side execution or adapter dispatch
- result normalization
- provenance tagging

### B. App session contract

Used for interactive UI apps.

Responsibilities:

- iframe mount and init
- server-issued app commands
- typed client events
- state patch delivery
- completion and cancellation
- timeout and reset behavior
- reconnect and resume

Separating these contracts avoids treating iframe payloads as trusted tool results.

## Registration and Discovery

### Registration

Each app registers:

- app id
- version
- app type
- supported tools, if any
- app session schema version
- UI route or bundle location
- eligibility flags
- auth requirements
- allowed origins

Registration is persisted on the server.

### Discovery

Per turn, the server assembles only the tools eligible for the current conversation.

Eligibility may depend on:

- active app
- teacher allowlist
- user auth readiness
- conversation mode
- rollout flags

The server must not inject the full global registry into every prompt.

## State Model

ChatBridge separates app state into two classes.

### Domain state

Canonical, persisted, versioned, server-validated state required for correctness.

Examples:

- chess FEN, move history, turn, and result
- 3D asset id, access scope, and selected resource
- solver inputs and normalized solution structure

This is the app state that may be injected into model context.

### View state

Ephemeral or cosmetic UI state used only for rendering convenience.

Examples:

- camera position
- selected square
- open panel
- scroll position
- temporary highlights

View state may be persisted for UX continuity, but it is not trusted and is not injected into the model by default.

### App snapshots

Each app adapter defines a compact canonical snapshot for model use.

Example:

```json
{
  "app": "chess",
  "appSessionId": "as_123",
  "stateVersion": 42,
  "source": "server_validated",
  "summary": {
    "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w",
    "turn": "white",
    "status": "in_progress"
  }
}
```

Summarization rules must be app-specific. Generic "summarize app state" is not enough for correctness.

## Conversation and Run Model

Long-lived app interactions require a durable execution model.

### Core entities


| Entity               | Purpose                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| **User**             | Platform identity                                                             |
| **Session**          | Auth session or device session                                                |
| **Conversation**     | Chat thread metadata                                                          |
| **Message**          | User, assistant, and tool messages                                            |
| **App definition**   | Registered app metadata and capabilities                                      |
| **App session**      | Persisted instance of an app inside a conversation                            |
| **Conversation run** | A single orchestrated execution cycle for a turn                              |
| **Run step**         | A persisted step within a run such as model call, tool execution, or app wait |
| **App event**        | Typed event emitted by host or iframe and processed by the server             |
| **OAuth connection** | Per-user provider token metadata                                              |
| **Audit log**        | Operational record for debugging and traceability                             |


### Run state machine

Each conversation run should move through explicit states such as:

- `created`
- `streaming_model`
- `invoking_tool`
- `awaiting_app_ack`
- `awaiting_user_action`
- `running`
- `succeeded`
- `failed`
- `cancelled`
- `timed_out`

Persisting run state allows recovery from browser reconnects, duplicate events, and server restarts.

## Protocol

All host-server and host-iframe communication uses typed, versioned messages.

### Required envelope fields

Every app-related message should carry:

- `protocolVersion`
- `conversationId`
- `appSessionId`
- `eventId`
- `correlationId`
- `sentAt`

### Server to host or iframe

Examples:

- `app.init`
- `app.command`
- `app.state_patch`
- `app.reset`
- `app.dispose`

### Iframe to host

Examples:

- `app.ready`
- `app.user_action`
- `app.ui_event`
- `app.error`
- `app.ack`

### Host responsibilities

The host must:

- validate message origin
- validate target app session
- validate required envelope fields
- ignore unexpected or duplicate messages when appropriate
- forward only typed messages to the backend

The host is a router and validator, not the source of truth.

## Realtime Transport

### Host to server

Use one persistent session channel for:

- assistant token streaming
- run status updates
- app state patches
- tool progress
- app event delivery
- error and timeout signaling

**Preferred MVP choice**: WebSocket.

Rationale:

- chat streaming and app sessions are both event-oriented
- one ordered bidirectional channel simplifies sequencing
- assistant output and app lifecycle share the same session boundary

### Host to iframe

Use `postMessage` only.

This is required for sandboxed app isolation and is not replaced by the server transport.

## Context Assembly and Limits

The server constructs model context from:

- conversation transcript
- relevant assistant and tool messages
- compact server-validated app snapshot
- current run or pending action status
- eligible tool schemas

### Context rules

- inject only tools relevant to the current conversation
- prefer the current app snapshot over raw historical event logs
- do not inject raw iframe payloads as trusted tool outputs
- preserve provenance in internal records
- enforce a token budget for tool schemas and app state

### Pruning strategy

When over budget:

- keep transcript recency first
- reduce inactive tool schemas
- replace historical app detail with a canonical summary
- keep the latest state version, not the full event history

## Auth

### Platform auth

The platform uses a server-verified session layer such as NextAuth.js or equivalent.

The architecture assumes:

- server-verified identity on chat APIs
- server-verified identity on tool APIs
- per-request or per-connection user identity resolution

### Per-app auth

Apps fall into three auth classes.

#### Internal

Bundled app with no end-user OAuth.

Examples:

- Chess
- Equation Solver

#### External public

App uses a shared server-side API key or public asset source, but does not act on behalf of the user.

#### External authenticated

App uses end-user OAuth2 or similar delegated auth.

Requirements:

- consent handled by the platform
- refresh tokens stored server-side
- refresh performed server-side
- no iframe access to long-lived tokens
- app adapter uses scoped credentials on the server

### Authorization

In addition to identity, ChatBridge should enforce policy on:

- which apps a user may access
- which tools are allowed in a conversation
- whether a tool requires a connected account
- whether an app is enabled in the current environment

## Security Model

### Runtime isolation

- Each app iframe should be served from a distinct allowed origin where practical.
- Iframes must use restrictive `sandbox` flags.
- CSP must allow only the known app origins required for MVP.
- Arbitrary third-party iframe URLs are not supported in v1.

### Secret handling

- LLM API keys, OAuth secrets, and third-party API keys live only in server env/config.
- Secrets are never exposed through iframe globals or host-side JavaScript state.
- If browser access to protected resources is needed, the server should mint narrow, short-lived capabilities instead of exposing long-lived credentials.

### Message validation

The host and server must validate:

- origin
- expected app session id
- message type
- correlation id
- protocol version
- replay and duplicate delivery rules

"In-repo bundle" affects packaging, not trust. Bundled apps are still treated as untrusted runtime code at the boundary.

## Reliability and Failure Handling

### Timeouts

The platform defines timeouts for:

- model calls
- tool execution
- app initialization
- app acknowledgment
- waiting for user action where applicable

Timeouts must transition the run into a persisted terminal or recoverable state.

### Duplicates and ordering

- every request and app event uses a correlation id
- duplicate delivery is ignored or merged idempotently
- event ordering is tracked per app session where required

### Reconnect behavior

On reconnect, the host should be able to:

- resubscribe to the active conversation session
- fetch the latest run state
- remount active app sessions
- replay the current canonical app snapshot into the iframe

The system should not depend on an uninterrupted browser tab for correctness.

### User-visible UX

The UI should distinguish:

- assistant is streaming
- tool is running
- app is waiting for user action
- app is disconnected
- app timed out
- app failed and can be reset

## Observability and Operations

### Correlation

A shared request or trace id should propagate across:

- HTTP requests
- WebSocket messages
- run steps
- app events
- server logs

### Logging

Log:

- run id
- tool name
- app id
- duration
- outcome
- timeout or failure reason

Do not log:

- OAuth tokens
- secret material
- raw sensitive payloads unless explicitly redacted and justified

### Metrics

MVP metrics should include:

- model call failures
- tool failures
- app initialization failures
- timeout counts
- reconnect counts
- median and tail latency for tool and app flows

## Deployment

### Host and backend

- Deploy the application runtime on **Railway**
- Use a managed **PostgreSQL** database or equivalent
- Keep runtime single-region for MVP unless product needs require otherwise

### Topology

MVP topology:

- one web application
- one realtime channel layer inside the app runtime
- one database
- in-repo bundled apps only
- fixed CSP allowlist

## PRD Alignment

This design directly supports the assignment requirements:

- **Messaging / streaming**: realtime assistant output flows through a persistent session channel
- **History**: conversations, messages, and app sessions are persisted
- **Context retention**: server-validated app snapshots are reinjected across turns
- **Multi-turn app interaction**: app sessions support long-lived experiences like chess
- **Error recovery**: persisted run state, timeout handling, and reconnect logic support graceful failure
- **User auth**: platform auth is server-verified
- **Third-party registration**: apps register capabilities and UI metadata on the server
- **Tool discovery and invocation**: the model sees only eligible tools per turn
- **UI embedding**: app UIs render inside sandboxed iframes within chat
- **Completion signaling**: runs and app sessions have explicit lifecycle states
- **Independent app state**: domain state is separated from chat transcript and view state
- **Three app categories**: internal, external public, and external authenticated are all covered by the model

Planned app mapping:

- **Chess**: required hybrid session app, built first
- **Equation Solver**: internal server tool with optional rich rendering
- **3D Model Viewer**: hybrid session app that satisfies the authenticated app requirement later in the project

## Key Technical Decisions

- **Sandboxed iframes plus `postMessage`** for app UI isolation
- **Server-orchestrated LLM loop** for prompt assembly, tool execution, and persistence
- **App adapters on the server** for canonical state transitions and secure integrations
- **Dynamic per-turn tool injection** with allowlisting and token budgets
- **Explicit run and app session state machines** for completion, failure, timeout, and resume
- **In-repo bundles only for MVP** to reduce packaging and moderation risk
- **Chess first** as the end-to-end stress test before broader multi-app support

## Why This Design Over Alternatives

This architecture chooses control and clarity at the trust boundary over maximum short-term flexibility. That trade-off fits the case study better because the product is school-facing, must handle sensitive auth flows, and needs to keep conversational continuity across long-lived app interactions.

### 1. Server-authoritative hybrid model over client-authoritative plugins

Alternative:

- let the iframe compute tool results and send them back as authoritative output

Why not:

- browser state is easier to tamper with
- disconnected tabs or crashed iframes can silently lose tool state
- OAuth-backed actions should not depend on client honesty
- the model would be reasoning over data that the platform did not verify

Why this design wins:

- canonical state and tool outputs stay auditable
- the model gets cleaner, more trustworthy context
- retries, reconnects, and persistence become much easier to reason about

### 2. Sandboxed iframes over direct same-origin component plugins

Alternative:

- load third-party app code directly into the host React tree or same origin

Why not:

- a broken or malicious app gains a much wider blast radius
- DOM and in-memory data isolation are weaker
- it becomes harder to explain or enforce safe boundaries

Why this design wins:

- iframe boundaries make isolation concrete
- `postMessage` forces an explicit contract
- CSP and sandbox flags reduce accidental privilege sharing

### 3. *App sessions over one-shot tool calls*

Alternative:

- model every app interaction as a single request/response tool invocation

Why not:

- Chess is not a one-shot action
- multi-step experiences need ongoing state, user actions, and resumability
- timeout and recovery behavior becomes awkward and under-specified

Why this design wins:

- long-lived interactions become first-class objects
- the assistant can inspect state mid-session
- completion, cancellation, and resume have a clear lifecycle

### 4. Dynamic tool eligibility over injecting the full global registry

Alternative:

- expose every registered tool to the model on every turn

Why not:

- prompt bloat increases cost and latency
- routing quality gets worse when too many irrelevant tools are visible
- teacher controls are harder to enforce cleanly

Why this design wins:

- lower token usage
- better routing precision
- easier policy enforcement per conversation

### 5. WebSocket session channel over split SSE plus ad hoc HTTP events

Alternative:

- use SSE for streaming and separate HTTP endpoints for app events and control messages

Why not:

- hybrid apps naturally behave like event streams, not just token streams
- ordering and correlation are harder when state changes and UI events use different paths
- the host ends up stitching together multiple partial channels

Why this design wins:

- one bidirectional session channel is easier to reason about
- assistant streaming, tool progress, and app lifecycle share one ordering model
- reconnect behavior is simpler to implement coherently

### 6. In-repo bundles over arbitrary third-party URLs for MVP

Alternative:

- allow any external app URL to register itself in v1

Why not:

- moderation and trust review become much harder
- CSP and origin control are less predictable
- debugging and deployment complexity rise before the core contract is proven

Why this design wins:

- the team can validate the contract before opening distribution
- deployment and review are simpler during a one-week sprint
- the architecture still keeps the runtime boundary strict, so it can expand later

### 7. Provider abstraction seam over deep provider-neutral optimization from day one

Alternative:

- build equally for multiple LLM providers from the start

Why not:

- tool calling and streaming semantics vary in subtle ways
- over-generalizing too early slows down delivery
- the project needs a reliable vertical slice more than a perfect abstraction

Why this design wins:

- the code can keep a clean integration seam without forcing every feature into the lowest common denominator
- MVP complexity stays focused on plugin lifecycle and app state, which are the real assignment risks

Overall, this design favors a strong platform core first. It is intentionally narrower than a full plugin marketplace, but it is much more likely to deliver a stable Chess flow, a clean security story, and a believable path to authenticated apps.

## MVP Scope

The MVP proves one complete hybrid-session vertical end-to-end.

### First vertical

**Chess** is the first vertical.

Success criteria:

- registered app definition
- active app session in a conversation
- iframe renders a board
- user move attempts go to the server
- server validates and persists canonical game state
- the assistant can inspect current board state in later turns
- game completion is persisted and reflected in the conversation

### Additional apps

- **Equation Solver**
Server tool first, with optional rich UI rendering
- **3D Model Viewer**
Hybrid session app with server-owned auth and canonical resource identity

### Explicit non-goals for MVP

- arbitrary third-party iframe URLs
- client-authoritative tool results
- unconstrained multi-app schema injection
- complex multi-region realtime infrastructure
- broad plugin marketplace packaging

## Locked Assumptions


| Topic                               | Decision                                         |
| ----------------------------------- | ------------------------------------------------ |
| **Deployment**                      | Railway                                          |
| **First vertical**                  | Chess                                            |
| **App packaging**                   | In-repo bundles only for MVP                     |
| **Iframe trust**                    | Untrusted at runtime                             |
| **User OAuth requirement**          | Not on Chess; satisfied later by 3D Model Viewer |
| **Preferred host-server transport** | WebSocket                                        |
| **Host-iframe transport**           | `postMessage` only                               |


## Reference Diagram

```text
┌─────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                   │
│                                                                     │
│  ┌────────────────────┐       ┌──────────────────────────────────┐  │
│  │ Host shell         │       │ Sandboxed app iframe             │  │
│  │                    │       │                                  │  │
│  │ - chat UI          │<----->│ - app UI                         │  │
│  │ - WS connection    │postMsg│ - local view state               │  │
│  │ - message routing  │       │ - user interactions              │  │
│  └─────────┬──────────┘       └──────────────────────────────────┘  │
└────────────┼─────────────────────────────────────────────────────────┘
             │
             │ WebSocket
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SERVER                                    │
│                                                                     │
│  ┌────────────────────┐   ┌────────────────────┐                    │
│  │ Realtime gateway   │   │ Run orchestrator   │                    │
│  │                    │<->│                    │<-> LLM provider    │
│  │ - session channel  │   │ - prompt assembly  │                    │
│  │ - event delivery   │   │ - tool execution   │                    │
│  └─────────┬──────────┘   │ - run state        │                    │
│            │              └─────────┬──────────┘                    │
│            │                        │                               │
│            │                        ▼                               │
│            │              ┌────────────────────┐                    │
│            └─────────────>│ App adapters       │                    │
│                           │                    │                    │
│                           │ - state validation │                    │
│                           │ - external APIs    │                    │
│                           │ - OAuth usage      │                    │
│                           └─────────┬──────────┘                    │
│                                     │                               │
│                                     ▼                               │
│                           ┌────────────────────┐                    │
│                           │ Database           │                    │
│                           │                    │                    │
│                           │ - conversations    │                    │
│                           │ - messages         │                    │
│                           │ - app sessions     │                    │
│                           │ - run steps        │                    │
│                           │ - OAuth metadata   │                    │
│                           └────────────────────┘                    │
└─────────────────────────────────────────────────────────────────────┘
```

