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


## 42. Repository reconstruction checkpoint — October 9, 2026

This checkpoint follows the required read order and keeps the original architecture. It records actual repository access and explicit evidence limits rather than treating source presence as proof of a production feature.

- Canonical application: MuhammadAsimdeveloper/CodingVibes, release identity 13.0.0. The reconstruction candidate is the open PR #53 branch codex/tool-fabric-ci-recovery-2026-10-09. The earlier head f33576e had successful Build Vibe CI, CodeQL and Dependency Review; every newer commit must obtain fresh results.
- The feature branch contains the restored allow-listed visual edit intent runtime and local Tool Fabric contracts. Tool execution remains local by default; live network API testing and unconfigured external effects must remain explicit NOT_CONFIGURED/BLOCKED states.
- The three requested audits are maintained in docs/audit/REPOSITORY_INVENTORY.md, docs/audit/MODULE_REUSE_MATRIX.md and docs/audit/CURRENT_STATE_AUDIT.md. They distinguish the real Build Vibe source from similarly named stubs and from the separate gstack repository.
- The checked OriginKit repository is a showcase, not a delivery of the official component source. Its README explicitly says the source component has not yet been installed. No OriginKit animation is declared integrated until actual authenticated component source and its terms have been inspected.
- The private Our-Tools repository exposes reusable utility source, but Build Vibe's Tool Fabric already covers much of the same category space. The local contract implementation remains canonical; imports should be narrow, compared, licensed/authorized and tested rather than copied in bulk or called remotely.
- A regression test was committed first for the 3D reduced-motion/render-loop gap. A second test-first regression exposed missing import-map resolution for the bare specifier three; the generator now emits a matching import map before /experience.js. A third test-first set covered temporary model/video object URL cleanup and built-in camera fallback for an empty configured shot list. The combined implementation commit c4949625bd21abfcafbadbc9c2588d221e3a5961 passed Build Vibe CI, CodeQL and Dependency Review. The full Build Vibe CI includes unit/coverage, syntax/static, SEO, server and browser E2E, load/recovery, deployment preflight, benchmark, MiroFish status, retention, security, scaleout and launch readiness.
- Production release remains gated on real runner/toolchain, secrets, persistent storage and backup/restore, TLS/domain, monitoring, quotas and third-party credentials. A successful repository CI run is not proof of a live deployment or native binary.

The source-side audit, module decisions and test changes do not mark unavailable OriginKit modules, live MiroFish simulations, cloud resources or deployment targets as complete.


## 42. TDD checkpoint — bounded Tool Fabric pipeline composition (2026-10-09)

**Scope:** Build Vibe's first composition primitive, extending the existing Tool Fabric rather than duplicating its 18 contracts.

- Add `runToolPipeline({ steps })` with ordered local execution and explicit `$ref: "stepId.output.property"` input mapping.
- Preflight every step and reference before execution; reject unknown/duplicate step IDs, forward/missing references, prototype-sensitive paths, and browser/network/high-risk adapters.
- Enforce a maximum of 10 steps, a 1 MB pipeline request, a 1 MB resolved per-step input, and 2 MB cumulative serialized outputs.
- Stop at the first non-`COMPLETED` step with the original failure status, and return `networkUsed: false`.
- Expose the capability through authenticated, rate-limited `POST /api/tool-fabric/pipeline`; audit only bounded tool IDs, statuses, counts and duration, never input or output contents.
- TDD history on PR #53: regression tests were committed first at `0efcf86`, and the missing executor was confirmed by the failing CI test before implementation. The pipeline executor and API route were then added in `e6973f2` and `c560810` respectively.

**Verification status:** the latest full CI run is in progress as of this checkpoint. Do not call this capability verified until its test, coverage, syntax/static, E2E, browser, security and launch checks complete successfully. This PR remains open and separate from `main`; it is not a production deployment.

