# Build Vibe 12.3 — Backend completion contract

## Release objective
Build Vibe 12.3 turns the existing backend adapters into one coordinated runtime used by the application lifecycle.

## Completed backend layer
- Central BackendRuntime coordinates SQLite application storage, optional PostgreSQL control-plane persistence, object storage, job queues and outbox relay.
- PostgreSQL migrations are applied before the managed control-plane is used.
- S3-compatible object storage is available for durable artifacts and media, with local object storage retained for development.
- Redis Streams is available for distributed workers, while the in-memory queue remains the development default.
- PostgreSQL outbox records can be relayed into the queue with bounded worker leases and retries.
- Backend object references are persisted with size, checksum, content type and metadata.
- Audit metadata is sanitized at the storage boundary so token/password/secret-like fields are not persisted.
- Server startup initializes the backend runtime before accepting traffic and exits on invalid declared production topology.
- Server shutdown closes the backend queue, database and application store cleanly.
- Protected GET /api/ops/backend exposes sanitized backend topology and health for operators.

## Development topology
SQLite + local object storage + in-memory queue is the default and remains fully testable without external services.

## Production topology
Production can select PostgreSQL for the durable control plane, S3-compatible object storage and Redis Streams. The exact credentials and endpoints are intentionally environment-only.

## Important persistence boundary
The current application Store remains SQLite-based. PostgreSQL in this release is the durable scale-out control plane for outbox, object references and replicated audit events; this release does not falsely claim a completed full migration of every application table to PostgreSQL.

## Verification
The release gate covers backend runtime initialization, backend health, object reference persistence, queue dispatch, fail-closed backend configuration, sanitized audit metadata, production readiness for declared managed backends, syntax, E2E, security, scale-out doctor and launch checks.

Run:

npm run final:check
npm run launch:preflight

## Explicit non-claims
This release does not claim that PostgreSQL, Redis, S3, email, AI providers, Stripe or Google Cloud credentials are already provisioned. Deployment wiring remains the next environment-connection stage.
