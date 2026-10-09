# Build Vibe — Complete Launch & Future Development Plan

> Master implementation contract for Codex / GitHub Copilot.
> Baseline: Build Vibe 12.2.0 audit, October 2026.
> Goal: complete the product into a verified, secure, portable, production-launch-ready AI product builder without destroying working architecture.

## 1. Non-negotiable engineering rules

1. Do NOT rewrite Build Vibe from scratch.
2. Inspect the repository, current branch, git status, package.json, source, tests, workflows, and docs before modifying anything.
3. Work incrementally on a dedicated branch such as `codex/launch-complete-13`.
4. Preserve working architecture, public APIs, security boundaries, verification contracts, target registry, provider adapters, deployment adapters, and tests.
5. Never delete functionality merely to make tests pass.
6. Never weaken, skip, disable, bypass, or mock away security or verification gates.
7. Never claim a platform is production-ready unless its artifact and runner verification actually exists.
8. When an external service is unavailable, expose a clean adapter boundary and explicit NOT_CONFIGURED/BLOCKED state rather than fake success.
9. Use small checkpoints and run tests after every major phase.
10. Keep changes backward compatible or provide migrations.
11. Never overwrite user work without an explicit safe operation.

## 2. Immediate baseline and known failures

Before coding, run:

```bash
git status --short
git branch --show-current
git log -5 --oneline
node --version
npm --version
npm install
npm test
npm run check
npm run security:check
npm run scaleout:doctor
npm run launch:check
npm run final:check
```

The previous audit identified two concrete PR regressions that must be fixed correctly:
- syntax error in `test/launch-readiness.test.js`;
- release identity mismatch between 12.2.0 and 12.3.0.

Do not remove assertions or downgrade checks to make them pass.

## 3. Release hygiene and reproducibility

Implement:
- canonical version source, preferably `src/version.js`;
- one consistent release identity across package.json, README, checks, API metadata and release artifacts;
- committed `package-lock.json`;
- `.nvmrc` or `.node-version`;
- `LICENSE`;
- `CHANGELOG.md`;
- `CODE_OF_CONDUCT.md`;
- `openapi.yaml`;
- migration/versioning documentation;
- coverage configuration with an enforced meaningful minimum.

CI must use `npm ci` after the lockfile is created.

## 4. CI and supply-chain security

Add:
- GitHub CodeQL workflow;
- dependency-review workflow;
- dependency update automation;
- secret-scanning guidance;
- secure environment handling;
- release provenance containing version, commit SHA, timestamp, target and verification results.

Security-critical failures must fail closed.

## 5. Real multi-agent build pipeline

Upgrade the current partial parallel-agent design into a bounded real pipeline with these roles:

1. Research Agent — sources, requirements evidence, competition, risks.
2. Requirements/Product Agent — acceptance criteria and AppSpec.
3. UX/Design Agent — information architecture, responsive design, accessibility and visual targets.
4. Architecture Agent — stack, modules, APIs, data/security boundaries.
5. Implementation Agent — bounded source generation/editing.
6. Security Agent — threat model and generated-code security.
7. Test Agent — unit/integration/API/E2E/regression tests.
8. Browser QA Agent — Playwright, screenshots, console/network/runtime checks.
9. Code Review Agent — requirements/security/diff review.
10. Release Agent — versioning, migrations, artifacts, docs, rollback.
11. Deployment Agent — target-aware deployment preparation/execution.

Requirements:
- bounded concurrency;
- timeouts;
- cancellation;
- retry limits;
- token/cost budgets;
- provenance;
- explicit agent handoffs;
- no infinite loops;
- deterministic fallback when an agent/provider is unavailable.

## 6. Research and grounding

Create a first-class research provider interface.

Support:
- configured web research through the existing API boundary;
- source URL/title/publisher;
- retrieval timestamp;
- freshness;
- relevance/confidence;
- caching and deduplication;
- domain allow/deny lists;
- prompt-injection defenses for untrusted web content;
- visible research provenance.

Never pretend research succeeded when the provider failed.

## 7. AI routing and cost controls

Preserve:
- OpenAI-compatible providers;
- Anthropic;
- OpenRouter;
- Ollama;
- LM Studio.

Improve:
- task-aware routing;
- provider health;
- latency/cost/context-size routing;
- fallback chains;
- cooldowns;
- token/cost tracking;
- per-project/run/agent budgets;
- hard limits;
- model provenance;
- runaway-loop protection.

## 8. Generation and repair contract

Preserve the existing AppSpec/spec.v3, bounded operations, safe paths, checkpoints and worktrees.

