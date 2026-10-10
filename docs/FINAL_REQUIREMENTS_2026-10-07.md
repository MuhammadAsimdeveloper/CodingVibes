# Build Vibe Final Requirements — Deployment Gate
Date: 2026-10-07

## Product promise

Build Vibe is a prompt-first, no-code product builder that converts natural-language requirements into portable websites, web apps, PWAs, dashboards, stores, marketplaces, SaaS products, immersive experiences, and supported mobile/desktop source targets.

The core product contract is provider-independent: generated source, deterministic templates, local preview, validation, quality audits, repair, export, and project/workspace management do not require a third-party AI/API account. Optional model providers can improve open-ended generation quality, but they are not the architectural foundation of the product.

## Final build pipeline

1. Understand — normalize the user's prompt.
2. Complete — infer missing launch-critical requirements and create a product contract.
3. Blueprint — select product genre, target(s), data/auth/payment needs, pages and capabilities.
4. Design — select a genre-specific design system, typography, motion profile, responsive rules and accessibility rules.
5. Generate — use the deterministic local generator and optional model generation when configured.
6. Experience quality — apply the dependency-free motion/accessibility baseline without overwriting custom design.
7. Product quality — score responsive behavior, accessibility, motion fallback, metadata, navigation, interaction states, launch surfaces and local portability.
8. Preview — start the product locally in an isolated runtime.
9. Verify — run source, API, browser, visual, SEO and target-specific checks.
10. Repair — automatically repair failures and repeat verification.
11. Review — reflect on quality and block unsafe/unverified releases.
12. Ship — export portable source or hand off to configured deployment infrastructure.

## Automatic completion

For short or incomplete prompts, Build Vibe must fill reasonable defaults for:
- responsive desktop/tablet/mobile layout
- semantic navigation and accessible focus states
- loading, empty, error and success states
- contact/conversion path
- privacy and terms surfaces
- metadata, canonical, sitemap and robots foundations
- owner/admin surface
- appropriate authentication/data models when the product implies them
- ecommerce cart/checkout/account surfaces when commerce is requested
- booking/calendar surfaces when appointments are requested
- pricing/signup/dashboard surfaces when SaaS/subscriptions are requested
- platform-specific navigation and safe fallback behavior

The system must not invent regulated, financial, medical, legal or security-critical claims as facts. Ambiguous business rules must remain configurable.

## Product genres

The catalog and requirement system must support, at minimum:
- marketing/landing sites
- business/local service
- agency/portfolio
- SaaS
- dashboards/admin portals
- ecommerce/commerce
- marketplace
- booking/hospitality
- real estate
- education
- events
- content/blog/CMS
- community/social
- AI/productivity interfaces
- immersive/3D experiences
- PWA/offline web
- Android
- iOS
- cross-platform mobile
- desktop

Unsupported native toolchains are never silently claimed as verified. They require runner/toolchain certification.

## Experience quality

Every generated web product should have:
- intentional hierarchy
- responsive layout
- strong typography
- useful visual assets or generated/local placeholders
- hover/focus/pressed/loading/error states
- reduced-motion support
- motion that supports storytelling rather than distracting from content
- lazy/conditional advanced effects
- WebGL fallback for immersive experiences
- no single animation or remote asset required for core usability

## Multi-window Studio

The Studio supports multiple project windows/tabs from one account. Each window is associated with an independent project/session, can be switched without losing project state, and shows its latest build status.

Background builds remain tied to their project/run. Opening another project does not cancel an existing run.

## No external-provider dependency

The core local product must work without:
- OpenAI API
- Anthropic API
- Gemini API
- external design SaaS
- external hosting provider
- external database provider

Optional integrations remain adapters. The generated web product should prefer local assets/runtime and must fail gracefully when optional external services are unavailable.

Important distinction: truly open-ended natural-language AI generation inherently requires an inference engine somewhere. Build Vibe's provider-independent contract means the product has a deterministic/local generation path and does not require a specific commercial provider to run its core builder, preview, verification, quality and export lifecycle.

## Final deployment requirements

Application-side source is ready for deployment when the merged main CI is green.

Production still requires environment-specific certification:
- isolated runner/toolchains for native targets
- production database and migrations
- object storage and backups
- TLS/domain/proxy
- secure secret management
- worker/queue capacity
- monitoring and alerting
- email/payment credentials if those features are enabled
- optional AI/model credentials if open-ended model generation is enabled
- real device/simulator certification for Android/iOS/desktop targets

These are deployment infrastructure requirements, not product-feature gaps.

## Release gate

Do not mark a target "verified" unless its actual required toolchain has run successfully. Do not claim external integrations are live without credentials and a real integration test.

The deployment phase starts only after:
- Build Vibe CI green
- CodeQL green
- Dependency Review green
- browser E2E green
- coverage gate green
- security preflight green
- launch/readiness checks green
- benchmark green
- deployment preflight green
- final main commit verified

## Competitive design objective

Build Vibe should outperform competitors through the combination of:
- prompt-to-product simplicity
- direct visual refinement
- reusable design/motion systems
- multi-project workspace
- deterministic quality compiler
- automatic requirement completion
- browser/visual verification
- repair loops
- portable source
- provider-neutral core architecture

Do not copy competitor branding, proprietary code, or proprietary assets.


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


## Additional generated-site acceptance requirements (2026-10-10)

The 20-point website launch checklist is now tracked in [`GENERATED_WEBSITE_QUALITY_GATE.md`](GENERATED_WEBSITE_QUALITY_GATE.md). Treat it as a per-generated-project acceptance contract, not as a claim that every item is already implemented. Every check must return PASS, FAIL, NEEDS_INPUT, or NOT_APPLICABLE with evidence. Verify actual HTTP status and browser behavior, including responsive CTA placement, form validation/error/success, privacy-aware analytics, image alt text and asset budgets. Never invent contact details or assert customer analytics without configuration and event-delivery evidence. Critical failures block publish.
