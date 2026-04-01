# Produce Non-Authoritative Research Notes

Use this prompt to explore a product or technical question before writing specs.

Research is **not** executable. Its job is to reduce uncertainty, compare options, and capture useful findings in `docs/research/`.

## Inputs

You will receive:

- A research question or topic
- `docs/prd.md`
- Optional repo areas to inspect
- Optional constraints such as stack, budget, timeline, hosting, or external APIs

If `docs/prd.md` is missing or too vague to frame the question, STOP and ask for the missing context.

## Goal

Create a structured research note at:

```text
docs/research/YYYY-MM-DD-topic-slug.md
```

The note should help the later spec phase make informed decisions without turning research itself into instructions.

## Research Rules

- Do not implement code.
- Do not write executable tasks.
- Do not produce milestone specs under `docs/specs/`.
- Treat the PRD as the product source of truth.
- Treat research findings as provisional unless explicitly locked elsewhere.
- If the repo already contains relevant code or patterns, cite it.
- If external docs or APIs are relevant, cite them or summarize them clearly.

## Process

### Step 1: Frame the question

Start by identifying:

- What decision or uncertainty is being researched
- Which PRD requirements are relevant
- What constraints matter most
- What would make the research actionable for the spec phase

### Step 2: Gather evidence

Use available tools to inspect:

- Relevant repository patterns
- Existing architecture or docs
- External libraries, APIs, or reference materials
- Tradeoffs, risks, and operational constraints

### Step 3: Synthesize

Reduce the findings into clear options, implications, and open questions.

Prefer 2-4 viable options over a long list of weak ones.

### Step 4: Mark the output correctly

End with a **tentative recommendation** if one is justified, but label it as research output, not implementation authority.

## Output Structure

Write the research note in markdown using this structure:

```markdown
# Research: [Topic]

## Question
[What is being researched]

## Relevant PRD Context
- [Relevant requirement or constraint]

## Existing Repo Context
- [File or pattern reference, if any]

## Findings
- [Concrete finding]

## Options Considered

### Option A: [Name]
- Strengths:
- Weaknesses:
- Risks:

### Option B: [Name]
- Strengths:
- Weaknesses:
- Risks:

## Recommendation
[Tentative recommendation with rationale]

## Open Questions
- [Question that still needs an answer]

## Spec-Phase Implications
- [What the later spec should lock in]
- [What must not remain ambiguous]

## References
- Repo: `path/to/file`
- External: [Doc, API, package, article]
```

## Writing Guidance

- Be concrete, not generic.
- Separate facts from inferences.
- Call out uncertainty explicitly.
- If two options are viable, explain the tradeoff instead of pretending one is obviously correct.
- Keep the note useful for a spec author, not for an implementer.

## Do Not Do This

- Do not write task files
- Do not prescribe exact implementation steps
- Do not treat research as source of truth during implementation
- Do not hide unresolved issues

## Output

- Write one research note under `docs/research/`
- Return the created path
- Summarize the main recommendation and remaining unknowns

## Invocation

Examples:

- "Research auth approaches for the first milestone in `docs/prd.md`"
- "Investigate rate-limiting options for the API described in `docs/prd.md`"
- "Compare queueing approaches for the background jobs implied by `docs/prd.md`"