**Next unfinished Tool Fabric work:** complete the local/browser adapters still explicitly marked `BROWSER_REQUIRED`, `NEEDS_BROWSER_METRICS`, or `NOT_CONFIGURED` only when a real governed adapter and its test environment exist; then add remaining P1 utilities from `docs/ZEE_TOOLS_ECOSYSTEM_PLAN.md`. Declared contracts alone are not evidence that a tool is executable.


## 43. Security regression checkpoint — Three.js walkthrough video upload (2026-10-10)

**TDD scope:** resolve the CodeQL js/xss-through-dom finding associated with the local walkthrough-video preview path in src/templates/runtime/three-experience.js, without weakening CodeQL or changing the generated-project architecture.

- Added the upload validation regression to test/three-experience-runtime.test.js before changing the runtime. The test-only commit 02b9fc3379b9b6f79ad09dfa9216b3b30cee0d7a intentionally failed CI at npm test, demonstrating the missing validation contract.
- Implemented a strict video/mp4, video/webm, video/ogg MIME allowlist; rejected empty uploads and files above 250 MiB; checked video.canPlayType; and created a Blob with the validated media type before creating the object URL and assigning video.src. Invalid files do not replace the current preview.
- Kept the existing cleanup contract that revokes the prior preview URL when a validated replacement is loaded. The file input is reset after processing so the same file can be selected again.
- Latest implementation commit: fab79897aca9ed55992635e61d01b3ea7ec252ef.
- Verification evidence on that exact commit: Build Vibe CI passed, including npm test, coverage (60% line/function and 40% branch thresholds), npm run check, SEO, server E2E, Playwright browser E2E, load/recovery smoke, deployment preflight, benchmark, MiroFish status, retention dry-run, security preflight, scaleout doctor and launch readiness. CodeQL and Dependency Review also passed.
- The diagnostic SARIF logging added during investigation did not suppress alerts or alter scanner conclusions. The current CodeQL workflow reports a successful analysis; do not interpret that as proof that every historical alert in GitHub's alert history was automatically closed.
- The PR is still open and not merged or deployed. Live infrastructure, configured third-party providers, native artifact verification, and production deployment remain separate gates.

**Next unfinished Tool Fabric work:** review the P1 local utilities and the browser adapters marked BROWSER_REQUIRED / NEEDS_BROWSER_METRICS in docs/TOOL_FABRIC.md; implement the highest-value adapter only when its real governed runtime and tests are available. Do not treat a declared contract as execution evidence.


## 44. TDD checkpoint — integrated browser-local image optimizer (2026-10-10)

**Roadmap phase:** Tool/Agent Fabric P1 asset pipeline. This change completes a concrete user path for the existing `image.optimize` contract rather than adding a duplicate optimizer or remote upload service.

- Added accessible image format, quality and max-dimension controls to Studio's Content & data tab; optimized output can be previewed and downloaded without uploading the source file.
- Reused the existing Canvas/ImageBitmap adapter as a single canonical browser-served module at `public/tool-fabric-browser.js`; the Node-side `src/tool-fabric/browser.js` entry point re-exports the same implementation.
- Input policy: PNG/JPEG/WebP/GIF/AVIF/BMP only, non-empty files, 25 MiB maximum input, 50 megapixels maximum decoded dimensions, quality 0.1–1 and dimensions 64–8192 px. SVG is blocked; an encoder MIME mismatch returns `BROWSER_REQUIRED` instead of producing a mislabeled file.
- Preview object URLs are replaced/revoked safely and cleaned on page exit; processing stays client-side and does not call an upload API.
- Regression tests were added before the UI/edge-case fixes. The first test-only CI run exposed unsupported-encoder and missing UI behavior; later tests exposed the missing zero-byte guard and a malformed picker assertion, both corrected before the final verification run.
- Files changed for this checkpoint: `public/index.html`, `public/studio.js`, `public/app-polish.css`, `public/tool-fabric-browser.js`, `src/tool-fabric/browser.js`, `package.json`, `test/image-optimizer-ui.test.js`.

