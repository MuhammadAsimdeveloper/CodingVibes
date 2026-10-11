# Changelog

## [Unreleased] — export optimization, accessibility and deployment preflight (2026-10-11)

- ZIP exports store already-compressed media without redundant DEFLATE; text/source files remain compressed.
- Added isolated-copy raster optimization in manual ZIP, Netlify, Build Vibe Cloud, GitHub, Vercel and Cloudflare Pages paths. Oversized PNGs can be resized/re-encoded when the result clears the savings threshold; original source files and relative paths are preserved.
- PNG optimization uses the optional `pngjs` fallback. JPEG/WebP/AVIF resizing requires an installed Sharp encoder; without Sharp, these formats remain unchanged. Reports are bounded and attached to export/deployment results.
- Added dimension/path guards before PNG decode, ZIP media byte-preservation tests, and direct-upload provider tests including Vercel digest correctness and Cloudflare 3D model MIME types.
- Generated-site browser verification checks missing alt attributes, unnamed controls/links/form fields, interactive `aria-hidden`, H1/heading hierarchy, visible keyboard focus, primary interactive target dimensions and horizontal overflow.
- Generated CSS includes visible focus outlines, forced-colors support and 44px minimum primary control targets. Existing reduced-motion support is retained.
- Added `npm run deployment:credentials` for sanitized, read-only provider probes. Authentication checks do not prove write permissions; the Build Vibe Cloud adapter remains `UNVERIFIED` without a documented non-mutating probe.
- Current source includes broader automated regression coverage. Launch checks validate /health and /ready response/correlation headers and protect admin telemetry/launch-status endpoints. Added `npm run backup:verify` to check an existing SQLite backup read-only, validate `PRAGMA quick_check` and foreign-key integrity, and compare a trusted SHA-256 digest when supplied. A fresh Build Vibe CI + CodeQL + Dependency Review result is required for the final PR head. See docs/PRODUCTION_OPERATIONS.md for honest monitoring, staging, backup/restore and rollback steps; production deployment, external monitoring, backup/recovery, contrast/visual-quality budgets and real provider write access remain distinct release gates.

## 13.0.0 — 2026-10-07

- Completed final source-side launch hardening.
- Added canonical release identity and reproducible package locking.
- Added SEO/discoverability release verification and seo:check.
- Expanded public and generated-site social/SEO metadata and structured-data coverage.
- Added Windows-friendly npm run start:host entrypoint.
- Preserved explicit runner/infrastructure readiness boundaries.

All notable Build Vibe changes are recorded here.

## [Unreleased] — media-aware export archive packaging (2026-10-11)

- ZIP exports now store already-compressed PNG/JPEG/WebP/AVIF/GIF/BMP, common audio/video, PDF, ZIP/gzip/Brotli and WOFF font assets without an additional DEFLATE pass.
- Text and source files remain DEFLATE-compressed. Asset payload bytes, paths and references remain unchanged.
- Added regression tests for media-byte preservation and exact HTML content round-tripping.
- Scope note: archive packaging preserves original bytes, while the isolated export optimizer can resize oversized PNG assets when it produces meaningful savings. Non-PNG raster resizing depends on an installed Sharp encoder.

## [Unreleased] — platform-specific generated app icons (2026-10-11)

- Generated projects now include real 180px Apple touch, 192px PWA, and 512px maskable PNG icons plus the existing scalable SVG fallback.
- Added correct HTML icon links for public pages, the 404 page, owner admin and sign-in; the web manifest now has a single canonical emission.
- Added deterministic PNG generation, structural tests and browser HTTP/content-type/dimension verification.
- Full Build Vibe CI passed on [588156e398bd643c7ed3bd7a5a17979983bea329](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/38081225750).

## [Unreleased] — responsive generated-site QA (2026-10-11)

- Added real mobile/tablet/desktop browser viewport sweeps to generated-site verification, with measured horizontal-overflow failures and element diagnostics.
- Fixed long owner configuration text and admin editor layout that overflowed on narrow mobile screens.
- Generated-site browser E2E now requires passing evidence at 375px, 768px and 1440px for each tested route.
- Full Build Vibe CI passed at [29f57ebea72a9725e3ac62cc73ea035d3f45732f](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/38080632604).

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


- Follow-up: attached the 20-point generated-site report to product-quality evidence for web targets; it remains informational until publish-gate integration is implemented and tested.


## [Unreleased] — generated-site conversion and privacy controls (2026-10-10)

- Added a branded custom 404 page with correct HTTP 404 behavior for unknown public routes.
- Added default web app manifest generation for all web targets.
- Added an accessible cookie preference interface with accept/reject, analytics/marketing preferences, persistence, reopening, and consent-change events. Accept/reject controls use equal visual prominence.
- Added a dismissible mobile-only contact CTA with session-level dismissal.
- Improved contact form feedback with disabled/loading state, accessible error/status regions, network/server failure handling, and redirect to a noindex thank-you route only after a successful API response.
- Excluded the thank-you route from navigation, llms.txt, and the sitemap.
- Attached the 20-point generated-site audit report to web product-quality evidence; publishing is not yet blocked by this report.
- Full CI passed at `bcb4288036d0ac45b4a045e83531d406d99a85c6`.


## [Unreleased] — production quality gate enforcement (2026-10-10)

- Extended HTTP smoke checks to require exact HTTP 404 for a generated unknown route.
- Extended Playwright browser smoke to exercise the primary CTA, cookie reject/preferences persistence, mobile sticky CTA dismissal, contact-form loading/error recovery, and successful redirect to the noindex thank-you page.
- Fed runtime results into the generated-site quality report and added critical-check blocking to the verification contract in production or when `CODINGVIBES_ENFORCE_GENERATED_SITE_QUALITY=true`.
- Full CI passed at `962d5006ed239ff39476aeefe3d43cb05d4d51a9`.


## [Unreleased] — analytics consent and business contact data (2026-10-10)

- Added optional Google Analytics generation when a valid owner-supplied measurement ID is provided in structured project settings or explicitly in the build brief.
- Analytics script is not loaded before analytics consent; revocation sets Google consent state to denied and activates the ga-disable collection guard.
- Added browser verification for consent-gated analytics load/revocation, using a locally intercepted test script rather than a real third-party request.
- Business address is extracted only from explicitly labeled user input, rendered with HTML escaping, and required by the production quality gate for business sites.
- Added a generated-site browser smoke fixture that checks the critical 20-point gate end to end.
- Full CI passed at `ceac1d6c58af339880b5959f69a0e4d3d75547b8`.


## [Unreleased] — project launch settings UI (2026-10-10)

- Added project-scoped builder fields for business contact address and Google Analytics measurement ID.
- Settings persist in browser localStorage per project, survive project switching/reload, and are appended to the build brief without echoing the settings into the visible prompt log.
- Analytics IDs are validated before build; business addresses are explicitly supplied, safely rendered, and required for business-site production verification.
- Full CI passed at `06d2a6fcd03d6e37a8793f260738f5383b152a94`.


- Follow-up: project launch settings now persist per project in browser localStorage and restore when switching projects or reloading the builder. Verified by unit/static tests and full CI at `06d2a6fcd03d6e37a8793f260738f5383b152a94`.
