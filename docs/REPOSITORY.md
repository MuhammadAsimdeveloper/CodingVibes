# Repository organization

`main` is the canonical release branch. Feature and release branches are validated through pull-request CI before squash-merging to `main`.

## Product surfaces
- `public/` — Build Vibe web UI and product studio.
- `src/server.js` — control-plane HTTP API.
- `src/agent/` — planning, generation, repair and review.
- `src/platform/` — product blueprint and capability model.
- `src/site/` — structured content/site runtime.
- `src/templates/` — generated runtime templates.
- `src/deployment/` — provider-neutral artifact and deployment adapters.
- `src/runners/` — isolated native/build runner fleet.
- `src/verification/` — source, HTTP, browser and visual verification.
- `src/billing/` — plans, feature gates and Stripe integration.
- `src/security/` — sessions, vault and safe-path controls.
- `src/db/` — SQLite control-plane persistence plus PostgreSQL scale-out primitives.

## Generated customer projects
Generated projects follow a portable structure:
- `app/` — server runtime and authentication.
- `public/` — public pages, content and browser runtime.
- `src/generated/` — machine-readable route and data contracts.
- `public/admin.html` — mandatory owner portal.
- `public/login.html` — only when public authentication is requested.
- `.env.example` — configuration contract; secrets are never committed.
- `.data/` — generated runtime state; excluded from Git.
- `test/` — generated acceptance verification.

## Git workflow
1. Build work lands in a feature branch.
2. CI must pass `npm test`, `npm run check` and `npm run e2e`.
3. Merge validated product stages to `main`.
4. Release tags are created from green `main`.
5. Provider credentials and production secrets remain outside Git.

## Release identity

Current product release: Build Vibe 12.0.0.
The GitHub repository name remains CodingVibes for remote/clone compatibility; product-facing documentation uses Build Vibe.

## Release hygiene
- Security policy: `SECURITY.md`
- Contribution workflow: `CONTRIBUTING.md`
- Pull request checklist: `.github/pull_request_template.md`
- Dependency automation: `.github/dependabot.yml`
- SEO implementation: `docs/SEO.md`
- Final gate: `npm run final:check`

## Reconstruction plan and start prompt

The visual/3D reconstruction workstream has two new entry documents: [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) and [BUILD_VIBE_START_PROMPT.md](BUILD_VIBE_START_PROMPT.md). These complement the main launch plan and AI build instructions. Audit documents under docs/audit should be created or refreshed from verified repository findings before substantial code changes.
