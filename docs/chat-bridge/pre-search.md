# ChatBridge Pre-Search

## Case Study Analysis

TutorMeAI’s case study frames a familiar tension in education technology: students and teachers want rich, in-chat experiences—games, solvers, viewers—without sacrificing the trust that schools require. The core problems are not only “make chat talk to an app,” but **who is allowed to assert truth** when money, safety, and learning outcomes are on the line. Third-party code wants freedom to render UI and define tools; the platform must still protect minors, limit data exposure, and keep the assistant’s reasoning aligned with reality rather than with whatever a browser tab claims happened.

We identified **trust and safety** as the first major problem class: a malicious or careless app could try to exfiltrate context, spoof outcomes, or bypass teacher policy. **Communication and state** form the second major class: experiences like chess are not one-shot API calls; they are long-lived, interruptible, and must survive page refreshes and reconnects while the model stays meaningfully aware of canonical game state.

Several **trade-offs** shaped the direction. A client-authoritative plugin model would ship faster in a demo but would make tampering, lost tabs, and OAuth-backed actions nearly impossible to defend. Loading third-party code directly into the **chatbox** host (same-origin component tree) would widen blast radius and blur security story. Exposing every registered tool on every model turn would simplify routing logic but would bloat prompts, increase cost, and weaken teacher allowlisting. We therefore accepted **more server and orchestration complexity** in exchange for **clearer boundaries, auditability, and school-appropriate control**.

**Ethical and product decisions** sit in the same frame. Treating bundled and third-party-looking code as **untrusted at runtime**—not “safe because we built it”—keeps the mental model honest for future real third parties. Separating **domain state** (what the platform will persist and show the model) from **view state** (camera angle, highlights) avoids sneaking unverified UI preferences into authoritative context. For authenticated apps, **long-lived tokens stay on the server**; the iframe never becomes a vault for secrets students could inspect or malware could scrape. Teacher-facing **policy and allowlists** are treated as first-class inputs to **which tools exist in the model’s world** each turn, not as an afterthought.

**What we landed on** is a **server-authoritative hybrid** with a **split deployable**: a **dedicated ChatBridge server** holds the LLM loop, tool execution, canonical app state, realtime gateway, and persistence; the **existing chatbox client** stays the **host**—it keeps the current chat UI, adds bridge integration (WebSocket to ChatBridge, iframe mounting, host-side validation), and does **not** get replaced by a new front-end. The iframe remains a sandboxed view and input surface reached only through validated, typed **postMessage** envelopes to the host. **App sessions** model long-lived flows; **dynamic per-turn tool injection** keeps context bounded; a single **WebSocket** session between **chatbox host and ChatBridge server** carries streaming chat and app lifecycle events so ordering and recovery stay coherent. MVP scope deliberately **defers arbitrary external iframe URLs** in favor of **in-repo bundles**—reducing moderation and CSP risk while proving the contract on **Chess** first, then extending to simpler tools and a later **OAuth-backed** viewer. That combination targets the case study’s hardest requirements—safety, continuity, and believable third-party shape—without pretending the marketplace problem is solved on day one. **Observability**—correlation across HTTP, WebSocket, runs, and events—supports responsible operations in schools: when something fails, staff and engineers can trace it without logging secrets or sensitive payloads by default, which matters for protecting student data in production.

---

## Phase 1: Define Your Constraints

### 1. Scale & Load Profile

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| Users at launch? In 6 months? | The case study describes TutorMeAI at large scale (districts, hundreds of thousands of daily users). The **MVP architecture** is scoped to prove the plugin contract (Chess vertical, in-repo apps): **ChatBridge server** single-region on **Railway** (with managed Postgres); **chatbox client** continues as the browser host. Explicit numeric SLOs for launch vs. six months are **not locked** in the architecture doc; the server deployment assumes **single-region** unless product requires otherwise. |
| Traffic pattern: steady, spiky, or unpredictable? | Realtime design is **event-oriented** (streaming, app commands, patches). Spiky classroom or assignment-driven usage is plausible; **persisted run state and idempotent events** are called out to tolerate reconnects and duplicates rather than assuming a perfectly steady stream. |
| How many concurrent app sessions per user? | **App sessions** are first-class per conversation; a user can have active app interactions modeled as sessions. The doc does **not** cap concurrent sessions per user numerically—policy (teacher allowlist, mode) gates **eligibility**, not a hard multi-session count. |
| Cold start tolerance for app loading? | **Timeouts** are defined for app initialization, acknowledgment, and user-action waits; failed or slow loads should transition runs to **persisted terminal or recoverable states** with user-visible status (e.g., disconnected, timed out). Exact SLA seconds are implementation detail; the **pattern** is explicit. |

