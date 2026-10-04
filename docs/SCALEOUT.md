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