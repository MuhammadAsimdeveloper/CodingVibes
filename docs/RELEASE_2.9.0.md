# Release 2.9.0 — Agent Reliability + Integration Fabric

2.9.0 hardens Coding Vibes from a build pipeline into a recoverable software-engineering runtime.

## Reliability

- Active model and command execution now honor `AbortSignal` cancellation.
- Cancel requests abort the active model stream when possible instead of merely flipping database state.
- Provider failures are temporarily cooled down so repeated errors do not hammer the same upstream.
- Run goals persist the user's objective, completion criteria and constraints.
- Usage records can include estimated cost when `CODINGVIBES_MODEL_PRICING_JSON` is configured.

## Review and security gate

Every verified build receives a deterministic review before it becomes commit-ready. The review inspects changed and workspace files for credential-like files, common secret patterns, risky shell pipelines, unsafe dynamic code and unusually broad changes. Set `CODINGVIBES_AI_REVIEW=true` to add an optional premium model review on top of the deterministic gate.

## Integration fabric

Coding Vibes now exposes a server-side connector catalog for GitHub, Vercel, Supabase, Cloudflare, Stripe, Sentry, Neon and Slack. Credentials are environment-only and are never returned by the API. `GET /api/integrations` lists configured status and `POST /api/integrations/test` performs a bounded credential health check.

## Browser diagnostics

Browser verification now records warnings, server responses with 5xx status, debug screenshots and DOM snapshots when screenshot capture is enabled.

## Context engineering

Repository-index symbols and import relationships now influence file ranking alongside path relevance, so large repositories can select more semantically relevant context within the fixed model budget.

## New endpoints

- `GET /api/integrations`
- `POST /api/integrations/test`
- `GET /api/runs/:id/goal`
- `PATCH /api/runs/:id/goal`
- `GET /api/runs/:id/usage` now includes an aggregate summary

## Important configuration

`CODINGVIBES_MODEL_PRICING_JSON` is intentionally opt-in. Coding Vibes does not invent model prices; cost estimates remain `null` until the deployment supplies its own price table.