### 2. Budget & Cost Ceiling

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| Monthly spend limit? | **Not specified** in the architecture document (homework / sprint context). |
| Pay-per-use acceptable or need fixed costs? | **Not specified**; managed PostgreSQL and Railway for the **ChatBridge server** imply operational cost without a fixed ceiling in the doc (separate from chatbox client hosting). |
| LLM cost per tool invocation acceptable range? | **Bounded context** is a design goal: **dynamic per-turn tool injection**, **token budget** for tool schemas and app state, and **pruning** (recency, inactive tools, canonical summaries) directly **trade money/latency for smaller prompts**. |
| Where will you trade money for time? | **In-repo bundles and MVP discipline** trade ecosystem openness for **faster validation** of the contract. **Single WebSocket channel** trades some flexibility for **simpler ordering and reconnect** engineering time. |

### 3. Time to Ship

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| MVP timeline? | Assignment framing: **one-week sprint** with MVP + pre-search at 24 hours; architecture aligns with **MVP proving one full hybrid vertical (Chess) end-to-end** first. |
| Speed-to-market vs. long-term maintainability priority? | **MVP discipline** and **Chess first** favor a **working vertical slice**; **provider abstraction seam** is preferred over **deep multi-provider parity from day one**—speed first on plugin lifecycle, with a hook for later generalization. |
| Iteration cadence after launch? | **Not specified**; architecture supports **additional apps** (Equation Solver, 3D Model Viewer) after the first vertical. |

### 4. Security & Sandboxing

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| How will you isolate third-party app code? | **Sandboxed iframes**, **restrictive `sandbox` flags**, **distinct allowed origins** where practical, **CSP** on the **chatbox host** allowing only **known app origins** for MVP, **host–iframe via `postMessage` only**. |
| What happens if a malicious app is registered? | **MVP: in-repo bundles only**—no arbitrary third-party URLs; registration is **server-persisted** with metadata (origins, auth requirements). Runtime treats iframe code as **untrusted** regardless of packaging; **message validation** (origin, session id, type, correlation, protocol version, duplicate rules). |
| Content Security Policy requirements? | **Fixed CSP allowlist** on the **chatbox host** for MVP; must allow **only required app origins** (and ChatBridge WS/API origins as needed for integration). |
| Data privacy between apps and chat context? | **Three trust classes**: server-validated vs client-reported vs user-supplied. **Raw iframe payloads are not trusted tool outputs**; only **server-approved snapshots** feed the model. **Secrets** (LLM keys, OAuth, third-party API keys) live only on the **ChatBridge server** / env—**never** in iframe or **chatbox** host JS; **short-lived narrow capabilities** if browser access to protected resources is needed. |

### 5. Team & Skill Constraints

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| Solo or team? | **Not specified** in the architecture document. |
| Languages/frameworks you know well? | **Chatbox client** (existing stack—e.g. Next.js-class if that is chatbox today) plus **ChatBridge server** however implemented; **PostgreSQL** on the server; **Railway** for the dedicated server deploy. Exact language list for the server is not mandated in the arch doc. |
| Experience with iframe/postMessage communication? | Architecture **requires** **chatbox host** ↔ iframe **`postMessage`** with **typed, versioned messages** and host validation, plus **chatbox host** ↔ **ChatBridge server** WebSocket—core skill assumptions for implementation. |
| Familiarity with OAuth2 flows? | **Per-app external authenticated** apps require **platform-handled consent**, **server-side refresh**, **no iframe access to long-lived tokens**—implementers need solid **OAuth2** understanding for that path (e.g., 3D Model Viewer later). |