Add:
- stronger AppSpec coverage for SEO, accessibility, analytics, content, integrations, auth, billing, deployment and observability;
- dependency allow/deny policies;
- generated-file validation;
- dangerous command/credential/path traversal detection;
- provenance and changed-file summaries.

Keep the repair loop bounded. Do not weaken tests or verification during repair.

## 9. Verification and browser QA

Verification must cover where applicable:
- syntax/static checks;
- unit tests;
- integration tests;
- API tests;
- browser E2E;
- visual regression;
- accessibility;
- SEO;
- performance;
- target-specific verification;
- deployment smoke tests.

Playwright must detect:
- console errors;
- failed requests;
- 4xx/5xx responses;
- runtime exceptions;
- broken routes;
- screenshots;
- DOM snapshots;
- visual diffs.

Add responsive viewport coverage and accessibility checks.

## 10. Visual editor / design mode

Close the visual-editing gap without replacing the generator.

Implement:
- visual canvas/page mode;
- element selection;
- text/typography/spacing/color/radius/layout editing;
- component tree/layers;
- design tokens/themes;
- responsive breakpoint previews;
- comments/annotations;
- undo/redo;
- version history;
- source synchronization;
- safe screenshot-to-structure workflow where reliable.

Visual edits must not silently break source contracts.

## 11. Complete SEO engine

Create a centralized route-level SEO model.

Every public route should support:
- title;
- meta description;
- canonical;
- robots directives;
- Open Graph;
- Twitter/X cards;
- favicon/app icons;
- web manifest;
- language/hreflang where applicable;
- author/publisher/date;
- indexability controls;
- XML sitemap;
- robots.txt;
- sitemap partitioning;
- duplicate title/meta detection;
- canonical conflict detection;
- redirect checks;
- orphan-page detection;
- broken internal-link detection;
- heading hierarchy;
- image alt/dimensions/lazy loading;
- social preview generation;
- SEO health score.

Private, duplicate, staging, utility and thin routes must be able to opt out of indexing.

## 12. Structured data / JSON-LD

Generate schema only when the visible page genuinely qualifies.

Support appropriate schemas including:
- Organization;
- WebSite;
- WebPage;
- BreadcrumbList;
- Article/BlogPosting;
- Product/Offer/AggregateOffer;
- Review;
- Event;
- LocalBusiness;
- SoftwareApplication;
- JobPosting;
- Course;
- VideoObject;
- ProfilePage;
- Q&A where qualifying;
- Recipe where qualifying;
- Dataset where qualifying;
- DiscussionForumPosting where qualifying.

Validate syntax, required fields, consistency with visible content and route context.

Never imply that structured data guarantees rich results.

## 13. Search / AEO / GEO / AI discoverability

Implement useful, non-spam discoverability:
- answer-ready summaries;
- clear headings;
- entity-consistent Organization/Product/Author information;
- useful FAQ content where appropriate;
- topic clusters;
- contextual internal links;
- author/source attribution;
- freshness signals;
- public documentation/knowledge pages;
- discoverability audit covering search, answer engines, AI search and multimodal search.

Do NOT build around unsupported ranking claims or mass thin pages.

## 14. Search engine integrations

Add adapter boundaries for:
- Google Search Console;
- Bing Webmaster;
- IndexNow.

Record submission status, timestamps, response codes and errors.

Never claim indexing occurred merely because a URL was submitted.

## 15. Performance

Add automated performance checks covering:
- loading;
- responsiveness;
- layout stability;
- transfer size;
- image weight;
- JavaScript weight;
- critical resources;
- mobile performance;
- asset budgets;
- blocking resources;
- intrusive UI detection where practical.

Produce a performance report per build.

## 16. CMS/content/publishing

Implement or complete:
- content types;
- draft/review/publish workflow;
- scheduled publishing;
- authors;
- categories/tags where appropriate;
- revisions;
- SEO fields;
- media metadata and alt text;
- canonical URLs;
- redirects;
- previews;
- safe bulk operations.

## 17. First-party cloud services

Complete the existing service boundary for:
- Postgres;
- Redis/cache/queue;
- S3/object storage;
- authentication/session;
- email;
- payments;
- search;
- analytics;
- workers/outbox;
- health/readiness;
- graceful shutdown;
- backups/restore;
- migrations;
- tenant isolation;
- quotas.

Every adapter needs validation, timeouts, retries and explicit NOT_CONFIGURED behavior.

## 18. Scaleout and operations

Implement:
- worker health;
- queue depth;
- job latency;
- concurrency limits;
- idempotency;
- dead-letter handling;
- retry with jitter;
- structured logs;
- metrics;
- alerts;
- backup verification;
- restore drills;
- controlled load tests at 10/25/50 concurrent jobs.

