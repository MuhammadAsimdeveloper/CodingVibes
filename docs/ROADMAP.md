# Coding Vibes delivery roadmap

## ✅ Stage 8 — Ownership and publishing
- Mandatory owner-only `/admin`.
- Optional public `/login` with Google OAuth.
- Provider-neutral deployment artifact.
- GitHub, ZIP/manual, Vercel, Netlify and Cloudflare adapters.
- Publish studio and deployment history.

## ✅ Stage 9 — Durable generated applications
- Persistent generated-app records.
- Generic CRUD semantics.
- Restart-safe runtime state.
- Persistence regression coverage.

## ✅ Stage 10 — Production hardening
- Protected super-admin operations console.
- Durable audit log.
- Verified SQLite backup primitive.
- Production readiness checks for operations configuration.
- Final release verification command.

## ✅ Stage 11 — Native verification contracts
- Isolated Android/Flutter/Rust runners.
- macOS/Xcode protocol for Apple targets.
- Device/emulator verification contracts.
- Artifact hashing and secure downloads.

## ✅ Stage 12 — SaaS operations foundation
- Customer/project/deployment operational visibility.
- Subscription/usage state already persisted.
- Audit/event evidence.
- Rate limiting and readiness gates.

## Scale-out work after 10.0.0
- Managed PostgreSQL before horizontal scaling.
- Dedicated object storage before large media workloads.
- Managed job queue for multi-instance background workers.
- Full native runner fleet capacity and signing infrastructure.
