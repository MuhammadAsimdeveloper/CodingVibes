# Coding Vibes delivery roadmap

## Stage 8 — Ownership and publishing
- Mandatory owner-only `/admin` for every generated website.
- Optional public `/login`, using Google OAuth when requested.
- Provider-neutral deployment artifact and compatibility checks.
- GitHub, ZIP/manual, Vercel, Netlify and Cloudflare adapters.
- Publish studio and deployment history.

## Stage 9 — Durable generated applications
- File-backed generated application records under `.data/records.json`.
- Generic CRUD behavior for generated API collections.
- Restart-safe generated application state.
- Regression coverage for persistence.

## Stage 10 — Production data adapters
- PostgreSQL/managed relational adapter for generated applications.
- Per-project migrations and backups.
- Durable sessions and background jobs.
- Object storage for uploads/media.

## Stage 11 — Native artifact fleet
- Managed Android/Flutter/Rust runners.
- macOS/Xcode runner for iOS/SwiftUI.
- Device/emulator smoke verification.
- Signed APK/AAB/IPA artifact pipeline.

## Stage 12 — SaaS operations
- Super-admin operations console.
- Customer/project/deployment support tooling.
- Subscription lifecycle, invoices, quotas and audit logs.
- Abuse controls, rate limits and incident tooling.

## Launch gates
A public launch requires the applicable stage to pass CI, `/ready`, browser verification, isolated execution, persistence/backups, TLS, monitoring and billing configuration. Native binaries are only advertised as verified when the corresponding runner completes the build and smoke checks.