Document what is actually tested versus only architecturally supported.

## 19. Auth, tenancy and collaboration

Preserve tenant isolation and add/complete:
- RBAC;
- audit logs;
- comments/review threads;
- branch-aware collaboration;
- activity timeline;
- organization settings;
- SSO/SAML/OIDC adapter boundary;
- model/deployment/integration/domain policies.

Prevent cross-tenant leakage through caches, workers, logs, indexes or artifacts.

## 20. Project memory and Git

Persist project-scoped:
- architecture decisions;
- accepted requirements;
- design tokens;
- integration references;
- verification history.

Keep memory isolated by project/workspace.

Preserve:
- GitHub integration;
- branch state;
- checkpoints;
- rollback;
- release tags;
- changed-file review.

## 21. Deployment

Preserve existing deployment paths:
- GitHub;
- Vercel;
- Netlify;
- Cloudflare Pages;
- Hostinger handoff;
- Build Vibe Cloud;
- manual ZIP.

Add:
- deployment preflight;
- env/secret validation;
- domain/canonical validation;
- HTTPS/proxy validation;
- artifact integrity;
- post-deployment smoke tests;
- rollback;
- provenance.

Never call a handoff package a successful deployment.

## 22. Billing and quotas

Track and limit:
- builds;
- agent runs;
- model usage;
- storage;
- deployments;
- other billable resources.

Add tenant quotas, usage reporting, hard safety limits and payment adapter boundaries.

## 23. Integrations/connectors

Use a consistent adapter contract.

Every connector should have:
- credential validation;
- least-privilege scopes;
- health check;
- disconnect/revoke;
- webhook signature validation;
- retries;
- idempotency;
- SSRF protection;
- fixtures/mocks.

## 24. Native/mobile targets

Keep the target registry authoritative.

Do not claim Android/iOS/Flutter/React Native/Electron/Tauri/KMP production-ready without actual target-specific artifacts and verification.

Add:
- runner capability detection;
- native runner certification matrix;
- artifact checksums/provenance;
- install/build/smoke verification;
- explicit BLOCKED/NOT_CONFIGURED states.

## 25. Benchmark/evaluation system

Create a benchmark corpus of at least 50 scenarios covering:
- landing pages;
- SaaS;
- CRUD;
- commerce;
- CMS/blog;
- booking;
- AI apps;
- dashboards;
- PWA;
- Android/iOS;
- desktop;
- 3D;
- existing-repository migration;
- malicious repository;
- broken generated app;
- provider outage;
- research-heavy builds;
- large repositories;
- concurrent jobs;
- security-sensitive applications;
- SEO-heavy sites.

For each scenario record:
- prompt;
- expected capabilities;
- build duration;
- verification;
- repair cycles;
- token/cost;
- defects;
- security findings;
- target artifact status;
- final score.

## 26. Competitive benchmark

Benchmark Build Vibe against Lovable, Bolt, Replit Agent, v0, Figma Make and Cursor Agent across:
- prompt-to-full-stack;
- verification/repair;
- browser/visual QA;
- native/mobile breadth;
- deployment portability;
- model freedom;
- visual editing;
- collaboration;
- research/grounding;
- browser IDE/cloud development;
- production-service ecosystem.

Use this for product prioritization, not for copying code or branding.

## 27. MiroFish adapter

Add:
- `src/integrations/mirofish.js`;
- `docs/MIROFISH.md`;
- `test/mirofish-adapter.test.js`.

Define an adapter for:
- scenario generation;
- simulation/evaluation;
- result ingestion;
- score normalization.

MiroFish must be optional and non-blocking when not configured. Never claim a real simulation ran when unavailable. A local deterministic fallback may exist only for contract tests and must be labeled non-MiroFish.

## 28. Security hardening

Threat-model:
- generated apps;
- control plane;
- imported repositories;
- plugins/connectors;
- web research.

Harden:
- path traversal;
- command injection;
- SSRF;
- XSS;
- CSRF;
- prototype pollution;
- unsafe deserialization;
- secret leakage;
- dependency attacks;
- prompt injection;
- tenant isolation.

Use sandboxing, resource limits, network restrictions, timeouts, cleanup, secure cookies, OAuth validation, webhook verification, rate limits and privacy-safe security logs.

## 29. Observability and analytics

Add:
- structured logs;
- request/build/job IDs;
- build duration metrics;
- queue metrics;
- agent latency;
- model usage;
- repair cycles;
- verification failures;
- deployment outcomes;
- provider health;
- health/readiness/liveness;
- error aggregation boundary;
- retention controls.

Product analytics should track useful funnel events without collecting secrets or raw private source code.

