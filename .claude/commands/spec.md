# Compile PRD + Research into Executable Spec

Turn `docs/prd.md` and selected research notes into a **single executable spec package** under `docs/specs/`.

The output of this prompt becomes the **only execution source of truth** for implementation. During implementation, agents must be able to work from the spec package alone without rereading the PRD or research.

## Inputs

You will receive:

- A milestone or feature scope to spec
- `docs/prd.md`
- Optional research docs from `docs/research/`
- Optional repo constraints, stack conventions, or fixed decisions

If the PRD is missing, placeholder-only, or too vague to produce deterministic tasks, STOP and ask for the missing product detail instead of inventing it.

## Goal

Create one milestone spec directory:

```text
docs/specs/mX-feature-name/
  README.md
  001-task.md
  002-task.md
  ...
```

Where:

- `mX-feature-name` is a short milestone slug such as `m1-auth-foundation`
- `README.md` defines the milestone outcome, constraints, and task order
- Each task file is a fully-specified execution unit for a stateless agent

## Authority Rules

- The PRD is input only. Compile its relevant requirements into the spec package.
- Research is exploratory only. Do not copy uncertainty into tasks without resolving it.
- If research conflicts with the PRD, surface the conflict explicitly and resolve it before writing executable tasks.
- If a decision is still open but does not block the milestone, record it as an explicit assumption in `README.md`.
- If a decision blocks deterministic task-writing, STOP and ask for clarification.

## Process

### Step 1: Read and bound the scope

1. Read `docs/prd.md` fully.
2. Read only the research docs relevant to this milestone.
3. Choose a **single coherent milestone outcome**.
4. If the requested scope is too large for one milestone, propose a split and wait for confirmation.

### Step 2: Extract what must be compiled

For this milestone, identify:

- Required user-visible outcome
- Constraints and non-goals
- External integrations
- Data or state changes
- Exact files or directories likely to be created or modified
- Risks or unknowns that must be resolved before implementation

### Step 3: Write the milestone README

Create `docs/specs/mX-feature-name/README.md` using this structure:

```markdown
# Milestone: [Name]

## Outcome
[One paragraph describing the end state]

## Scope
- [In-scope item]

## Out of Scope
- [Explicit non-goal]

## Source Inputs
- PRD: `docs/prd.md`
- Research: `docs/research/...` (only if used)

## Constraints
- [Constraint that implementers must obey]

## Decisions
- [Decision already made and now locked for this milestone]

## Assumptions
- [Only if needed; avoid silent assumptions]

## Task Order
1. `001-task.md` - [Why it comes first]
2. `002-task.md` - [Dependency or purpose]

## Milestone Success Criteria
- [Observable outcome]

## Milestone Validation
- [Commands, checks, or observable confirmations]

## Risks / Follow-ups
- [Only if relevant]
```

The README must be concise but complete enough that an implementer understands the milestone without reopening the PRD.

### Step 4: Write executable task files

Create numbered task files such as `001-task.md`, `002-task.md`, and so on.

Each task MUST:

- Be executable by a stateless agent with no prior context
- Use the filename format `001-task.md`, `002-task.md`, and so on
- Reference exact file paths; never say "find the relevant file"
- State required inputs and expected outputs explicitly
- Include testable acceptance criteria
- Be narrow enough that completion is unambiguous
- Depend only on prior tasks through explicit artifacts or file paths

Use this structure for every task:

```markdown
# Task 001: [Short Title]

## Purpose
[What this task accomplishes and why it exists]

## Inputs
- Spec: `docs/specs/mX-feature-name/README.md`
- Files: `path/to/file.ext`
- External interfaces or state: [if applicable]

## Outputs
- Create: `path/to/new-file.ext`
- Modify: `path/to/existing-file.ext`
- Side effects: [migration, route, config, test data, none]

## Dependencies
- Prior task: none | `001-task.md` | `002-task.md`
- Required artifacts: [specific file, export, route, schema, none]

## Constraints
- [Exact rule that must be followed]

## Required Changes
1. [Concrete change]
2. [Concrete change]
3. [Concrete change]

## Acceptance Criteria
- [ ] [Testable behavior or file outcome]
- [ ] [Testable behavior or file outcome]

## Validation
- [ ] [Exact command to run, if known]
- [ ] [Exact observable result, if no repo command is known]

## Stop and Ask
- [Condition that should block execution rather than invite improvisation]
```

## Task Writing Rules

- Do not write tasks like "wire everything together" or "implement feature."
- Do not rely on implicit repository discovery.
- Do not reference the PRD or research from inside task instructions except as already-compiled facts in the spec package.
- Do not invent test commands if the repo does not reveal them; use observable validation language and mark the missing command clearly.
- Prefer more small, deterministic tasks over fewer broad tasks.
- If a task touches multiple concerns, split it.
- If a later task depends on an earlier file, export, migration, route, or schema, name it explicitly.
- The first task should say `Prior task: none` instead of implying hidden setup work.

## Final Readiness Pass

Before finishing, review the package and verify:

- All tasks required for the milestone are present
- Each task is unambiguous
- Dependencies are explicit
- Inputs, outputs, and acceptance criteria exist for every task
- No task requires hidden context from prior chat history
- Implementation can proceed from `docs/specs/` alone

If the package fails any of these checks, fix it before returning.

## Output

- Write the spec package under `docs/specs/`
- Return the created path
- Briefly note any explicit assumptions or blocked questions

## Invocation

Examples:

- "Create a spec package for the first milestone in `docs/prd.md`"
- "Compile the authentication slice from `docs/prd.md` and `docs/research/2026-03-30-auth-options.md` into `docs/specs/`"
