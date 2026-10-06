# Product analytics

Build Vibe stores bounded product events in SQLite by default. Analytics are operational product telemetry, not a license to store credentials or arbitrary user content.

Event names are constrained to a simple identifier format. Properties are bounded and keys containing token, secret, password, API-key, authorization, cookie, session or credential terms are discarded.

The authenticated event endpoint is `POST /api/analytics/events`. Project IDs are ownership-checked before persistence.

Super-admins can inspect a bounded recent summary from `GET /api/ops/analytics?days=30`. Access is audit logged.

For larger deployments the existing scale-out database abstraction can be used; analytics data should remain subject to the same backup, retention and privacy controls as the primary application database.

## Recommended events

Use stable events such as:

- `builder.build.started`
- `builder.build.completed`
- `builder.verification.failed`
- `editor.change.saved`
- `content.revision.published`
- `deployment.verification.completed`

Do not put prompts, source code, access tokens, payment secrets or full user messages into analytics properties.
