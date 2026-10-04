# Build Vibe launch audit — October 4, 2026

## Baseline

Repository: `MuhammadAsimdeveloper/CodingVibes`

Audited main baseline: `dec2b9602ee49124522f19e6728bf183d1fbee65`

Latest observed GitHub Actions run on the baseline: run 186, all listed CI steps succeeded (tests, syntax checks, end-to-end checks and launch readiness).

## Hardening applied in the release branch

- Public liveness/health output no longer exposes model provider chains, provider base URLs or runtime details.
- Production readiness failures are generic on the public `/ready` endpoint; detailed launch diagnostics remain an operator concern.
- API/health/readiness responses are marked `no-store`.
- Production emits HSTS.
- Proxy address trust is opt-in through `CODINGVIBES_TRUST_PROXY=true`; arbitrary client-supplied `X-Forwarded-For` is not trusted by default.
- Login and signup have a dedicated per-IP/per-operation rate limit in addition to the global API limit.
- Same-origin enforcement can be pinned to `CODINGVIBES_PUBLIC_URL` and `CODINGVIBES_ALLOWED_ORIGINS` rather than trusting the request Host header.
- The duplicate legacy Stripe webhook endpoint was removed so billing has one canonical, idempotent webhook path.
- `/terms` and `/privacy` are public legal routes, with a standard `/.well-known/security.txt` vulnerability-reporting entry.
- Landing-page claims were aligned with the implemented template count and real product workflow; unsupported social-proof/support claims were removed.
- Competitive positioning and launch evidence are stored in-repository.

## Launch gates that remain environment-dependent

The code cannot truthfully certify these without the production environment being connected:

- strong production session secret
- isolated runtime (Daytona or hardened container) and its credentials
- persistent writable database/project/worktree/checkpoint/artifact/backup storage
- HTTPS termination and correct public URL
- configured model provider
- browser verification
- quota enforcement
- Stripe secret, webhook secret and live/test price IDs for paid plans
- super-admin allowlist
- provider OAuth credentials for GitHub/deployment integrations
- monitoring, alerting and backup restoration drills

## Operational go/no-go

**Code gate:** merge only after the release branch CI is green.

**Infrastructure gate:** run `npm run launch:preflight` in the real production environment and require `npm run launch:check` plus browser verification to pass.

**Product gate:** do not describe an Android/iOS/macOS/native artifact as verified unless the isolated target runner returns an attested successful build/test result.

**Governance gate:** enable GitHub branch protection with required CI status checks before allowing routine production merges. The current repository branch is not protected by the GitHub connector's observed branch metadata.