---

## Phase 2: Architecture Discovery

### 6. Plugin Architecture

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| Iframe-based vs web component vs server-side rendering? | **Sandboxed iframes** for app UI; server orchestrates LLM and tools. **Rejected**: same-origin React/plugin embedding for weaker isolation (see “Why This Design Over Alternatives”). |
| How will apps register their tool schemas? | **Server-persisted registration**: app id, version, type, supported tools, session schema version, UI route/bundle, eligibility flags, auth requirements, **allowed origins**. |
| Message passing protocol (postMessage, custom events, WebSocket)? | **WebSocket**: **chatbox client (host)** ↔ **ChatBridge server** (streaming, run status, app commands, patches, events). **`postMessage` only**: host ↔ iframe. Realtime gateway runs **on the ChatBridge server**; the host opens the WS client. |
| How does the chatbot discover available tools at runtime? | **Per turn**, the **ChatBridge server** (run orchestrator) assembles **only eligible** tools (active app, teacher allowlist, auth readiness, conversation mode, flags). **Full global registry is not injected** into every prompt. |

### 7. LLM & Function Calling

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| Which LLM provider for function calling? | **Provider abstraction seam** without mandating a single vendor in the architecture; **tool calling/streaming semantics** acknowledged as provider-variable. |
| How will dynamic tool schemas be injected into the system prompt? | **ChatBridge server** **run orchestrator** assembles context: transcript, tool messages, **compact server-validated app snapshot**, run status, **eligible tool schemas**—with **token budget** and pruning rules. |
| Context window management with multiple app schemas? | **Pruning**: prioritize transcript recency, reduce inactive tool schemas, replace historical app detail with **canonical summary**, keep **latest state version** not full event history. |
| Streaming responses while waiting for tool results? | **WebSocket** between **chatbox host** and **ChatBridge server** carries **assistant token streaming** alongside **run status** and app lifecycle; run state machine includes states like **`invoking_tool`**, **`awaiting_app_ack`**, **`awaiting_user_action`** so the UX can reflect waiting vs streaming. |

### 8. Real-Time Communication

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| WebSocket vs SSE vs polling for chat? | **Preferred MVP: WebSocket** from **chatbox host** to **ChatBridge server** for one bidirectional, ordered session channel (vs split SSE + HTTP). |
| Separate channel for app-to-platform communication? | **No separate MVP channel** for app events vs chat: **one persistent WebSocket** between **chatbox host** and **ChatBridge server** for assistant streaming, run status, app patches, tool progress, and app events. **Iframe still uses postMessage to the chatbox host**, which forwards to the server over that WS. |
| How do you handle bidirectional state updates? | **ChatBridge server** → chatbox host: commands/patches over WebSocket; host → server: validated app events; server updates persistence and may emit further commands or continue the run. |
| Reconnection and message ordering guarantees? | **Correlation ids**; **duplicate delivery ignored or merged idempotently**; **ordering tracked per app session** where required; on reconnect: **resubscribe**, **fetch latest run state**, **remount app sessions**, **replay canonical snapshot** to iframe. |

### 9. State Management

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| Where does chat state live? App state? Session state? | **ChatBridge server** **persistent store** (e.g. Postgres): users, sessions, conversations, messages, app sessions, OAuth, execution records. **Domain state** (canonical, versioned) vs **view state** (ephemeral UI). The **chatbox host** holds UI state only; truth for bridge data is server-side. |
| How do you merge app context back into conversation history? | **App snapshots** (compact, server-validated, provenance-tagged) injected into model context; **not** raw iframe payloads as trusted outputs. |
| State persistence across page refreshes? | **Yes** by design: persisted runs/app sessions; reconnect path restores **truth on server**, not browser-only memory. |
| What happens to the app state if the user closes the chat? | **App sessions and canonical state remain persisted**; correctness does **not** depend on an uninterrupted tab. UI may show disconnected/timeout states until resume. |

