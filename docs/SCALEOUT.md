# Build Vibe scale-out layer

The repository now contains explicit production adapters for PostgreSQL, S3-compatible object storage, and Redis Streams.

## What is and is not migrated

The existing Store class remains the authoritative application store and still uses SQLite. The new adapters are a scale-out foundation for workloads that should not remain tied to local disk, process memory, or a single SQLite writer.

Enabling these adapters does not silently migrate the existing relational schema.

## Enablement

Copy .env.scaleout.example into the deployment secret/config system and set:

- CODINGVIBES_DB_BACKEND=postgres
- CODINGVIBES_OBJECT_BACKEND=s3
- CODINGVIBES_QUEUE_BACKEND=redis

Then configure DATABASE_URL, S3 credentials/bucket, and CODINGVIBES_REDIS_URL.

Run npm run scaleout:doctor. It checks configuration, initializes the PostgreSQL reference migration when PostgreSQL is enabled, and health-checks the selected object store and queue.

## Production rules

Use TLS for PostgreSQL outside a private network; keep CODINGVIBES_PG_SSL_MODE=require or verify-full.

Use a private bucket with server-side credentials; generated artifact downloads should remain authenticated.

Use Redis Streams with a dedicated consumer group. Workers must acknowledge successful jobs and allow reclaim of stale pending work.

The production compose file is a reference service stack. Before public exposure, replace development passwords with secret-managed credentials and pin container images by digest.

## Current integration boundary

The adapters are intentionally not wired into the legacy Store API or synchronous build path yet. A future migration can move selected tables and workloads behind these contracts in measured stages without changing the launch-critical SQLite behavior.
## Resilience gates

The Redis queue contract now supports idempotency keys, bounded retries, stale-message reclaim and a dead-letter stream after the retry budget is exhausted. Local tests also cover the same semantics through the in-memory queue.

Request telemetry includes overall error rate, p95 latency and bounded per-route p95 samples. Product analytics has explicit retention controls, and SQLite backup/restore is executable in tests and CI.

The load smoke can exercise 10, 25 and 50 concurrent health requests. It returns BLOCKED when a target server is not reachable rather than claiming a load result.

## Resource boundaries for design and 3D generation

Generation workloads from [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) must remain bounded by current queue, timeout, concurrency, cancellation and resource-limit contracts. Rich visual generation must not create unbounded model loops or unisolated rendering jobs; report infrastructure limitations explicitly.
