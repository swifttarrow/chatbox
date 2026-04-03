# Task 008: AI Cost Analysis

## Purpose

Produce the required AI cost analysis covering development spend and production projections at 100/1K/10K/100K user scales.

## Inputs

- Spec: `docs/specs/m6-auth-deploy-polish/README.md`
- PRD: `docs/chat-bridge/prd.md` (cost analysis requirements)
- LLM usage data from development

## Outputs

- Create: `docs/cost-analysis.md`

## Dependencies

- Prior task: all previous milestones (need real usage data)
- Required artifacts: LLM API usage records, token counts from development

## Constraints

- Must include actual development spend (LLM API costs, tokens consumed, API call count)
- Must include production projections with clear assumptions
- Projections for: 100, 1,000, 10,000, 100,000 users
- Assumptions: average tool invocations per user per session, sessions per user per month, tokens per invocation type, infrastructure costs

## Required Changes

1. Create `docs/cost-analysis.md` with:

   **Development & Testing Costs**
   - LLM API provider and model used
   - Total API calls made during development
   - Total tokens consumed (input/output breakdown)
   - Total LLM API cost
   - Other AI-related costs (embeddings, etc.)
   - Total development AI cost

   **Production Cost Model - Assumptions**
   - Average messages per user per session: estimate (e.g., 15)
   - Average sessions per user per month: estimate (e.g., 10)
   - Average tool invocations per session: estimate (e.g., 3)
   - Average tokens per message (input): estimate based on context size
   - Average tokens per response (output): estimate
   - Average tokens per tool invocation: estimate (includes schema injection)
   - Infrastructure: Railway server, PostgreSQL, static hosting

   **Production Cost Projections Table**
   | Scale | Monthly Sessions | LLM Cost | Infrastructure | Total |
   |-------|-----------------|----------|----------------|-------|
   | 100 users | 1,000 | $X | $Y | $Z |
   | 1,000 users | 10,000 | $X | $Y | $Z |
   | 10,000 users | 100,000 | $X | $Y | $Z |
   | 100,000 users | 1,000,000 | $X | $Y | $Z |

   **Cost Optimization Strategies**
   - Context pruning reduces token usage
   - Dynamic tool injection vs. static full injection savings
   - Caching repeated tool calls (weather, etc.)
   - Model selection (cheaper models for simple routing)

## Acceptance Criteria

- [ ] Development spend documented with real numbers
- [ ] Projections include clear, defensible assumptions
- [ ] All four user scales covered
- [ ] Cost optimization strategies identified
- [ ] Format matches PRD requirements

## Validation

- [ ] Numbers are internally consistent (e.g., 10x users ~ 10x sessions ~ ~10x LLM cost)
- [ ] Assumptions are documented and reasonable

## Stop and Ask

- If LLM API usage data is not tracked, estimate based on average development patterns and document that it's an estimate