Add feature flags with safe defaults.

## 30. Public product / SEO website

Create or improve:
- landing page;
- capability pages;
- use-case pages with unique useful content;
- documentation;
- security/trust page;
- deployment/provider pages;
- platform/target pages;
- changelog;
- pricing if billing is enabled.

All public routes need correct metadata, canonical, social preview, structured data where appropriate, sitemap inclusion and indexability.

## 31. Accessibility

Target WCAG 2.2 AA where practical:
- keyboard navigation;
- focus states;
- accessible labels;
- semantic landmarks;
- form errors;
- contrast;
- reduced motion;
- screen-reader status;
- touch target sizes.

Use automated plus manual critical-flow checks.

## 32. Documentation to add/update

Required:
- `docs/BUILD_VIBE_LAUNCH_PLAN.md` (this file);
- `docs/IMPLEMENTATION_BASELINE.md`;
- `docs/LAUNCH_AUDIT_FINAL.md`;
- `docs/OPERATIONS.md`;
- `docs/ROLLBACK.md`;
- `docs/MULTI_AGENT.md`;
- `docs/BENCHMARKS.md`;
- `docs/MIROFISH.md`;
- existing `docs/SEO.md` must be updated rather than duplicated;
- target/deployment/security/scaleout docs must reflect actual implementation.

Create:
`artifacts/release-readiness.json`

## 33. Recommended implementation order

### Phase 0 — Protect and baseline
Branch, inspect, baseline tests, preserve user changes.

### Phase 1 — Release hygiene
Version source, lockfile, Node pin, license/docs, CI fixes, CodeQL/dependency review.

### Phase 2 — Agent completion
Real multi-agent execution, research, provenance, budgets.

### Phase 3 — Verification
Browser QA, accessibility, visual regression, repair evidence, launch gates.

### Phase 4 — SEO/AEO/GEO
Central SEO model, metadata, JSON-LD, sitemap/robots, internal linking, discoverability, Search Console/Bing/IndexNow adapters.

### Phase 5 — Product depth
Visual editor, CMS/content, project memory, collaboration, analytics, feature flags.

### Phase 6 — Cloud/operations
DB/storage/queue, workers, observability, backups, restore, quotas, load testing.

### Phase 7 — Native/deployment
Runners, artifact attestation, deployment preflight, smoke tests, rollback.

### Phase 8 — Evaluation
50+ benchmark scenarios, competitor benchmark, MiroFish adapter, resilience/security scenarios.

### Phase 9 — Final release
Full test matrix, documentation, release artifact, launch decision, tag/release.

## 34. Checkpoint policy

Use small meaningful commits such as:
- baseline;
- release-hygiene;
- CI-security;
- multi-agent;
- verification;
- SEO;
- visual-editor;
- cloud-ops;
- native-deployment;
- benchmark;
- final-release.

Never force-push over user work. Never merge unverified changes.

## 35. Final launch gates

Before declaring launch-ready:
- `npm ci` succeeds;
- `npm test` passes;
- `npm run check` passes;
- `npm run security:check` passes;
- `npm run scaleout:doctor` passes or clearly documents optional infrastructure;
- `npm run launch:check` passes;
- `npm run final:check` passes;
- no release mismatch;
- no syntax errors;
- no missing required imports;
- security CI is configured;
- lockfile is committed;
- SEO audit passes;
- accessibility audit passes;
- browser smoke tests pass;
- visual verification passes where applicable;
- deployment preflight passes for configured targets;
- backup/restore is documented/tested where production infrastructure exists;
- rollback is documented;
- benchmark suite runs;
- MiroFish is either actually configured/tested or explicitly NOT_CONFIGURED.

## 36. Final audit artifacts

Create `docs/LAUNCH_AUDIT_FINAL.md` with:
- exact release/version/SHA;
- implemented features;
- files added/changed;
- test results;
- security results;
- SEO results;
- accessibility results;
- browser/visual results;
- benchmark results;
- native results;
- deployment results;
- load-test results;
- MiroFish status;
- known limitations;
- environment requirements;
- rollback plan;
- final PASS/BLOCKED/NOT_CONFIGURED matrix.

Create `artifacts/release-readiness.json` with machine-readable:
- version;
- commit SHA;
- timestamp;
- gate status;
- test counts;
- target status;
- security status;
- SEO status;
- benchmark score;
- deployment status;
- blockers.

## 37. Final principle

The objective is NOT to make the repository look complete.

The objective is to make Build Vibe a genuinely verified, secure, portable AI product builder that can be launched honestly.

Do not rewrite Build Vibe. Complete Build Vibe.


