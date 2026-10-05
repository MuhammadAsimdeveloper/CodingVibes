# Build Vibe 12.1 — Final launch contract

## Release objective
Build Vibe 12.1 is the launch-candidate release line focused on one durable promise: turn natural-language product requirements into reviewable, verified, portable software that can be published without pretending unverified output is production-ready.

## Completed in the automated release loop
- Proxy-origin handling now honors `CODINGVIBES_TRUST_PROXY`; forwarded host/protocol headers are ignored unless proxy trust is explicitly enabled.
- Duplicate `/robots.txt` and `/sitemap.xml` registrations were removed.
- Stripe Checkout return URLs are constrained to the configured public origin.
- Protected `/api/launch/status` exposes sanitized production, runner, scale-out and telemetry state to super-admins.
- Protected `/api/ops/metrics` exposes bounded request telemetry without credentials or sensitive configuration values.
- Every request receives an `x-request-id` response header and telemetry records bounded route, status-family and latency data in memory.
- Native runner workflow actions were modernized to the repository's current action versions with explicit job timeouts.
- The existing 12.0.0 SEO/AEO, verification, deployment, collaboration, scale-out and native-runner contracts remain covered by the full regression suite.
- `@daytona/sdk` was upgraded from 0.214.0 to 0.220.0 through a green Dependabot CI path before this release line was created.

## Required production configuration
The code is launch-ready, but a public production deployment is not considered certified until the actual environment passes the launch contract. Set:

1. A strong `CODINGVIBES_SESSION_SECRET` (32+ characters; use a long random value).
2. `CODINGVIBES_PUBLIC_URL` using HTTPS.
3. `CODINGVIBES_RUNTIME=daytona` or a hardened container runtime with an explicit image.
4. `CODINGVIBES_ENABLE_BROWSER=true` for browser verification.
5. `CODINGVIBES_ENFORCE_QUOTAS=true`.
6. Writable project, worktree, checkpoint, backup and artifact/media storage paths appropriate to the deployment topology.
7. A configured model provider.
8. Stripe secret/webhook/price IDs when billing is enabled.
9. `CODINGVIBES_SUPERADMIN_EMAILS`.
10. Persistent backups, monitoring/alerting and a restore drill.
11. Native runner fleet credentials/toolchains and signing assets for any target advertised as binary-verified.

## Release gate
Run:

```bash
npm run final:check
npm run launch:preflight
```

The first command is the canonical code/repository release gate. The second command must pass in the real production environment.

## Launch behavior contract
- Unverified generated changesets cannot be committed through the product workflow.
- Native binaries are not marked verified without an attested target runner result.
- Production readiness failures are summarized without revealing credentials.
- Generated public SEO metadata is absolute and crawlable; the authenticated builder remains outside search indexing.
- Stripe billing has one canonical webhook route with signed event validation.
- Deployment artifacts are prepared only from the latest verified workspace.

## Competitive product direction
The next product investment should deepen the verified build loop and visual canvas rather than expand the feature checklist indefinitely. The strongest differentiation is evidence-backed output: users should be able to see exactly what was generated, tested, repaired, verified and deployed.

## Explicit non-claims
This release does not claim that external infrastructure is already provisioned, that native signing assets exist, that third-party credentials are configured, or that SEO rankings are guaranteed. Those are environment and operations responsibilities and remain visible through readiness checks.
