# Coding Vibes delivery roadmap

## ✅ Stage 8 — Ownership and publishing
- Mandatory owner-only `/admin`.
- Optional public `/login` with Google OAuth.
- Provider-neutral deployment artifact.
- GitHub, ZIP/manual, Vercel, Netlify and Cloudflare adapters.
- Publish studio and deployment history.

## ✅ Stage 9 — Durable generated applications
- Persistent generated-app records.
- Generic CRUD semantics.
- Restart-safe runtime state.
- Persistence regression coverage.

## ✅ Stage 10 — Production hardening
- Protected super-admin operations console.
- Durable audit log.
- Verified SQLite backup primitive.
- Production readiness checks for operations configuration.
- Final release verification command.

## ✅ Stage 11 — Native verification contracts
- Isolated Android/Flutter/Rust runners.
- macOS/Xcode protocol for Apple targets.
- Device/emulator verification contracts.
- Artifact hashing and secure downloads.

## ✅ Stage 12 — SaaS operations foundation
- Customer/project/deployment operational visibility.
- Subscription/usage state already persisted.
- Audit/event evidence.
- Rate limiting and readiness gates.

## ✅ Stage 13 — scale-out infrastructure primitives

- PostgreSQL pool, transactions, health checks and idempotent reference migration.
- S3-compatible object storage with checksum and size enforcement.
- Redis Streams durable queue with consumer groups, retries and stale-message reclaim.
- PostgreSQL outbox repository plus Redis relay.
- Graceful configurable worker process.
- Production compose reference stack and `npm run scaleout:doctor` gate.

The existing Store remains SQLite until a separate, reviewed schema migration is performed.

## Next scale-out work after 12.0.0
- Managed PostgreSQL before horizontal scaling.
- Dedicated object storage before large media workloads.
- Managed job queue for multi-instance background workers.
- Full native runner fleet capacity and signing infrastructure.


## Generated website launch quality gate — audit update (2026-10-10)

This section records a repository inspection of the 20-point website launch checklist. It is a planning/status update, not evidence that a fresh test run or deployment occurred. Keep the distinction between implementation present in source, contract/test coverage, and verified behavior in a generated project.

### Evidence-backed capabilities already present

- Page-specific title/description helpers and generated/public SEO metadata: `src/seo/metadata.js`, `src/seo/public-pages.js`.
- Crawl controls, sitemap generation and SEO route checks: `public/robots.txt`, `public/sitemap.xml`, `scripts/launch-check.mjs`, `scripts/seo-check.mjs`.
- Open Graph/Twitter metadata, canonical URLs, structured data, and generated-site discoverability checks: `docs/SEO.md`, `src/verification/discoverability.js`, `test/final-seo-hardening.test.js`.
- Product-quality contract includes responsive UI, accessible navigation/forms, reduced motion, metadata, owner admin, and loading/empty/error/success states: `src/agent/product-quality.js`.
- Experience-quality helper includes reduced-motion support and motion fallbacks: `src/agent/experience-quality.js`.
- Privacy/terms page templates exist: `public/privacy.html`, `public/terms.html`; generated-site default surfaces include privacy, terms, and contact.
- Browser-local image optimization is recorded in the unreleased changelog; verify that generated-site image pipelines invoke it rather than assuming global coverage.

### 20-point status (source inspection; not a fresh end-to-end verification)

