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

## Addendum — visual quality and immersive experience

The subsequent visual/product initiative is defined in [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md). The original dated requirements remain a historical snapshot; this addendum extends, and does not silently replace, those requirements. Any new animation/3D capability must include user-facing purpose, responsive behavior, accessible controls, reduced-motion support, graceful fallback and test evidence.