**Verification status:** PASS for source revision `322d36db86047c9d7ff580959ee4d7afa1c8b3a2`. Build Vibe CI run `37982011949` passed all gates (292 tests, 0 failures, coverage, static/release, SEO, server/browser E2E, load/recovery, deployment preflight, benchmark, MiroFish status, retention dry-run, security, scaleout and launch readiness); CodeQL run `37982012043` and Dependency Review run `37982011944` also passed. The UI is a local asset utility, not proof that an uploaded image has been attached to a generated product or published.

**Next unfinished stage:** add a governed, testable browser adapter for `web.performance.audit` only when the runner can supply real browser/Lighthouse measurements; until then it must continue to report `NEEDS_BROWSER_METRICS`. Then proceed through remaining P1 utilities with one distinct behavior contract and test suite at a time.


## 45. Browser E2E checkpoint — image optimizer real-browser verification

Added `scripts/image-optimizer-browser-e2e.mjs` and the `browser:image-optimizer` CI step after Playwright Chromium installation. It exercises the Studio controls in Chromium, verifies PNG-to-WebP encode, preview dimensions, download filename, SVG rejection, preview preservation and zero upload/API requests during optimization. The final CI result for this added check must be recorded before this stage is marked fully verified.


## 46. TDD checkpoint — P1 local text utility suite

Added nine task-level text utilities to the canonical Tool Fabric: count, case conversion, line sorting, duplicate-line removal, literal replacement, bounded line diff, whitespace cleaning, ASCII slug generation and Unicode inspection. The utilities use explicit contracts, stable tool IDs, local-only execution, bounded input/output and truthful INVALID_INPUT/INPUT_TOO_LARGE statuses. Literal replacement never compiles user text as a regex; diff limits both sides to 500 lines; Unicode inspection emits at most 1000 code-point entries. Tests cover the Unicode length/byte distinctions, casing modes, stable line handling, literal replacement, bounded diff, whitespace policy, slug errors and UTF-16 offsets.

The test-first commit introduced the desired contract/output tests before executors. This implementation commit raises the canonical catalog from 18 to 27 tools only after adding nine executable local functions and contract rows; it does not change any external/network adapter states.


## 47. Browser performance evidence — honest measurement gate

Extended the existing Playwright browser smoke runner to collect measured navigation timing, FCP, TTFB, resource-transfer bytes, JS/image resource sizes when readable, render-blocking counts where supported, and observer-backed LCP/CLS. Opaque cross-origin resource timings make byte subtotals incomplete instead of silently counting as zero. A navigation-only smoke test does not claim INP; the report notes the missing metric and any observed interaction duration separately. The Tool Fabric performance evaluator marks partial evidence with `complete:false`, an explicit `missingMetrics` list and `metrics_incomplete`, not a false complete-pass finding. Regression tests validate known inputs and missing/opaque timing behavior.


## 48. TDD checkpoint — local calculator and date/time utility suite (2026-10-10)

**Roadmap phase:** P1 local utility suite. A regression suite was committed before the implementation and confirmed red CI for the missing `calc.percentage` contract and all 13 absent tool executors. The fix extends the existing canonical Tool Fabric; it does not create a separate registry or call a provider.

- Added 13 unique local contracts with schema, aliases, bounded numeric/string input expectations, category, provenance and local/no-network execution metadata.
- Added deterministic percentage, ratio, discount, profit margin, ROI, break-even, compound-interest, fixed-rate loan, dimensional unit, elapsed-duration, calendar-age, IANA time-zone and decimal/binary data-size calculations.
- Invalid, non-finite, unknown-unit, mismatched-dimension, impossible-date, ambiguous-timezone-input, unsupported-timezone and out-of-range inputs return explicit `INVALID_INPUT` rather than a simulated result.
- Added focused coverage for expected outputs, invalid domains and no-network status; included the new module in the syntax gate and raised the canonical catalog assertion from 27 to 40.
- **Verification: PASS on implementation revision `4b796eb615ce77d734a66230995c57d353406bb9`.** Build Vibe CI run [37987930669](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37987930669) passed 309/309 tests (0 failures, 0 skipped), coverage, release/syntax checks, SEO, server E2E, Playwright browser checks (including image optimizer and browser E2E), load/recovery, deployment preflight, benchmark, MiroFish status, retention dry-run, security, scale-out doctor and launch readiness. CodeQL run [37987930550](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37987930550) and Dependency Review run [37987930570](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37987930570) also passed on that exact head. Documentation changes and later commits must obtain their own fresh CI result; this evidence records the tested implementation revision.