| # | Requirement | Status | Next action |
|---:|---|---|---|
| 1 | Custom 404 page and HTTP 404 | NOT CONFIRMED | Generate branded not-found UI and test real 404 status/routing. |
| 2 | Unique meta title per page | IMPLEMENTED FOUNDATION | Assert every public generated route has a unique, non-empty title. |
| 3 | Meta description per page | IMPLEMENTED FOUNDATION | Assert route coverage, useful length, and uniqueness where appropriate. |
| 4 | Primary CTA above the fold | VERIFY | Browser-test primary CTA visibility on desktop and mobile. |
| 5 | Complete favicon/app-icon set | PARTIAL | Verify favicon, manifest icons, sizes, formats, and generated branding. |
| 6 | robots.txt | IMPLEMENTED FOUNDATION | Verify production URL, private-route exclusions, and generated sites. |
| 7 | sitemap.xml | IMPLEMENTED FOUNDATION | Verify absolute canonical URLs and only public/indexable routes. |
| 8 | Open Graph preview image | IMPLEMENTED FOUNDATION | Validate image URL, dimensions, response type, and real generated asset. |
| 9 | Alt text for meaningful images | PARTIAL | Audit all generated HTML; allow empty alt only for decorative images. |
| 10 | Responsive mobile breakpoints | PARTIAL / VERIFY | Add browser assertions at common narrow, tablet, and desktop widths. |
| 11 | Sticky mobile CTA | NOT CONFIRMED | Add optional, accessible, dismissible CTA when the page goal warrants it. |
| 12 | Loading states | CONTRACT PRESENT | Test real async flows, skeleton/progress, and duplicate-submit prevention. |
| 13 | Form errors and recovery | PARTIAL / VERIFY | Validate inline errors, accessible announcements, server errors, and retries. |
| 14 | Thank-you/confirmation page | NOT CONFIRMED | Generate post-submit confirmation route/state and prevent false success. |
| 15 | Privacy policy | TEMPLATE/SURFACE PRESENT | Personalize from actual data processing and integrations; flag legal review. |
| 16 | Terms and conditions | TEMPLATE/SURFACE PRESENT | Personalize product, payments, jurisdiction, and service terms; flag review. |
| 17 | Cookie consent/preferences | NOT CONFIRMED | Implement consent categories, persistence, withdrawal, and script gating where required. |
| 18 | Customer-site analytics | NOT CONFIRMED AS DEFAULT | Offer explicit opt-in setup, consent integration, and test event delivery. Internal product analytics is not proof of customer-site analytics. |
| 19 | Real contact address | USER INPUT REQUIRED | Ask owner; never fabricate a physical address or contact details. |
| 20 | Generated-image compression | PARTIAL / VERIFY | Invoke supported optimizer in generation/export pipeline and assert size/format budgets. |

Status meanings: IMPLEMENTED FOUNDATION means supporting code exists but every generated output still needs acceptance checks. NOT CONFIRMED means the inspected evidence did not establish an end-to-end implementation; do not represent this as proof that no related code exists anywhere. USER INPUT REQUIRED cannot be safely auto-filled.

### Required implementation order

1. **P0 — Correctness and trust:** real 404 routing, form validation/submission/error/confirmation states, accurate privacy/terms content, no fabricated contact information.
2. **P1 — Responsive conversion:** viewport-based CTA visibility, responsive overflow checks, optional sticky mobile CTA, keyboard/focus checks.
3. **P1 — Discoverability:** per-route title/description/canonical/robots/sitemap/OG validation, full favicon/manifest validation, meaningful image alt checks.
4. **P1 — Privacy-aware analytics:** customer-site analytics must be opt-in/configured, with consent and script gating appropriate to jurisdiction and vendor.
5. **P2 — Asset/performance budgets:** image compression, dimensions, lazy-loading policy, LCP/CLS/resource budgets and before/after evidence.
6. **Release enforcement:** emit a machine-readable 20-point report per generated project; block publish for critical failures; allow documented waivers only for requirements that genuinely do not apply.

### Acceptance criteria

- Each generated project receives a versioned report with PASS / FAIL / NEEDS_INPUT / NOT_APPLICABLE, evidence, route or asset, and remediation instructions for all 20 checks.
- Tests inspect generated artifacts and run HTTP/browser checks; tests must not pass merely because requirement names appear in source text.
- Public routes are checked separately from authenticated/private routes.
- Critical failures block publish. User-specific facts and credentials are requested, never invented.
- Existing architecture, provider-independent local workflows, user changes, and security gates remain intact.
- Record exact commit, commands, environment, and test counts for each real verification run. Never copy historical test counts forward as new evidence.
