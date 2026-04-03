# ChatBridge AI Cost Analysis

## 1. Development Costs

Estimated LLM usage during the development phase (coding, debugging, iteration):

| Metric | Value |
|--------|-------|
| Total API calls | ~500 |
| Avg input tokens per call | ~2,000 |
| Avg output tokens per call | ~500 |
| Total input tokens | ~1,000,000 |
| Total output tokens | ~250,000 |

### Pricing (Claude Sonnet)

| Component | Rate | Total |
|-----------|------|-------|
| Input tokens | $3.00 / MTok | ~$3.00 |
| Output tokens | $15.00 / MTok | ~$3.75 |
| **Estimated total** | | **~$7 - $10** |

The range accounts for variance in prompt length across tasks (some calls used longer context windows for code review, others were short completions).

---

## 2. Production Cost Projections

### Assumptions

| Parameter | Value |
|-----------|-------|
| Messages per session | 15 |
| Sessions per user per month | 10 |
| Tool invocations per session | 3 |
| Input tokens per message | ~2,000 |
| Output tokens per message | ~500 |
| Input tokens per tool call (schema injection) | ~3,000 |
| Output tokens per tool call | ~200 |

### Per-User Monthly Token Consumption

| Component | Calculation | Input Tokens | Output Tokens |
|-----------|------------|-------------|--------------|
| Chat messages | 15 msgs x 10 sessions | 300,000 | 75,000 |
| Tool calls | 3 calls x 10 sessions | 90,000 | 6,000 |
| **Total per user** | | **390,000** | **81,000** |

### Monthly Cost at Scale (Claude Sonnet)

| Users | Input Tokens | Input Cost | Output Tokens | Output Cost | LLM Total | Infra Cost | **Grand Total** |
|------:|-------------:|-----------:|--------------:|------------:|----------:|-----------:|----------------:|
| 100 | 39M | $0.12 | 8.1M | $0.12 | **$0.24** | ~$12 | **~$12** |
| 1,000 | 390M | $1.17 | 81M | $1.22 | **$2.39** | ~$20 | **~$22** |
| 10,000 | 3.9B | $11.70 | 810M | $12.15 | **$23.85** | ~$75 | **~$99** |
| 100,000 | 39B | $117.00 | 8.1B | $121.50 | **$238.50** | ~$300 | **~$539** |

### Infrastructure Estimates

| Component | Base Cost | Notes |
|-----------|-----------|-------|
| Railway (compute) | ~$5/mo | Scales with container size and replicas |
| PostgreSQL (managed) | ~$7/mo | Scales with storage and connections |
| Additional at scale | Variable | Load balancers, Redis, monitoring, CDN |

At 100K users, infrastructure costs assume horizontal scaling with multiple service replicas, dedicated database instances, and caching layers.

---

## 3. Cost Optimization Strategies

### Dynamic Tool Injection

Instead of injecting all tool schemas into every request, only include tools relevant to the current conversation context. This reduces the ~3,000 input tokens per tool call overhead significantly when apps have large or numerous tools.

### Context Pruning

- Summarize or truncate older messages in long conversations rather than sending the full history.
- Set a sliding window (e.g., last 20 messages) and replace earlier content with a summary.
- This caps input token growth per message and prevents cost from scaling linearly with conversation length.

### Response Caching

- Cache common assistant responses for identical or near-identical prompts (e.g., app help text, greeting flows).
- Use semantic caching where a similarity threshold determines cache hits.
- Anthropic prompt caching can reduce input costs for repeated prefixes.

### Model Selection

- Use Claude Haiku ($0.25/$1.25 per MTok) for low-complexity tasks: classification, simple Q&A, routing.
- Reserve Claude Sonnet ($3/$15 per MTok) for tasks requiring reasoning, tool use, or nuanced responses.
- A routing layer can classify incoming messages and select the appropriate model, reducing average cost per message by 50-70% for mixed workloads.

### Summary of Potential Savings

| Strategy | Estimated Savings |
|----------|-------------------|
| Dynamic tool injection | 10-30% on input tokens |
| Context pruning | 20-50% on input tokens for long sessions |
| Response caching | 10-25% overall (varies by use case) |
| Model routing (Haiku for simple tasks) | 50-70% on routed requests |

With all strategies combined, production costs at 100K users could realistically drop from ~$539/mo to ~$150-250/mo.
