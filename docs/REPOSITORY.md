# Repository organization

## Product surfaces
- `public/` — Coding Vibes web UI and product studio.
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
- `src/db/` — durable control-plane persistence.

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
