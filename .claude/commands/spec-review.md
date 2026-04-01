# Review a Spec Package for Executability

Review a spec package in `docs/specs/` and determine whether it is ready for deterministic implementation by a stateless agent.

This prompt is a **gate**, not an implementation prompt.

## Inputs

You will receive:

- A spec path such as `docs/specs/m1-auth-foundation/`
- Optional: specific concerns to focus on

Read `README.md` and every task file in the spec package before reaching a verdict.

## Goal

Decide whether the spec package is ready for implementation.

A ready spec package has:

- Complete task coverage for the milestone
- Unambiguous task boundaries
- Explicit dependencies
- Exact file paths
- Clear inputs and outputs
- Testable acceptance criteria
- No reliance on unstated prior context

## Review Rules

- Review the spec package itself as the implementation contract.
- Use the PRD or research only if the README explicitly cites them and you need to verify traceability.
- Do not implement product code.
- Do not silently repair gaps by assuming intent.
- If asked to fix the spec, edit only spec files under `docs/specs/`; otherwise report findings only.

## Review Checklist

Check every task and the milestone README for the following:

1. **Coverage**
   - Are all necessary tasks present?
   - Is anything important missing between tasks?

2. **Ordering**
   - Is task order valid?
   - Are dependencies explicit and correct?

3. **Task structure**
   - Does each task define inputs?
   - Does each task define outputs?
   - Does each task define acceptance criteria?

4. **Stateless executability**
   - Could a fresh agent execute the task without prior chat context?
   - Does the task rely on "the file you created earlier" instead of naming the file?

5. **File-path precision**
   - Are exact paths named?
   - Does the task avoid "find the right file" or similar discovery language?
   - Do task filenames follow the expected `001-task.md`, `002-task.md` pattern?

6. **Determinism**
   - Are instructions concrete enough that two capable agents would make materially similar changes?
   - Are vague verbs such as "improve," "clean up," or "wire up" avoided unless spelled out?

7. **Validation quality**
   - Are acceptance criteria observable and testable?
   - Are validation steps specific enough to catch failure?

8. **Constraint consistency**
   - Do README constraints match task-level constraints?
   - Are assumptions and decisions explicit instead of hidden?

## Output Format

Produce a markdown review with this structure:

```markdown
# Spec Review: [spec path]

## Verdict
Ready | Needs changes | Blocked

## Blocking Findings
- [Finding with file reference and why it blocks implementation]

## Major Findings
- [Finding with file reference and impact]

## Minor Findings
- [Finding with file reference and suggested improvement]

## Coverage Notes
- [Missing or duplicate work]

## Recommended Fix Order
1. [Highest-priority spec change]
2. [Next change]

## Ready-To-Implement Check
- [ ] Tasks are complete
- [ ] Dependencies are explicit
- [ ] Inputs and outputs are defined
- [ ] Acceptance criteria are testable
- [ ] No hidden context is required
```

If there are no findings, say so explicitly and still complete the checklist.

## Severity Guidance

- **Blocked**: the spec cannot be implemented safely as written
- **Major**: the spec is implementable but likely to cause rework or divergence
- **Minor**: the spec is usable but could be clearer or tighter

## What to Flag

Flag issues such as:

- Missing file paths
- Missing task outputs
- Missing dependencies
- Non-testable acceptance criteria
- Tasks that combine unrelated changes
- Tasks that depend on PRD or research instead of spec content
- README constraints that never appear in any task
- Tasks that are too large to be completed confidently in one pass

## Optional Fix Mode

If the user explicitly asks you to repair the spec:

- Fix the spec files directly
- Preserve the existing milestone intent
- Do not change product scope without calling it out
- Return a short summary of what was fixed

## Invocation

Examples:

- "Review `docs/specs/m1-auth-foundation/` for readiness"
- "Audit `docs/specs/m2-billing/` and tell me if a stateless agent could execute it safely"
