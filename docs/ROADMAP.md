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

## ✅ Stage 13 — scale-out infrastructure primitives

- PostgreSQL pool, transactions, health checks and idempotent reference migration.
- S3-compatible object storage with checksum and size enforcement.
- Redis Streams durable queue with consumer groups, retries and stale-message reclaim.
- PostgreSQL outbox repository plus Redis relay.
- Graceful configurable worker process.
- Production compose reference stack and `npm run scaleout:doctor` gate.

The existing Store remains SQLite until a separate, reviewed schema migration is performed.

## Next scale-out work after 12.0.0
- Managed PostgreSQL before horizontal scaling.
- Dedicated object storage before large media workloads.
- Managed job queue for multi-instance background workers.
- Full native runner fleet capacity and signing infrastructure.

## Visual quality and immersive generation workstream

Track the scoped work in [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) and begin from [BUILD_VIBE_START_PROMPT.md](BUILD_VIBE_START_PROMPT.md). First complete an evidence-based audit and baseline; then prioritize reusable design-system and generation quality, licensed module integration, accessible animation, optimized 3D, complete product workflows and measured acceptance tests. This work complements the existing launch roadmap and must not weaken release gates.