**Explicit exclusions:** PDF merge/split/extract/OCR is not represented as complete: the current dependency/runtime set does not yet provide a selected, governed local PDF-processing engine with its own test fixtures, parser limits and real-browser/runtime verification. The browser-evidence adapter is now wired into the Playwright runner: observed `metricsForAudit` values flow into `runTool('web.performance.audit', ...)`, with missing metrics kept explicit and INP never inferred from navigation-only data. The remaining PDF/document suite still requires a selected, governed local PDF engine plus real fixtures, parser limits, security tests and runtime verification.


## 49. TDD checkpoint — local hash, checksum, UUID and URL utility suite (2026-10-10)

**Roadmap phase:** P1 encoding/hash/security developer utilities. The regression file `test/tool-fabric-developer.test.js` was committed before executors and confirmed red for four missing Tool Fabric IDs, then the shared local implementation was added under `src/tool-fabric/developer.js`.

- Added `dev.hash.generate` for SHA-256/SHA-384/SHA-512, with strict algorithm and hex/Base64 encoding allowlists. The API warns these digests are for integrity checks, not password storage.
- Added `security.checksum.verify` using strict digest parsing, exact digest-length validation and Node's fixed-size constant-time comparison.
- Added cryptographic `dev.uuid.generate` (UUID v4) and explicit `dev.url.encode` URI/component encode/decode modes. URL encoding never opens a URL or makes a network request.
- Added invalid input and known-digest regression tests, updated both catalog-count assertions from 40 to 44 and included the new module in syntax verification.
- **Verification: PASS on implementation revision `b65c87d61dab2abc873f8765084c2255240cdf1c`.** Build Vibe CI [37988776436](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37988776436) passed 314/314 tests, 0 failures and 0 skipped, along with coverage, syntax/release, SEO, server/browser E2E, load/recovery, deployment preflight, benchmark, MiroFish status, retention dry-run, security, scale-out doctor and launch readiness. CodeQL [37988776447](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37988776447) and Dependency Review [37988776485](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37988776485) passed on the same revision. A fresh run is required for the updated documentation head.

**Launch boundary remains:** production runners/toolchains, provider/payment secrets, persistent backup/restore, TLS/DNS, monitoring and quota enforcement require real environment configuration and deployed evidence. Source CI does not provision these services.


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


## Generated website quality gate — required follow-up (2026-10-10)

Before claiming every generated website is launch-ready, implement and enforce the 20-point checklist in [`GENERATED_WEBSITE_QUALITY_GATE.md`](GENERATED_WEBSITE_QUALITY_GATE.md). Current source includes SEO metadata/structured-data helpers, robots/sitemap checks, discoverability auditing, a product-quality contract, reduced-motion support, and privacy/terms templates. These are foundations, not proof that each generated site has a correct 404, above-the-fold CTA, complete icon set, sticky mobile CTA, working form confirmation/error paths, consent banner, customer-site analytics, real contact address, and optimized image assets. Keep unconfirmed items explicitly marked until runtime evidence exists. Require per-project artifact + HTTP + browser checks, a machine-readable 20-point report, and publish blocking for critical failures. Preserve the existing architecture and never weaken verification gates.


## Implementation update — generated-site quality gate (2026-10-10)