### 10. Authentication Architecture

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| Platform auth vs per-app auth? | **Platform**: identity may be established in **chatbox**; the **ChatBridge server** must still **verify** the caller on HTTP and WebSocket (session, token, or equivalent—integration detail between deployables). **Per-app**: internal / external public / **external authenticated** (OAuth). |
| Token storage and refresh strategy? | **OAuth refresh tokens stored server-side**; **refresh on server**; **no long-lived tokens in iframe**. |
| OAuth redirect handling within iframe context? | Architecture **avoids** giving the iframe OAuth secrets; **consent on platform**; adapter uses **scoped server credentials**. (Concrete redirect UX is product/implementation detail under these constraints.) |
| How do you surface auth requirements to the user naturally? | **Eligibility** and **auth readiness** gate **tool exposure**; tools/apps can declare **auth requirements** in registration—exact copy/UX not specified in architecture. |

### 11. Database & Persistence

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| Schema design for conversations, app registrations, sessions? | Entities include **User**, **Session**, **Conversation**, **Message**, **App definition**, **App session**, **Conversation run**, **Run step**, **App event**, **OAuth connection**, **Audit log**. |
| How do you store tool invocation history? | As part of **run steps** / **messages** (tool messages) within the **run** model—persisted for recovery and traceability. |
| Read/write patterns and indexing strategy? | **Not detailed** in architecture (implementation concern); strong emphasis on **run id**, **correlation**, and **querying latest run/app state** on reconnect. |
| Backup and disaster recovery? | **Not specified** in the architecture document. |

---

## Phase 3: Post-Stack Refinement

### 12. Security & Sandboxing Deep Dive

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| Iframe sandbox attributes (allow-scripts, allow-same-origin)? | **Restrictive sandbox flags** are required; exact attribute matrix is implementation detail—goal is **least privilege** consistent with rendering and postMessage. |
| CSP headers for embedded content? | **CSP** on the **chatbox host** allows **only known MVP app origins** (plus any connect targets required for **ChatBridge**); **fixed allowlist**. |
| Preventing apps from accessing parent DOM? | **Iframe boundary** + **origin isolation**; **chatbox host** validates **postMessage** origin; no same-origin plugin embedding for MVP. |
| Rate limiting per app and per user? | **Not specified** in the architecture document; **message validation** and **policy gates** are specified—rate limits are a reasonable production hardening layer. |

### 13. Error Handling & Resilience

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| What happens when an app's iframe fails to load? | **Timeouts** for app init; run transitions to **persisted terminal or recoverable** state; UX distinguishes **failed / disconnected / timed out** and **reset** where applicable. |
| Timeout strategy for async tool calls? | **Timeouts** for model calls, tool execution, app init, ack, and user-action waits—all must move the run to a **defined state**. |
| How does the chatbot recover from a failed app interaction? | **Persisted run state machine** (`failed`, `timed_out`, `cancelled`, etc.); server does not rely on client for truth; user-visible states separate **streaming / tool running / waiting / disconnected**. |
| Circuit breaker patterns for unreliable apps? | **Not explicitly named**; **idempotent handling of duplicates** and **explicit failure states** provide baseline resilience—circuit breaking could extend this. |

### 14. Testing Strategy

| Question | Pre-search answer (from architecture) |
| -------- | -------------------------------------- |
| How do you test the plugin interface in isolation? | **Typed protocol** (envelope fields, message types) supports **contract tests** between **chatbox host**, **ChatBridge server**, and iframe without a full LLM. |
| Mock apps for integration testing? | **In-repo bundles** and a **stable plugin surface** make **mock/synthetic iframes** feasible that speak the same **postMessage** protocol and registration shape. |

---

## Source

This pre-search is derived from the locked decisions and rationale in [`architecture.md`](architecture.md) (ChatBridge Architecture), aligned with the TutorMeAI case study and assignment framing in [`prd.md`](prd.md).

**Topology (summary):** dedicated **ChatBridge server** (orchestration, persistence, realtime gateway, secrets); **existing chatbox client** as **host** (chat UI + bridge client). See architecture doc **Deployment** and **Locked Assumptions** for the canonical split.
