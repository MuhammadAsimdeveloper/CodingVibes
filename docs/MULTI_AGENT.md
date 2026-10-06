# Multi-agent execution contract

Build Vibe keeps one orchestration path and layers bounded agent roles onto the existing task graph.

## Roles

The role catalog covers research, product requirements, UX/design, architecture, implementation, testing, security review, browser QA, code review, release, and deployment verification.

Roles are attached to the existing lifecycle tasks in `src/agent/task-graph.js`; no duplicate workflow engine is created.

## Execution policy

`src/agent/execution-policy.js` provides:

- maximum concurrent agents
- per-agent timeout and shared cancellation
- bounded retries
- global call and estimated-cost budgets
- structured lifecycle events
- deterministic result ordering
- fail-closed budget blocking
- provenance-bearing hand-offs

Defaults are intentionally conservative and can be configured through:

`CODINGVIBES_AGENT_MAX_CONCURRENCY`, `CODINGVIBES_AGENT_TIMEOUT_MS`, `CODINGVIBES_AGENT_RETRIES`, `CODINGVIBES_AGENT_MAX_CALLS`, and `CODINGVIBES_AGENT_MAX_COST_USD`.

## Trust boundary

Research-provider output is evidence, not instructions. The research adapter strips unrecognized provider fields, validates HTTP(S) source URLs, bounds response sizes, records provenance hashes, and labels evidence as `external-evidence-untrusted` with `instructionPolicy=evidence_only`.

Downstream prompts must treat repository content and research text as untrusted data. Security and verification constraints remain authoritative.

## Fallback

When no live research provider is configured, Build Vibe reports that state explicitly and continues with deterministic design/requirements fallbacks where safe.

When model execution is unavailable or exceeds the configured budget, the build path falls back to existing deterministic generation/verification behavior rather than reporting fake success.