Completed and CI-verified: `src/verification/generated-site-quality.js` defines the 20-check contract and report statuses; `scripts/generated-site-quality-check.mjs` exposes `npm run site:quality`; generated projects now receive a branded `public/404.html`; unknown public routes return HTTP 404. Tests cover audit reporting and real generated-server 404 behavior. CI passed at `dd1bd2662125db43634ccdca4055b58b8bb852c3`.

**Still incomplete:** the audit CLI is not yet invoked automatically by generation/publish, so critical findings do not yet block customer publishing through this new gate. Next priority is integration into the existing verification/publish workflow, followed by remaining checklist gaps in [`GENERATED_WEBSITE_QUALITY_GATE.md`](GENERATED_WEBSITE_QUALITY_GATE.md). Do not label the full checklist complete.


### Follow-up implementation update (2026-10-10)

`auditProductExperience()` now attaches the generated-site 20-point report under `generatedSiteQuality` for web targets. The report is therefore included in existing product-quality evidence and can be inspected alongside other verification findings. The standalone `npm run site:quality` CLI remains available. Full CI passed at `af6adf6ff6e480bcac351745b0a40a9e17068231`.

The new report does not yet block the publish/deployment transaction. Next, define runtime evidence for unknown-route 404, form submission states, consent, and analytics; then connect critical statuses to the existing contract/publish gate with tests that prove both rejection and legitimate NOT_APPLICABLE cases.


## Generated-site quality implementation status (2026-10-10)

Implemented and CI-verified at `bcb4288036d0ac45b4a045e83531d406d99a85c6`:

- Versioned 20-point generated-site audit engine and `npm run site:quality` CLI.
- Audit report attached to web `auditProductExperience()` evidence.
- Custom 404 artifact and correct HTTP 404 response for unknown routes.
- Web app manifest on all generated web targets.
- Cookie preference manager with accept/reject, optional categories, persistence, settings reopening, and consent-change event.
- Dismissible sticky mobile CTA for relevant customer pages.
- Contact form loading/error feedback and noindex thank-you route; only successful submissions redirect to confirmation.

**Still not complete:** the new 20-point report does not yet block generation/publishing; the consent/form/CTA features need browser-level interaction coverage; full icon sizes, customer analytics installation, owner-supplied contact details, and image optimization remain open. See [`GENERATED_WEBSITE_QUALITY_GATE.md`](GENERATED_WEBSITE_QUALITY_GATE.md) for the authoritative matrix. Do not mark the product launch-ready from these changes alone.


## Production quality gate integration (2026-10-10)

The 20-point report is now attached to web product-quality evidence. HTTP smoke verifies unknown-route 404, and Playwright smoke exercises primary CTA placement, cookie consent preferences, mobile sticky CTA dismissal, contact error/retry/loading, and successful thank-you redirect. The verification contract blocks critical report gaps in production (`NODE_ENV=production`) or when `CODINGVIBES_ENFORCE_GENERATED_SITE_QUALITY=true`; local development remains informational by default. Full CI passed at `962d5006ed239ff39476aeefe3d43cb05d4d51a9`.

Remaining launch work includes owner-provided contact data, customer analytics configuration and tracking consent integration, platform-specific icon sets, automatic image optimization in generated exports, broader viewport/accessibility checks, and production infrastructure/credentials. Do not mark the platform launch-ready until these are closed and independently verified.


## Owner data and analytics milestone (2026-10-10)

- Implemented optional consent-aware Google Analytics using an explicit owner-provided measurement ID; browser smoke verifies load only after consent and collection disable/revocation.
- Implemented safe rendering and explicit-brief extraction for business contact addresses. Missing/placeholder addresses become a critical production blocker for business sites.
- Added end-to-end generated-site browser smoke coverage and report-level publishability assertions. Full CI passed at `ceac1d6c58af339880b5959f69a0e4d3d75547b8`.

Still open: a dedicated analytics/contact settings UI, full platform-specific icon set, automatic image optimization for generated raster assets, expanded viewport/accessibility budgets, and production provider credentials/monitoring/recovery.


