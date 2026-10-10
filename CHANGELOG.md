# Changelog

## 13.0.0 — 2026-10-07

- Completed final source-side launch hardening.
- Added canonical release identity and reproducible package locking.
- Added SEO/discoverability release verification and seo:check.
- Expanded public and generated-site social/SEO metadata and structured-data coverage.
- Added Windows-friendly npm run start:host entrypoint.
- Preserved explicit runner/infrastructure readiness boundaries.

All notable Build Vibe changes are recorded here.

## [Unreleased]

- Added measured browser performance evidence (navigation/FCP/TTFB/resource sizes/LCP/CLS where available) and made incomplete performance audits report missing metrics instead of a full-pass result.

- Added nine bounded local Tool Fabric text utilities with explicit contracts, regression tests and no network side effects.
- Added a private browser-local image optimizer to Studio with raster MIME validation, dimension/size limits, explicit encoder capability handling and download output.

- Added bounded, local-only Tool Fabric pipeline composition with safe prior-output references, preflight validation, output budgets, fail-fast results, authenticated API access and content-free audit metadata.
- Added 13 deterministic, bounded local Tool Fabric calculator, dimensional-unit, age, time-zone and data-size tools with canonical contracts and regression tests.
- Added local SHA-256/SHA-384/SHA-512 generation, constant-time checksum verification, cryptographic UUID v4 generation and explicit URL component/URI encode/decode tools.

### Phase 1
- Added canonical release verification via `npm run release:check`.
- Added Node version pinning with `.nvmrc`.
- Added coverage thresholds to the Node test runner.
- Added CodeQL and dependency-review workflows.
- Added API and migration/versioning contracts.
- Added explicit secret-scanning guidance and configuration-state honesty.

## [12.2.0]
See `docs/FINAL_RELEASE.md` and `docs/FINAL_RELEASE_12.2.md`.


## [Unreleased] — generated website quality follow-up (2026-10-10)

- Documented a 20-point generated-website launch quality gate, including evidence-backed implementation, partial coverage, unconfirmed behavior, user-input requirements, and release acceptance criteria.
- Planned automated checks for custom 404 behavior, CTA visibility, form confirmation/error flows, consent-aware analytics, responsive behavior, favicon coverage, image alt text, and image optimization.
- No code implementation or fresh CI/deployment verification is claimed by this documentation update.


## [Unreleased] — generated website quality follow-up (2026-10-10)

- Added `docs/GENERATED_WEBSITE_QUALITY_GATE.md` as the evidence-based 20-point generated-site implementation/status plan.
- Recorded existing foundations (SEO metadata/JSON-LD, robots/sitemap checks, discoverability auditing, product-quality state contracts, reduced-motion support, and privacy/terms templates) separately from behavior that still requires end-to-end verification.
- Planned P0/P1/P2 work for real 404 routing, robust form confirmation/error handling, responsive CTA checks, favicon/OG validation, consent-aware customer-site analytics, contact-data integrity, and image optimization.
- Documentation-only update: no new implementation, test run, or deployment is claimed.


## [Unreleased] — generated website quality gate implementation (2026-10-10)

- Added a versioned 20-requirement generated-site audit engine (`src/verification/generated-site-quality.js`) and `npm run site:quality` CLI.
- Added tests for report statuses, missing evidence, and critical publish blockers.
- Generated projects now include a branded `public/404.html`; unknown public routes return HTTP 404 rather than silently falling back to the home page.
- Added a generated-server HTTP integration test for the 404 behavior.
- Full GitHub Actions Build Vibe CI passed at commit `dd1bd2662125db43634ccdca4055b58b8bb852c3`.
- Remaining: connect the quality report to the generation/publish transaction and implement/verify the other 19 checklist items as appropriate. The CLI is not yet an enforced publish gate.
