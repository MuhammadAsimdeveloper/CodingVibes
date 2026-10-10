# Build Vibe competitive positioning

**Snapshot date: October 4, 2026**

Build Vibe should position itself as the **verified, portable AI product builder**: prompt-first generation plus source inspection, bounded repair, browser/runtime evidence and target-aware native verification. The goal is to compete on trustworthy shipping rather than copy another builder's interface or proprietary implementation.

| Product | Current public positioning | Current price reference | Strength to beat/learn from | Build Vibe response |
|---|---|---:|---|---|
| Build Vibe | Verified websites, web apps and supported mobile/native targets | Free / $7 Pro / $15 Team | Verification evidence, portable output, isolated/native target contracts | Keep verification as the headline differentiator |
| Lovable | Prompt-to-product with Cloud, AI, collaboration and hosted workflows | Free / $25 Pro / $50 Business | Full-stack product loop, roles/permissions, design systems, built-in cloud | Add stronger collaboration, social auth and first-party hosted services |
| Bolt | Prompt-to-live websites/apps with hosting and built-in services | Free / $25 Pro / $30 Teams | Very fast prompt-to-live loop, hosting, database, custom domain, team controls | Reduce friction between verified output and live deployment |
| Replit Agent | Agentic app building with web search, database, auth, testing and deployment | $20 Core / $100 Pro | Web-aware agent, collaboration, parallel agents, built-in services | Add web research/context tools and richer collaboration |
| v0 | Design-to-app workflow with visual Design Mode, GitHub sync and Vercel deployment | Free / $30 Plus / $100 Business | Visual refinement, GitHub/Vercel workflow and team sharing | Make visual refinement first-class while preserving portable source |
| Webflow | AI-native visual site building, CMS, SEO/AEO and collaboration/governance | Free / $15 Basic / $25 Premium; Team is enterprise-style | Mature visual editing, CMS, publishing and governance | Deepen visual editor, CMS, approvals and SEO/AEO automation |

## Competitive advantages to preserve

1. **Verified software instead of unverified code.** A changeset is not committable until the configured verification contract passes.
2. **Portable artifacts.** GitHub, ZIP/manual export, Vercel, Netlify and Cloudflare adapters prevent vendor lock-in.
3. **Honest native support.** Android/Flutter/Rust/macOS runner contracts distinguish source generation from actual binary verification.
4. **Broad product model.** Sites, SaaS, commerce, CMS, backend routes, AI features, 3D, PWA and mobile/native target profiles are represented in one contract.

## Gaps that matter after core launch

- Social login and account recovery for the Build Vibe control plane.
- First-party hosting/runtime so users can go from verified artifact to live URL without a third-party handoff.
- Collaboration: shared workspaces, roles, approvals and organization-level governance.
- Web research/search tooling inside the agent for current product/domain requirements.
- Managed Postgres/object storage/job queues before horizontal scaling.
- Cloud native build/signing capacity for Android/iOS app-store artifacts.

## Pricing strategy

The current $7 Pro / $15 Team prices are a strong acquisition position against the higher published entry points of several competitors, but they should be treated as introductory economics until actual model, runner, storage and support costs are measured. Team should eventually gain meaningful collaboration/governance value instead of being only a larger quota bucket.

## Sources

- https://lovable.dev/pricing
- https://lovable.dev/blog/simplifying-billing
- https://bolt.new/pricing
- https://bolt.new/use-cases/ai-app-builder
- https://replit.com/pricing
- https://replit.com/products/agent
- https://api2.v0.dev/pricing
- https://webflow.com/pricing
- https://help.webflow.com/hc/en-us/articles/38840145286035-Build-a-site-with-Webflow-s-AI-site-builder


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
