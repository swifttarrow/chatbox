---
description: Implement a spec from docs/specs by executing tasks sequentially
---

# Implement

Implement a spec from `docs/specs/` by executing tasks in order.

---

## Usage

```
implement m1-presence-system
implement m2-realtime-sync
```

If no spec is provided:
→ ask for one and list available specs in `docs/specs/`

---

## Getting Started

1. Resolve the spec: `docs/specs/{spec-name}/`
2. Read `README.md` (milestone spec)
3. Enumerate task files (`001-task.md`, `002-task.md`, …)
4. Read each task fully before starting

---

## Execution Rules

* Execute tasks **sequentially**
* Follow the task exactly—DO NOT infer beyond it
* DO NOT reference PRD or research during execution
* Each task must be completed before moving to the next

---

## Task Execution Loop

For each task:

1. Implement the task
2. Validate against acceptance criteria
3. Confirm outputs are correct
4. Proceed to next task

---

## Validation

After each task:

* Verify all acceptance criteria are satisfied
* Ensure expected outputs were produced
* Check for unintended side effects

If validation fails:
→ STOP and fix before continuing

---

## On Mismatch

If reality does not match the spec or task:

STOP and report:

```
Issue in Task [nnn]:

Expected: [what the task specifies]
Found: [actual situation]
Why this matters: [impact]

How should I proceed?
```

DO NOT proceed without clarification.

---

## Resuming

If partial progress exists:

* Identify completed tasks based on outputs (not assumptions)
* Resume from the first incomplete task

---

## Constraints

* Tasks are the ONLY execution unit
* Specs define behavior but are NOT directly executable
* DO NOT introduce changes not specified in the task
* DO NOT optimize or extend beyond the task
