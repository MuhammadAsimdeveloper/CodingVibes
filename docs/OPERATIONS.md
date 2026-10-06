# Build Vibe operations

## Runtime

Development may use the local SQLite database and local queue/object storage. Production must use a non-host execution runtime and explicit provider credentials as enforced by `src/ops/readiness.js`.

Set a stable session secret, public HTTPS URL, project/work roots, backup location, quota enforcement, and super-admin allowlist before production.

## Scale-out

The existing scale-out layer supports SQLite/local defaults and optional PostgreSQL, S3 and Redis backends. Incomplete managed configuration is reported as a blocker rather than silently falling back.

The worker and queue contracts provide retries, reclaiming of idle Redis jobs, idempotency keys and a dead-letter stream/list when retry budgets are exhausted.

Run:

`npm run scaleout:doctor`

For runtime load:

`npm run ops:load`

The load smoke checks 10, 25 and 50 concurrent health requests by default and reports p95 latency plus failures. It requires a running server and returns **BLOCKED** when the target is unreachable.

## Observability

Request telemetry is in-memory by default and includes request totals, error rate, status families, per-route averages, route p95 latency and overall p95 latency. Operator metrics are protected by super-admin authorization.

For production, export telemetry to the organization's existing monitoring/alerting stack rather than treating in-memory process telemetry as a durable metrics store.

## Backups and restore

Use the protected backup endpoint or `backupStore()` to produce a VACUUM-consistent SQLite backup with SHA-256. Restore by copying the verified backup into a separate database path and opening it with the same schema migration code.

Never overwrite the live database during an unverified restore test.

## Incident handling

Preserve the run/evidence/audit records, freeze deployments, verify the latest known-good commit/checkpoint, and follow `docs/ROLLBACK.md`. Keep security and verification gates fail-closed during incident response.