## 38. Zee-Inspired Tool Ecosystem Expansion — October 2026

### Purpose
Build the high-value utility layer inspired by the capabilities observed in Zee AI Tools, without copying its branding, code, content, or unverifiable claims. The goal is to make Build Vibe a focused developer/web-production toolbox and expose the same capabilities through Aira as a governed tool router.

### Canonical Build Vibe tools
1. SEO Meta Generator
2. XML Sitemap Generator
3. robots.txt Generator
4. Favicon/App Icon Generator
5. Open Graph/Social Preview Generator
6. Website SEO Auditor
7. Website Performance Auditor
8. Accessibility Auditor
9. Image Optimizer/Compressor
10. JSON Formatter/Validator
11. JSON → TypeScript Generator
12. API Tester
13. Regex Tester
14. JWT Inspector
15. Base64/Binary Encoder/Decoder
16. Color Palette Generator
17. CSS Gradient Generator
18. QR Code Generator

### Ecosystem ownership
- **Build Vibe/CodingVibes:** canonical implementation for all 18 shared web/developer tools.
- **Aira:** universal interaction/orchestration layer; expose all 18 through named, auditable tools and route to canonical implementations instead of duplicating business logic.
- **Atlas:** consume SEO, metadata, performance, accessibility, QR and API-testing capabilities for business/web workflows; do not fork the canonical implementations.
- **Auto-Vid/Auto-Vid-App:** consume image optimization and social/asset preparation capabilities.
- **Muhammad-Asim-Web-Agency:** consume SEO, metadata, sitemap/robots, OG, performance, accessibility, image and QR capabilities for agency-site operations.
- **Asim-OS:** optional local/offline adapters for developer/image/QR utilities where OS integration is useful.
- **Pithcraft-Ai/Saudadesk-Ai:** remain product-specific unless a direct product requirement justifies a capability.

### Native-product rule
These are not Zee clones. Build Vibe tools must understand generated projects: audits inspect actual routes/assets, metadata tools can write artifacts, performance/accessibility tools produce actionable findings, and developer tools integrate with project files/contracts where appropriate.

### Aira contract
Every tool must declare: canonical ID, aliases, owner, input/output schema, risk class, local/offline status, network requirement, confirmation requirement, auth requirement, timeout/retry policy, audit event and fallback behavior. Aira must never claim an external action succeeded when only a local analysis/artifact was produced.

### Implementation phases
- **T0 Contracts:** tool IDs, schemas, ownership, Aira routing metadata, tests.
- **T1 Developer utilities:** JSON, JSON→TypeScript, Regex, JWT, Base64/Binary, Color Palette, CSS Gradient, QR.
- **T2 Website foundation:** metadata, robots, sitemap, favicon, OG/social preview.
- **T3 Website audits:** SEO, accessibility, performance.
- **T4 Asset pipeline:** image optimization/compression and project asset integration.
- **T5 Cross-product integration:** Aira, Atlas, Auto-Vid, agency and Asim-OS adapters.

### Security and privacy
Prefer client-side processing for private inputs. Explicitly label server/API boundaries. API testing must protect secrets and block unsafe SSRF targets. JWT tools must not imply that decoding equals signature verification. Website content fetched for audits is untrusted input.

### Quality gates
Every behavioral change follows test-first development. Browser tools require runtime verification for console errors, failed requests, accessibility and responsive behavior. External services use explicit NOT_CONFIGURED/BLOCKED states instead of fake success.

### Completion criteria
All 18 tools have contracts, tests, canonical Build Vibe implementations, Aira routing metadata and cross-repository ownership documentation. No duplicate business logic is introduced without a documented reason.


## 39. Industry Tool Arsenal Expansion — Teamily-derived capabilities

The 18 Zee-derived utilities remain the immediate utility-suite scope. The next strategic layer is the shared Tool/Agent Fabric derived from capabilities publicly described by Teamily AI: multi-agent orchestration, living/global memory, proactive agents, collaborative studios, scheduled automations, Agent APIs, MCP/REST, OAuth, Slack, agent workspaces, deliverables and human approval workflows. citeturn0search0turn0search4turn0search5

### Build Vibe owns
- web.app.builder
- docs.studio
- slides.studio
- dashboard.studio
- research.studio
- code.reviewer
- code.explainer
- code.refactorer
- test.generator
- bug.triage
- pr.assistant
- api.builder
- schema.generator
- deployment.doctor
- dependency.audit
- secret.audit
- sandbox.runner
- deliverable.bundle

