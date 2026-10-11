# Build Vibe production operations runbook

This runbook describes source-supported checks and the operator tasks that still require a configured environment. Passing repository CI is not proof of a live deployment.

## 1. Verify the intended deployment environment

Supply provider secrets through the hosting platform's secret manager. Do not put token values in shell history, CI logs, source files, or issue comments.

```sh
npm ci
npm test
npm run check
npm run security:check
npm run scaleout:doctor
npm run deployment:preflight
CODINGVIBES_DEPLOY_PROVIDER=vercel npm run deployment:credentials
```

Use the provider ID that matches the actual deployment target: `github`, `vercel`, `netlify`, `cloudflare`, `hostinger`, `coding-vibes`, or `manual`. Set `CODINGVIBES_DEPLOY_TARGET` when a specific target is required. The credential probe is read-only: `PASS` confirms token identity (and Cloudflare account readability), not publication permissions. `UNVERIFIED` is not a pass. Build Vibe Cloud intentionally remains `UNVERIFIED` until a documented non-mutating credential/health endpoint is implemented.

## 2. Publish to staging before production

1. Run the deployment preflight in the same environment that will publish the site.
2. Publish a non-critical staging project first. Confirm the provider reports a deployment ID and final URL; do not treat Hostinger's GitHub handoff as a completed Hostinger deployment.
3. Fetch the final URL over HTTPS. Verify redirects, certificate validity, the expected title/metadata, core user flows, generated-site browser smoke, and no unexpected console/network errors.
4. Confirm uploaded assets still resolve at their original relative paths and the deployment result's optimization report is internally consistent. PNG optimization uses the available `pngjs` fallback. JPEG/WebP/AVIF resizing only runs when Sharp is installed; without it those source bytes are preserved.
5. Record the Git commit, artifact fingerprint, provider deployment ID, test results, and rollback target in the release record.
6. Promote only after staging smoke and owner acceptance. Keep the prior known-good deployment until the new release has passed its observation window.

## 3. Health, readiness and telemetry

- `GET /health` is a lightweight liveness endpoint. It returns the service/version/timestamp and an `x-request-id`; it does not certify database health or application dependencies.
- `GET /ready` evaluates application readiness. In production it intentionally returns only a minimal ready/not-ready payload. A `503` means traffic should not be routed to that instance.
- `GET /api/ops/metrics` and `GET /api/launch/status` require a super-admin session. The launch check verifies these endpoints reject unauthenticated requests.
- The current request telemetry is bounded **in-memory process telemetry**: request counts, 5xx counts, status families, route counts and latency percentiles. It resets at process restart and is not a durable time-series backend or alerting service. Connect the host platform's external uptime/alerting/metrics facilities before production launch; do not expose the admin metrics endpoint publicly.
- The external monitor should request `/health` and `/ready` separately. Page on liveness failures, persistent readiness failures, or a sustained 5xx/p95-latency increase. Agree on numeric SLO thresholds and an observation window with the service owner before launch; this repository does not define a verified production SLO yet.

## 4. Database backup and recovery

The app's super-admin endpoint `POST /api/ops/backup` creates a SQLite backup using `VACUUM INTO`, then returns a SHA-256 digest, byte size and creation time without returning the filesystem path. Configure `CODINGVIBES_BACKUP_ROOT` to a persistent, access-restricted destination with sufficient disk capacity.

Use `CODINGVIBES_BACKUP_FILE=/restricted/path/codingvibes-<timestamp>.db npm run backup:verify` to run a read-only SQLite integrity check, foreign-key check and SHA-256 calculation for an existing backup. Set `CODINGVIBES_BACKUP_SHA256` as well to compare the file against a digest from a trusted backup record. The command rejects symlinks and reports sanitized reasons without dumping database content. The automated `npm run recovery:smoke` separately exercises a temporary SQLite backup/restore and validates a representative project. Neither command proves that a production backup was copied off-host, that scheduled backups are running, or that a real customer database can be restored within its recovery objectives.

Before launch:
1. Configure and verify an off-host or managed backup destination, access controls, encryption at rest, retention and failure alerts.
2. Perform a controlled backup and verify its checksum and size.
3. Restore a copy to an isolated environment. Run the SQLite integrity/health check and validate representative users, projects and relationships.
4. Measure recovery time and acceptable data loss; record RTO/RPO expectations and the latest successful restore evidence.
5. During a real incident, stop or drain writers, preserve the failed database for investigation, restore into a new path, validate it before changing `DATABASE_PATH`, and retain a clear rollback path. Do not overwrite the only copy of the failed database.

Do not claim backup/restore is production-ready solely because a writable directory exists or the temporary CI recovery test passed.

## 5. Incident rollback

Maintain the previous known-good provider deployment and its release fingerprint. If the new release fails health, readiness, core journey, or asset smoke checks, route traffic back to the previous deployment using the provider's supported rollback/version mechanism. For self-hosted releases, restore the prior immutable build and compatible configuration. Database schema/data changes require a separately documented backward-compatible migration or recovery procedure.

After rollback, verify HTTPS, `/health`, `/ready`, login/build flows, deployment status, and asset paths. Preserve relevant request IDs, provider deployment IDs and sanitized logs; never attach tokens, session cookies or private source contents to incident reports.

## 6. Current evidence boundary

The repository includes readiness checks, request correlation, bounded in-memory telemetry, an authenticated admin metrics endpoint, a SQLite backup path, and a temporary restore smoke test. Production certification still requires environment-specific proof of provider credentials/scopes, staging-to-production deployment, public HTTPS/domain, persistent backups plus a successful isolated restore, external monitoring/alerting, durable log/metric retention, quotas, and recovery/rollback drills. Missing evidence must remain `BLOCKED` or `NOT_CONFIGURED`, not be inferred from source code.
