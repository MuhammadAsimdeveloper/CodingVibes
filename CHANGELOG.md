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

- Removed Build Vibe attribution from generated-site footers, generated Open Graph images, and PWA short names; generated favicons now use the product's own initial.
- Added a quality check that blocks builder attribution in published user products.

- Replaced placeholder generated Privacy Policy and Terms pages with substantive default-data-practice disclosures, acceptable-use rules, user-content terms, third-party service notes, liability language, and contact routes.
- Added release-blocking checks for favicon asset/link presence and substantive Privacy Policy and Terms content.

- Added a mandatory generated-product quality contract and audit checks for fabricated social proof, unwanted AI attribution, purple gradients, emoji icons, em dashes, pill-shaped buttons, cursor-following effects, excessive scroll motion and vague marketing copy.
- Changed generated design-system and template motion defaults to short, restrained reveals with no magnetic cursor-following behavior or decorative looping animation; preserved reduced-motion support.
- Reviewed UI/UX Pro Max upstream guidance and recorded a pinned-source adoption plan with local anti-pattern overrides and controlled refresh requirements.

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