### Shared through Aira
- agent.task.decomposer
- agent.parallel.runner
- agent.supervisor
- memory.global/project/preference
- context.policy
- automation scheduler/trigger/history
- agent creator/team creator
- MCP/OAuth/integration gateway
- permission/risk/confirmation/audit engines
- provider router, quota manager and health doctor

### Build order
T6 Tool/Agent Fabric contracts → T7 multi-agent orchestration → T8 memory/context → T9 studios/deliverables → T10 developer intelligence → T11 integrations/API/MCP → T12 proactive automation and approval controls.

### Scope rule
Tools are strategic weapons, but the platform must remain coherent. Each capability needs a canonical owner, contract, tests, security policy and measurable user value before being shipped. Do not inflate tool count merely for marketing.


## 40. AI-First Cross-Repository Execution Protocol — October 2026

This section is the handoff contract for any AI coding agent starting from this repository.

### Read order
1. `docs/AI_BUILD_START_HERE.md`
2. This launch plan from beginning to end.
3. `docs/ZEE_TOOLS_ECOSYSTEM_PLAN.md`
4. `docs/INDUSTRY_TOOL_ARSENAL.md`
5. Relevant source/tests/docs discovered during repository inspection.

### Cross-repository product map
- **Build Vibe/CodingVibes:** canonical creation, web/developer, verification and shared utility implementations.
- **Aira:** universal personal-agent orchestration, permissions, memory/context, device control and routing.
- **Atlas:** business operating system and tenant-scoped business actions.
- **Auto-Vid / Auto-Vid-App:** media production and media application surfaces.
- **Muhammad-Asim-Web-Agency:** agency delivery, audits and deploy-ready workflows.
- **Asim-OS:** local/offline workstation adapters.
- **Saudadesk-Ai:** product-specific capabilities only.

### Build rule
When a capability already has a canonical owner, consume its contract instead of cloning the implementation. If a repository needs a local adapter, document the runtime reason and keep the contract compatible.

### Autonomous implementation loop
**READ → INSPECT → PLAN → TEST → IMPLEMENT → VERIFY → DOCUMENT → CHECKPOINT**

Before every behavior change:
- inspect current implementation and neighboring tests;
- write the failing test first;
- implement the smallest correct change;
- run focused tests;
- refactor only after green;
- run the relevant full suite;
- update the plan/checklist and record blockers honestly.

### Tool/agent priorities
1. Shared Tool/Agent Fabric and contracts.
2. 18 Zee-inspired utilities.
3. Teamily-derived primitives: multi-agent teams, decomposition, supervisor, memory/context, proactive automation, studios, approvals, Agent API and MCP/OAuth.
4. Developer intelligence and verification.
5. SEO/AEO/GEO and public distribution.
6. Cloud/operations/deployment/native targets.
7. Benchmarks, security and release evidence.

### Truth boundary
No AI agent may mark a feature COMPLETE merely because code, UI or configuration exists. COMPLETE requires implementation, tests, security checks and appropriate runtime/evidence verification. External dependencies remain **NOT_CONFIGURED**, **BLOCKED**, or **UNVERIFIED** until actually proven.

### No greenfield drift
Do not rewrite working architecture to fit a new idea. Extend existing registries, contracts, adapters, stores, workers and verification paths. Prefer one canonical implementation plus thin adapters over parallel copies.

### Final handoff
At the end of each phase update:
- this plan/checklist;
- the relevant tool/architecture docs;
- changelog/release notes when applicable;
- machine-readable readiness evidence when the repository supports it.

Then leave a concise implementation summary containing changed files, tests run, verification evidence and remaining blockers.


## 41. Free Tool + Browser Agent Expansion — October 2026

Read `docs/FREE_TOOL_ECOSYSTEM_RESEARCH.md` before implementing the expanded tool catalog.

The utility strategy is now:
1. **P0 Tool Fabric:** contracts, metadata, permissions, privacy mode, local/network execution, composition, audit and verification.
2. **P1 Local utility suite:** PDF/document, image, text, encoding, data conversion, security and calculators.
3. **P2 Web/SEO suite:** metadata, OG, robots, sitemap, schema, headers, links, Lighthouse-backed audits and web manifest.
4. **P3 Browser agent suite:** isolated browser sessions and observe → act → verify workflows with authentication handoff, recording/replay and durable state.
5. **P4 Distribution:** indexable tool pages, search, related tools, favorites/history, tool packs, MCP/API exposure and reliability benchmarks.

### Implementation rule

Do not add hundreds of shallow tools just to match directory counts. Each canonical capability must have a distinct task, contract, tests, privacy/security classification, documentation and verification evidence.

Prefer official APIs over browser automation. Browser automation is a governed fallback for legitimate user-authorized workflows. Never implement arbitrary authentication/CAPTCHA/access-control bypass.