## Project-scoped owner settings (2026-10-10)

Implemented: the builder has address and Google Analytics ID fields, validates the measurement ID, persists values per project in browser storage, and adds explicit owner data to the generation brief. Address rendering is HTML-escaped; missing required business addresses block production verification. The generated-site browser gate covers consent-gated analytics and the core contact/confirmation flow. Full CI passed at `06d2a6fcd03d6e37a8793f260738f5383b152a94`.

Remaining: complete platform-specific icon sizes, automatic raster image optimization during export, broader mobile/tablet/accessibility budgets, and production provider credentials/monitoring/recovery.


Follow-up: address and analytics settings now persist per project in browser localStorage and are restored when projects are switched or the builder is reloaded. The build request is composed from the base prompt plus explicitly supplied settings; the visible prompt log avoids echoing those settings.


## 50. TDD checkpoint — responsive viewport quality gate (2026-10-11)

**Roadmap phase:** generated website launch quality, responsive layout and browser verification.

- Added `assessResponsiveLayout()`, which validates real viewport/document/body width measurements, tolerates at most 2px of browser rounding, and reports measured horizontal overflow with element diagnostics.
- Browser smoke now checks every requested route at mobile (375×812), tablet (768×1024), and desktop (1440×900) sizes, restores the caller's viewport afterward, and includes responsive failures in the normal quality result.
- Generated-site browser E2E asserts all three viewport measurements exist and pass for every route.
- The new gate exposed a real 15px mobile overflow on the generated `/admin` page. The owner-configuration hint could exceed its container; admin inputs/editors now have bounded widths, the editor grid collapses to one column on narrow screens, and long owner configuration text wraps safely.
- **Verification: PASS on revision `29f57ebea72a9725e3ac62cc73ea035d3f45732f`.** Build Vibe CI [38080632604](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/38080632604) passed all configured checks, including tests, coverage, syntax/release checks, SEO, server E2E, Playwright/browser E2E, image optimizer E2E, load/recovery, deployment preflight, benchmark, security, scale-out and launch readiness.

**Next unfinished stages:** platform-specific icon sizes, automatic optimization of generated raster assets during export (distinct from the browser-local optimizer), broader accessibility/viewport budgets, and real production credentials/monitoring/recovery. Keep these open until each has implementation and independent evidence.


## 51. TDD checkpoint — platform-specific generated app icons (2026-10-11)

**Roadmap phase:** generated website launch quality, PWA installation and cross-platform brand assets.

- Added a dependency-free PNG encoder that emits real RGBA PNG assets at 180×180 (Apple touch icon), 192×192 (PWA install icon) and 512×512 (large/maskable PWA icon). Rounded corners are transparent and the mark is generated deterministically.
- Generated projects now ship `public/apple-touch-icon.png`, `public/icon-192.png`, and `public/icon-512.png`; public pages, 404, owner admin and sign-in pages link to the icon set.
- The web manifest retains the scalable SVG fallback and declares both PNG install sizes. Removed the duplicate manifest emission so only one canonical manifest is written.
- Added PNG structure/decompression tests, generated artifact/manifest tests, browser HTTP checks for content type and dimensions, and a syntax check for the icon generator.
- **Verification: PASS on revision `588156e398bd643c7ed3bd7a5a17979983bea329`.** Build Vibe CI [38081225750](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/38081225750) passed tests, coverage, syntax/release checks, SEO, browser E2E (including the generated icon endpoints), load/recovery, deployment preflight, benchmark, security, scale-out and launch readiness.

**Next unfinished stage:** optimize generated raster assets during export (distinct from the browser-local optimizer), extend accessibility/viewport budgets, and verify real production credentials, deployment, monitoring and recovery. Documentation commits must obtain their own fresh CI evidence; this checkpoint records the exact tested implementation revision.

## 52. TDD checkpoint — export optimization, accessibility, credential preflight (2026-10-11)

