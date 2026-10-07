# Build Vibe 14.0.0 — phase 14 source release contract

Build Vibe 14.0.0 adds the AI Studio-inspired Build Mode layer, structured Free website quotas, explicit paid native/APK policy, and the local PostgreSQL bootstrap path. Production infrastructure remains environment-dependent.

## Source-side completion

- Canonical release identity and reproducible package lock.
- Node version pin and release hygiene files.
- CodeQL and dependency-review workflows.
- Verification-gated generation and bounded repair architecture.
- Research, provider routing, deployment, billing, scale-out and native runner contracts.
- Benchmark/evaluation and MiroFish adapter contracts.
- Centralized public SEO metadata and discoverability verification.
- Crawlable public routes with canonical URLs, social metadata, structured data, robots.txt and sitemap.xml.
- Owner-editable generated SEO fields and generated-site structured SEO assets.
- Accessibility, browser verification and visual QA gates.
- Windows-friendly host startup command.

## SEO contract

Public routes must expose a unique descriptive title, useful meta description, explicit robots behavior, an absolute canonical URL, Open Graph/Twitter metadata, a representative preview image, and valid JSON-LD where the page qualifies. Private/admin/authentication routes remain noindex and are excluded from public sitemaps.

The SEO implementation is designed around crawlability, useful people-first content, accurate structured data, internal linking, performance and accessibility. AI-search discoverability is treated as an extension of those fundamentals, not a separate ranking loophole.

## Launch boundary

The repository is source-ready, but production infrastructure is environment-dependent. A real public launch still requires a hardened runner (Daytona/container/approved remote target), production secrets, persistent storage/backups, TLS/reverse proxy, monitoring/alerting, quotas, domain configuration, and live provider credentials for any enabled integrations or payments.

## Verification

Run:

npm ci
npm test
npm run test:coverage
npm run check
npm run seo:check
npm run security:check
npm run scaleout:doctor
npm run e2e
npm run browser:e2e
npm run benchmark
npm run launch:check

The release decision must remain PASS/BLOCKED/NOT_CONFIGURED rather than treating missing external infrastructure as a fake green result.