### Competitive lesson

Free-tool directories demonstrate distribution power: individual task pages + category hubs + instant browser execution. Open/client-side tool ecosystems demonstrate privacy and low infrastructure cost. Browser-agent infrastructure demonstrates that the next step is allowing agents to operate these capabilities and external websites, not merely presenting a catalog.

Build Vibe should combine these into a **searchable, composable, agent-callable Tool Fabric** rather than a static collection.


## 39. Creative 3D Web Stack Research — PeachWeb, Threlte, Theatre.js, Spline (2026-10-09)

### Purpose and non-destructive rule
This addendum extends the existing roadmap; it does not replace prior phases, features, commitments, or launch gates. Use the current design system, AppSpec, project generator, 3D runtime, motion engine, media/content model, verification runner and target registry as the canonical implementation. Do not create a second editor/runtime merely to imitate a competitor.

### Research-backed capability map
- **PeachWeb** — visual no-code/low-code WebGL/Three.js builder; drag-and-drop 3D scene editor, keyframe animation, custom interactions, responsive UI/layout and scroll effects, embedding/export, publishing/CDN and marketplace. Its feature page labels the node editor for custom interactions/shaders as “coming soon”; treat it as a direction, not an assumed available feature. Source: https://peachweb.io/features
- **Threlte** — open-source, MIT-licensed Svelte integration for Three.js. Declarative/type-safe/reactive scene construction, component-level interaction/events, extras/plugins, GLTF-to-component tooling, Rapier physics, Theatre.js integration and XR support. It is a developer framework, not a turnkey no-code product builder. Sources: https://threlte.xyz/ and https://github.com/threlte/threlte
- **Theatre.js** — web animation and motion-design toolkit with sequence editor, dope sheet, graph editor/easing presets, property editing and extensions; integrates with Three.js, React Three Fiber, HTML/CSS/SVG and custom JavaScript/WebGPU stacks. Best as an optional authored-timeline engine, not the whole 3D stack. Source: https://www.theatrejs.com/
- **Spline** — closest end-user workflow benchmark: browser-based collaborative 2D/3D design, real-time editing, modeling/materials/lights/cameras, animation, particles/physics, states/events/game controls, AI scene/object/material generation, text/image-to-3D, textures, web embedding and platform exports. Its AI agent operates on editable scene objects and preserves undo/collaboration. AI features are credit-metered by plan; generated detailed meshes can affect runtime performance. Sources: https://docs.spline.design/basics/what-is-spline, https://docs.spline.design/, https://spline.design/solutions/ai-3d-generation

### Product fit ranking for Build Vibe
1. **Spline — best product/workflow benchmark** for the user's goal: natural-language 3D creation/editing, a visual scene editor, asset generation, interactivity, collaboration and publishing. Adopt original equivalents where they fit the roadmap; do not copy proprietary code, UI assets or branding.
2. **PeachWeb — best reference for a streamlined no-code 3D website workflow**: scene assembly, responsive DOM overlays, scroll-linked effects, embed/publish handoff and optimization feedback.
3. **Threlte — best optional implementation technology when the generated target is Svelte** and deeper typed, reactive 3D components or Rapier/XR features are needed. It is not the default for vanilla HTML projects.
4. **Theatre.js — best specialized animation authoring layer** for timeline-based camera/object/property animation. Integrate only if an authored timeline/graph editor is needed and its serialization/runtime compatibility is proven.

These rankings measure relevance to Build Vibe's product direction, not an absolute quality or performance benchmark.

### Add to the existing plan: incremental implementation stages
**Stage A — 3D AppSpec and asset contract**
- Extend existing AppSpec/requirements with typed scene objects, GLTF/GLB assets, image textures, video media, materials, lights, camera, interaction triggers, scroll scenes, animation timelines, responsive breakpoints, physics/XR intent and publishing target.
- Validate asset type, size, provenance, licensing metadata, texture dimensions, model complexity and safe URL policy. Persist durable assets only through the existing authorized asset/storage pipeline; local previews must remain clearly local-only.
- Acceptance: schema/round-trip tests, malformed input tests, tenant ownership tests, and a deterministic non-WebGL fallback.

**Stage B — prompt-to-scene and text-based iterative editing**
- Translate requests such as “make the product metallic blue, rotate on hover, zoom on scroll, add my video” into explicit, typed, reviewable scene operations. Preserve scene IDs and unrelated edits. Use allowlists; never evaluate arbitrary user JavaScript or shader code in the control plane.
- Support preview/diff, undo/redo, edit history, regeneration of only the targeted scene/property, and clear unsupported-operation responses.
- Acceptance: deterministic intent fixtures, negative/security tests, persisted project-scoped scene history, and end-to-end edit/reload tests.