This checkpoint records source changes on `codex/export-media-archive-optimization`. It is not a release certification.

- ZIP export stores already-compressed media formats without redundantly DEFLATE-compressing them; text/source files remain compressed.
- The isolated raster workspace protects source files, keeps relative paths unchanged, validates paths and PNG dimensions before decode, uses a PNG fallback encoder, accepts output only when a configured size-saving threshold is met, and returns a bounded report. It is integrated into manual ZIP, Netlify, Build Vibe Cloud, GitHub, Vercel and Cloudflare Pages paths.
- Vercel file upload hashes the optimized file bytes (not the path) for its content digest. Cloudflare's direct-upload MIME map now covers common image, audio, video, PDF and font extensions.
- Generated-site browser checks cover missing alt attributes, accessible names, interactive aria-hidden, H1/heading hierarchy, visible focus on first keyboard Tab, minimum dimensions for primary interactive targets, and horizontal overflow. Generated styles include focus-visible rules and forced-colors handling.
- `npm run deployment:credentials` provides sanitized, read-only probes for GitHub, Vercel, Netlify and Cloudflare authentication. It distinguishes BLOCKED from UNVERIFIED, does not print secrets, and explicitly does not claim publish/write permissions. Build Vibe Cloud remains UNVERIFIED until its adapter provides a documented non-mutating health/credential probe. See [Deployment credential verification](DEPLOYMENT_CREDENTIALS.md).
- Regression tests cover asset/source/reference preservation, ZIP byte round-trips, direct-upload provider behavior, credential results, accessibility semantics and generated CSS. The prior full CI run passed on revision `b282ed10490bb2f99ff2e0e8cdbec9bf13d25859`; subsequent digest/focus/credential-check commits still require fresh full CI before this checkpoint can be considered verified.

### Remaining release blockers

- JPEG/WebP/AVIF resizing is conditional on an installed Sharp encoder, which is not a declared project dependency in the current lockfile; otherwise source bytes are conservatively preserved. Add encoder support only with a reproducible cross-platform lockfile and quality tests.
- Visual difference/quality budgets, contrast checks and assistive-technology review remain open.
- Read-only credential authentication does not prove target write scopes. Run the credential probe with real production-managed secrets and verify a controlled staging deployment.
- Production domain/TLS, observability/alerting, quotas, persistence, backup/restore and failure recovery still need evidence from the intended production environment.

## 53. Production operations checkpoint — monitoring, deployment and recovery (2026-10-11)

- Enhanced `scripts/launch-check.mjs` to verify that `/health` returns the expected service/version/timestamp shape, request-correlation and no-store headers; `/ready` must return ready; and `/api/ops/metrics` plus `/api/launch/status` reject unauthenticated access.
- Added `docs/PRODUCTION_OPERATIONS.md` covering provider credential preflight, staging deployment and HTTPS smoke, limits of the in-memory telemetry buffer, protected metrics access, persistent backup storage, isolated restore verification, and release rollback.
- The request telemetry currently measures requests, 5xx counts, status families and bounded latency percentiles per process. It is not a durable metrics store or external alerting service; production must integrate and test the host platform's monitoring/alerting.
- Added `src/ops/backup.js::verifyBackup` and `npm run backup:verify`: checks a real SQLite backup read-only using a streaming SHA-256 digest, SQLite `quick_check`, and `foreign_key_check`; rejects symlinks and optional digest mismatches. Regression tests cover valid backups, checksum mismatch, malformed DB files, missing paths and symlinks. The automated recovery smoke still creates/restores a temporary SQLite database and verifies a representative project. Neither proves production backup retention, off-host storage, real-data restore, or RTO/RPO compliance.
- Latest implementation commits require fresh full CI. The prior credential-check CI failure was traced to a test boolean that tracked every Cloudflare request instead of account access specifically; the fixture now tracks only the account endpoint. Do not close this phase until Build Vibe CI, CodeQL and Dependency Review pass on the exact final head.

