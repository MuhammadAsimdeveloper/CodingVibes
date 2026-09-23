# Release 2.9.1 — Deep Engineering UX + Existing-Code Workflows

Coding Vibes 2.9.1 extends the agent foundation into a more observable engineering workspace.

## Added

- Structured diagnostics derived from verification, browser failures, review gates, lifecycle state, usage and Git state.
- Run quality panel showing goal state, completion checks, model usage and estimated cost when pricing is configured.
- Integration health panel for GitHub, Vercel, Supabase, Cloudflare, Stripe, Sentry, Neon and Slack.
- One-click connector health tests with credential values never returned to the browser.
- GitHub existing-code import flow with shallow-history preservation, branch/ref selection and credential-safe HTTPS authentication.
- Sidebar entry point for importing an existing GitHub repository into an editable Coding Vibes project.
- Additional regression tests for diagnostics and GitHub repository validation.

## Reliability

- Cancellation propagates into model streaming and local command execution rather than only flipping a database status.
- Browser verification exposes console errors, failed requests, server errors, screenshots and DOM snapshots when capture is enabled.
- Review/security gating can block a run before commit.
- Repository indexing is used to rank context selection.

## Validation

- `npm run check` passes.
- 55 automated tests pass.
- HTTP health/auth/integration smoke checks pass locally.
- Live GitHub clone could not be network-validated in the sandbox because DNS access to `github.com` is unavailable; the importer returns a sanitized failure instead of exposing credentials or partial state.
