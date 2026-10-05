# Build Vibe 12.2.0 — current release contract

Build Vibe 12.2.0 consolidates the verified AI product-builder workflow with the final SEO, template-studio, repository-hygiene and release-gate pass.

## Account authentication

Email/password signup and login remain available. Google account creation/sign-in is available when Google OAuth credentials are configured. The Google callback validates one-time state and PKCE, requires a verified email, links identities by Google subject or existing email, and then creates the same signed HTTP-only Build Vibe session used by email authentication.

Required settings for Google OAuth:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (must exactly match the Google Cloud OAuth redirect URI)

## Customer flow

1. Create an account.
2. Create a project and describe the product in natural language.
3. Build a structured product blueprint.
4. Generate a provider-neutral application.
5. Run isolated verification and bounded repair.
6. Review the diff and evidence, then explicitly commit verified changes.
7. Edit structured content through the owner-only generated `/admin`.
8. Publish the latest verified artifact through a compatible provider.
9. Return to the same project, refine the request and repeat the loop.

## Generated-site guarantees

Every generated website includes an owner-only `/admin` portal. A public `/login` surface is generated only when requested. Provider credentials and runtime secrets remain outside generated source.

Generated public pages receive descriptive metadata, canonical URLs, Open Graph/Twitter previews, favicon and manifest assets, JSON-LD WebSite/WebPage markup, and crawlable robots/sitemap endpoints. Authenticated admin/login surfaces are marked noindex.

## Template studio

The catalog includes curated starters across SaaS, agencies, commerce, hospitality, real estate, creative portfolios, education, events, marketplaces, local services, employment, directories, booking, communities, documentation and operations dashboards. Advanced 3D recipes remain available for property, architecture, products, automotive, hospitality and immersive experiences.

## Repository hygiene

The canonical Git repository remains `MuhammadAsimdeveloper/CodingVibes` for clone/remote compatibility; the product identity is Build Vibe. Release work is developed in branches, validated through pull-request CI and squashed to `main`. Superseded release-note files are removed from the active tree. Dependabot, contribution guidance, security guidance and a pull-request checklist are committed with the release tooling.

## Scale-out foundation

PostgreSQL, S3-compatible object storage, Redis Streams, durable outbox processing and a configurable worker are included as explicit production adapters. These do not silently replace the existing SQLite Store.

## Launch operations

The protected `/api/launch/status` endpoint returns the sanitized production readiness, runner, scale-out and telemetry state for an authorized super-admin. The protected `/api/ops/metrics` endpoint exposes bounded request telemetry, and every HTTP response carries an `x-request-id` for incident correlation.

## Operations

The protected `/ops` console provides customer/project/run/deployment health, audit visibility and backup creation. Production readiness blocks launch when required infrastructure or security configuration is missing.

## Native targets

Android, Flutter, Tauri/Rust, SwiftUI, Electron and Kotlin Multiplatform targets remain verification-gated. Source generation alone never marks a native binary verified.

## SEO release gate

SEO changes are covered by `test/seo-template-final.test.js`, including landing metadata, workspace noindex controls, generated canonical/schema assets, sitemap/robots generation and template catalog coverage.

SEO implementation notes are documented in `docs/SEO.md`.

## Final verification

Run:

`npm run final:check`

This executes the complete automated test, syntax, end-to-end and launch-readiness sequence. GitHub Actions mirrors these gates on pull requests targeting `main`.