**Stage C — visual scene editor**
- Add scene hierarchy/layers, select/move/rotate/scale, camera/light/material controls, asset panel, viewport, properties inspector, responsive preview, and accessible non-canvas controls.
- Keep UI state and scene document separate; serialize through a versioned scene format. Do not make an image-only mockup the implementation.
- Acceptance: keyboard operation, touch/mobile behavior, save/reload, version migration, and Playwright tests for core edit flows.

**Stage D — timeline and event graph**
- First build a small native timeline contract for keyframes, easing, camera paths, scroll triggers, hover/click actions and reduced-motion alternatives. Evaluate Theatre.js as an optional authoring adapter after testing license, bundle/runtime cost, export/serialization and generated-project compatibility.
- Keep the current motion engine for lightweight CSS/UI motion. Avoid shipping Theatre.js into every project by default.
- Acceptance: deterministic playback, pause/resume, lifecycle cleanup, reduced-motion compliance and generated artifact tests.

**Stage E — runtime and renderer strategy**
- Keep the current Three.js runtime as the baseline for vanilla projects. Add a target-aware renderer adapter: vanilla Three.js by default; Threlte only for Svelte output when selected/justified; future renderers must implement the same scene contract.
- Preserve WebGL failure fallback, visibility-aware rendering, disposal of geometry/material/texture/URL resources, lazy loading, context-loss recovery, and configurable quality tiers. Measure before adding physics/XR or a second renderer.
- Acceptance: browser smoke with and without WebGL/CDN access, memory/resource lifecycle tests, low-end/mobile performance budgets and actual visual artifact review.

**Stage F — publish/export and collaboration**
- Provide an embed/publish handoff with origin allowlists, CSP guidance, responsive iframe sizing, asset integrity and clear local-vs-hosted asset states. Integrate with existing deployment adapters instead of inventing another deploy system.
- Add scene versioning and collaboration only through existing project RBAC/audit/version infrastructure; define conflict behavior before real-time multiplayer editing.
- Acceptance: embed security tests, authorized cross-user denial, reproducible export and publish rollback tests.

### Phased delivery and dependencies
- **Near term:** typed scene/asset contracts, text-to-scene operations, media persistence integration, safe preview and regression corpus.
- **Next:** scene hierarchy/property inspector and timeline authoring; evaluate Theatre.js adapter in a separate proof of concept.
- **Later/optional:** Threlte target adapter for Svelte-only projects; Rapier physics, XR and multiplayer collaboration after capability, performance, security and demand validation.
- **Do not block basic website/app generation** on the 3D editor or optional libraries. Keep free/low-end paths lightweight and apply plan quotas through the existing billing/quota system, not hard-coded UI promises.

### Completion status at this checkpoint (not a launch approval)
- **Already implemented according to current source/audit documentation:** baseline Three.js generated experiences; GLTF model loading; local image/video/model inputs and previews; local image-to-mesh texture application; upload limits and URL/resource cleanup; reduced-motion-aware camera behavior; hidden/off-screen render pause; accessible view controls/status; deterministic fallback; responsive viewport checks; design tokens and allowlisted natural-language visual edits.
- **Partially implemented / needs real-product integration:** media is local-session only rather than durable upload; text-based edits focus on basic CSS tokens and do not yet edit arbitrary scene graphs; there is no complete visual 3D scene editor or editable timeline/graph; no Theatre.js or Threlte adapter; no real-time scene collaboration; actual GPU/device performance and visual screenshot review remain unverified.
- **Independent blocker unrelated to these four references:** the async PostgreSQL repository is not wired as the primary application store. Authentication/project/conversation route migration and end-to-end ownership/session tests remain required before primary PostgreSQL can be enabled.
- **CI checkpoint:** commit `b222f4b1597436bf19a2fc32d57021beb3d0f0b5` failed `npm test` because a newly added repository test expected the `listSessions(limit: 0)` clamp to be 1 while implementation clamps it to 50. The implementation behavior is bounded; the test has been corrected to match the existing 50-item minimum. Re-run all workflows on the corrected head. CodeQL and Dependency Review passed on that commit, but CodeQL reported DOM text-to-HTML findings in `src/templates/runtime/three-experience.js`; triage/fix and verify those findings rather than assuming a green workflow means no alerts.
- **Do not mark complete until:** all current tests/CI pass on the latest head, CodeQL findings are resolved or formally dispositioned, scene/media end-to-end flows are tested, and launch gates in section 35 still pass. Production launch additionally requires the infrastructure and external-provider gates already documented above.
