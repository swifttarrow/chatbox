# Validate Implementation Against Specs

Validate the current implementation against a spec package in `docs/specs/`.

The spec package is the source of truth for validation. Do not validate against the PRD or research except to note that the spec itself may need an update.

## Inputs

You will receive:

- A spec path such as `docs/specs/m1-auth-foundation/`
- Optional: a narrower scope such as a single task to focus on first

Read `README.md` and every task file in scope before reaching a verdict.

## Goal

Determine whether the implementation matches:

- The milestone outcome in `README.md`
- The required task outputs
- The task acceptance criteria
- The task and milestone validation steps

## Validation Rules

- Validate against specs and tasks, not against memory of prior chats.
- Do not assume a task passed because a checkbox exists or a commit was made.
- Use the validation commands written in the task files when available.
- If a validation command is missing or cannot be run, report that gap explicitly instead of inventing a substitute command.
- If a task lacks usable acceptance criteria or clear outputs, report that as a spec defect.
- If validation fails, identify the failing task or milestone explicitly.
- If the implementation diverges from the spec but looks reasonable, still report the divergence.

## Process

### Step 1: Read the contract

1. Read `README.md`.
2. Read every task file in order.
3. Extract:
   - milestone goals
   - task inputs and outputs
   - acceptance criteria
   - validation commands or observable checks
   - explicit constraints and assumptions

### Step 2: Gather implementation evidence

Inspect the current codebase and any relevant changed files.

Run the validation commands defined by the tasks when possible.

Also check for:

- missing expected files
- incorrect file locations
- partial implementations
- integration gaps between tasks
- unintended side effects or regressions

### Step 3: Evaluate task-by-task

For each task, decide:

- **Pass**: all required outputs and acceptance criteria are satisfied
- **Partial**: some work exists, but acceptance criteria are not fully met
- **Fail**: required work is missing or incorrect
- **Blocked**: the spec does not provide enough information to validate fairly

### Step 4: Evaluate milestone-level behavior

After task review, validate the milestone as a whole:

- Does the combined implementation achieve the README outcome?
- Do task outputs work together?
- Are milestone-level success criteria met?

## Output Format

Produce a markdown report using this structure:

```markdown
# Validation Report: [spec path]

## Verdict
Pass | Pass with issues | Fail | Blocked

## Milestone Summary
- Outcome status:
- Scope validated:
- Commands run:

## Task Results

### `001-task.md`
- Status: Pass | Partial | Fail | Blocked
- Evidence:
- Missing or incorrect:

### `002-task.md`
- Status: ...
- Evidence:
- Missing or incorrect:

## Milestone-Level Findings
- [Integration finding, regression, or confirmation]

## Spec Deviations
- [Where implementation diverged from the spec]

## Spec Defects
- [Missing acceptance criteria, vague outputs, missing constraints]

## Recommended Fix Order
1. [Highest-priority implementation or spec fix]
2. [Next fix]
```

If everything passes, say so explicitly and still summarize what was validated.

## What to Check Carefully

- Every required file or output named by the tasks
- Acceptance criteria that are only partially satisfied
- Constraints that were ignored during implementation
- Regressions introduced while satisfying later tasks
- Cases where code exists but does not match the specified location or behavior

## Failure Handling

If validation fails:

- Do not wave it away as "close enough"
- Identify the exact task or milestone that failed
- Distinguish implementation bugs from spec defects
- Recommend whether to fix code or update the spec

## Invocation

Examples:

- "Validate `docs/specs/m1-auth-foundation/`"
- "Audit `docs/specs/m2-billing/` and report task-by-task pass/fail"
