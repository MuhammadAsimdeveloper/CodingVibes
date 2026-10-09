# Build Vibe — Reconstruction, Design Quality, Motion & 3D Master Plan

**Scope:** Build Vibe product quality and generation-engine improvement initiative  
**Repository:** MuhammadAsimdeveloper/CodingVibes  
**Status:** Execution plan; implementation must be evidenced by code and tests  
**Companion roadmap:** [BUILD_VIBE_LAUNCH_PLAN.md](BUILD_VIBE_LAUNCH_PLAN.md)  
**Agent entry point:** [AI_BUILD_START_HERE.md](AI_BUILD_START_HERE.md)

## 1. Purpose

Upgrade Build Vibe into a dependable AI product builder that can create genuinely useful, visually distinctive, responsive, accessible and production-conscious websites and applications. Improve both the Build Vibe creation experience and the quality of every product it generates.

The work covers professional website structure and UX, reusable design systems, legacy-module discovery and adaptation, licensed OriginKit component integration, advanced animation, interactive 3D, the creative concept called “9D motion,” application generation and repair, project preview and export, and measurable quality assurance.

This is a controlled reconstruction of weak or incomplete areas—not an automatic rewrite of the entire application. Build Vibe already contains valuable architecture and verification contracts. Retain and improve them unless an evidence-based audit shows a specific component must be replaced.

## 2. Plan authority and relationship

This document is the **authoritative plan for the visual-quality, module-reuse, animated-site and 3D experience initiative**.

The existing [BUILD_VIBE_LAUNCH_PLAN.md](BUILD_VIBE_LAUNCH_PLAN.md) remains authoritative for overall release sequencing, security requirements, verification gates, deployment readiness and launch decisions. Neither plan permits bypassing tests, security boundaries, isolated execution, or verification-gated publishing.

Read [AI_BUILD_START_HERE.md](AI_BUILD_START_HERE.md) and both plans before implementation. When documents conflict, preserve the stricter security or verification requirement, record the conflict, and update the relevant plan rather than silently ignoring it.

## 3. Verified starting context

The repository README describes an existing Build Vibe architecture with a Node HTTP API and session authentication, project/session/run persistence, provider routing, an AppSpec planner, project-local Git, isolated worktrees, controlled file operations, configurable local/Docker/Daytona preview runtimes, evidence collection, bounded AI repair and explicit verification-gated commits. It also describes a deterministic fallback, multiple web/mobile/desktop targets, design-intent extraction, SEO/discoverability capabilities and operational adapters.

Treat these as documented claims to verify against the current source and tests. Do not recreate them merely because a plan mentions them. Find the actual owner module, its API contract, tests, configuration, limitations and consumers before editing.

OriginKit is an external source of licensed components, not a folder to copy wholesale. At the last repository inspection, the separate Originkit project README said the official component source had not yet been installed and required authenticated CLI access. Re-check the current state, licensing terms and exact generated API. Use the official authenticated workflow and review the dry run before adding a component. Do not scrape, mirror or redistribute the component catalog or credentials.

Repository discovery must distinguish similarly named repositories. CodingVibes is the Build Vibe product source. Do not treat the separate Vibe-coding- repository as a legacy Build Vibe codebase: its README identifies it as a gstack project. Tiny or empty repositories are not useful sources unless inspection proves otherwise. Reuse only code that is relevant, accessible, authorized, compatible and properly licensed.

## 4. Non-negotiable engineering rules

1. Inspect before editing. Record the current branch, Git status, latest commits, runtime versions, package scripts, source structure, test structure and existing plan decisions.
2. Preserve user changes. Never reset, overwrite or delete work blindly.
3. Do not rebuild from scratch merely for convenience. Prefer repairing and improving the smallest viable module.
4. Keep existing AppSpec contracts, safe file operations, project isolation, worktrees/checkpoints, provenance, bounded repair and verification-gated commits intact.
5. Do not fake API integrations, test outcomes, deployment success, 3D support or native artifacts.
6. Do not weaken tests, security gates, accessibility checks or acceptance criteria to produce a green result.
7. Follow a test-first workflow for behavioral changes where practical: add a failing regression test, implement the smallest safe fix, refactor, and run the relevant suite.
8. Keep modules project-local where they belong. Generated products must not require a runtime connection to a development repository simply to import copied components.
9. Audit third-party licenses and dependencies before reuse. Never copy private information, credentials, secrets, proprietary assets or unrelated user data.
10. Every implemented feature must have an owner, contract, behavior, failure state, tests and documentation.
11. Use small, reviewable changes and meaningful commits. Do not deploy to production or change external resources without authorization.
12. Document unavailable credentials, unavailable source access, blocked checks and remaining work truthfully.

## 5. Phase 0 — Establish a trustworthy baseline

Before the first code change:

- Read this document, BUILD_VIBE_LAUNCH_PLAN.md, AI_BUILD_START_HERE.md, ARCHITECTURE.md, ROADMAP.md, relevant target/runtime/security documentation and the current product-experience benchmark.
- Inspect Git status and branch. Establish a safe branch and retain unrelated work.
- Inventory all source directories, package scripts, app entry points, API routes, AppSpec/planner logic, generation and repair stages, visual/design-intent code, templates, animation and 3D helpers, preview/runtime adapters, persistence and verification code.
- Locate tests that cover the generator, target registry, generated output, browser QA, visual quality, repair limits, project import and commit/publish gates.
- Run the repository's supported baseline checks. Record each command and its real result; distinguish failed, skipped, blocked and passed checks.
- Inspect available related repositories and component sources, including CodingVibes itself, Originkit and other genuinely relevant accessible projects. Follow nested workspace/submodule references where useful.
- Create or update the inventory and decisions listed in Section 13.

Do not make broad code changes until the baseline and the module dependency map are known.

## 6. Repository and module reuse audit

For each important candidate module, record its source path/repository, actual purpose, license/provenance, dependencies, current state, tests, consumers, risks, decision and integration destination.

Classify it as:

- **Reuse:** reliable, compatible and correctly licensed.
- **Adapt:** valuable but needs interface, style, accessibility or performance work.
- **Refactor:** correct behavior trapped in a coupled or duplicated implementation.
- **Replace:** demonstrably broken or unable to meet the required contract.
- **Reject:** redundant, unsafe, inaccessible, incompatible, unlicensed or not relevant.
- **Blocked:** source or authentication unavailable; continue with other work and state the limitation.

Investigate the actual implementation, not just README promises. Include package manifests, scripts, components, hooks, CSS, design tokens, images, fonts, icons, animation helpers, shaders, 3D models, prompts, agent routing, templates, API contracts, data models and tests as relevant.

For OriginKit components, verify official source, license and intended use; inspect props, styling, dependencies and mobile behavior; install only the selected component through the authorized workflow; keep its source in this project where permitted; then integrate it with local design and testing conventions. Never copy the complete OriginKit catalog. If licensing or official access is unclear, mark the module blocked and create an original alternative only when appropriate.

Record discoveries in:
- docs/audit/REPOSITORY_INVENTORY.md
- docs/audit/MODULE_REUSE_MATRIX.md
- docs/audit/CURRENT_STATE_AUDIT.md

These files should report verified facts, not planned or imagined capabilities.

## 7. Target architecture: one coherent generation system

Retain and improve the current architecture wherever viable. Prefer clear module boundaries for:

### Product and project workflow
Project creation, prompt intake, requirement clarification, AppSpec/design intent, generation progress, editing, preview, persistence, project history, verification, diff review, export and explicit publish/commit.

### AI planning and implementation
Separate research/requirements, UX and design direction, architecture, code generation, security review, automated verification, browser QA, repair and release review where the current orchestrator can support them. Handoffs must contain structured requirements and evidence. Concurrency, retries, provider fallbacks and token/cost use must be bounded. Provider failures must produce an honest fallback or a clear BLOCKED/NOT_CONFIGURED state.

### Design and component system
A project-local registry of reusable, documented components; tokens for colors, type, spacing, radius, borders, elevation and motion; accessible interaction patterns; and design presets that can be composed without duplicating implementation.

### Motion and 3D experience
Reusable animation primitives, effect presets, scene templates, asset-loading strategies, interaction contracts, mobile variants, reduced-motion behavior and performance safeguards.

### Quality verification
Contract validation, static checks, tests, generated-app builds, HTTP smoke checks, optional browser automation, accessibility and SEO checks, performance evidence, target-specific validation, repair limits and a reviewable diff.

Use existing modules and services first. Do not introduce new frameworks, paid services, runtime dependencies or parallel abstractions without showing a concrete gap and evaluating cost, compatibility, security and maintenance impact.

## 8. Professional website and application quality

Build Vibe must generate a product designed for its industry, audience, brand and task—not a generic collection of gradient hero sections and cards.

For each generation, derive a concise design brief: audience, product purpose, primary conversion/task, information architecture, design direction, visual tone, content requirements, component language, responsive expectations, accessibility needs and suitable motion level.

Cover relevant patterns across business and agency sites, SaaS, commerce, portfolios, editorial and content sites, dashboards, booking, directories, documentation and other supported targets. Each category should use the right structure rather than one universal template.

A professional generated product should have:

- A clear visual hierarchy, restrained and intentional spacing, consistent typography and readable line length.
- Meaningful page architecture, useful and specific content, obvious primary actions and coherent navigation.
- Original, relevant imagery or well-designed empty/placeholder states; no misleading image, testimonial, metric or content claims.
- Responsive layout and tested breakpoints, with appropriate mobile navigation and touch targets.
- Shared and consistent components with hover, focus, pressed, disabled, loading, empty, success and failure states.
- Real behavior behind interactive controls. Forms validate and report results; links resolve; filters, sorting and pagination work when displayed as features.
- Semantic HTML, keyboard support, visible focus, accessible naming, adequate contrast and screen-reader status where required.
- Route-specific metadata, canonical rules, social previews, sitemap/robots behavior and schema only when the visible content qualifies.
- Fast loading, optimized images/fonts/scripts, controlled layout shifts and measured Core Web Vitals where supported.

Avoid generic filler, dead buttons, repeated sections, unnecessary glass effects, random gradients, decorative noise, inaccessible interactions and untested claims. Visual fidelity alone does not count as a working feature.

## 9. Motion system for animated websites

Create a small, composable set of motion primitives and configurable presets. Potential effects include:

- Cinematic hero entrances and staggered content reveals.
- Text and SVG animation.
- Scroll-triggered transitions and carefully limited parallax.
- Pointer-aware lighting, depth and gradients.
- Sticky or pinned storytelling sections when useful.
- Product demos, interactive diagrams, progress and metric animation.
- Scene transitions, ambient backgrounds and reduced-motion alternatives.
- Responsive variants suitable for keyboard, touch and coarse-pointer inputs.

Use the best fitting existing library or native platform features. Do not add overlapping libraries without clear justification. Avoid animating every element. Motion should explain, guide, confirm or reinforce the product's identity.

Honor prefers-reduced-motion, preserve focus and reading order, avoid scroll hijacking and layout instability, and stop or simplify nonessential effects on low-powered devices. Animation failures must never make key content or navigation unavailable.

## 10. 3D and the “9D motion experience”

Treat “9D” as a creative product language for a layered and immersive combination of depth, controlled motion, lighting, 3D assets, interactive responses and optionally user-controlled audio. Do not describe it as literal nine-dimensional computing or claim a physical sensation that a normal website cannot deliver.

Use suitable existing WebGL/Three.js or other stack-compatible technology only when it adds meaningful value. Build reusable scenes and components for interactive product viewers, depth/parallax hero sections, scroll-linked 3D storytelling, particles, lighting/material effects, model reveals and spatially layered compositions.

Each effect must include a purpose, input/interaction contract, performance strategy, mobile behavior and fallback. Use lazy loading, compressed and size-appropriate assets, sensible scene complexity, bounded render loops, context-loss/error handling and static or 2D fallbacks. Account for GPU, memory, browser and thermal constraints. Audio is optional and must require deliberate user activation with accessible controls.

Do not let a 3D effect obscure content, block forms, break scrolling, impair assistive technology or delay the usable first view. Test a real rendered experience where the tools permit; a static screenshot or mocked component is not proof of working 3D.

## 11. Improve the Build Vibe editor and end-to-end workflow

Audit the actual user journey and prioritize proven gaps:

1. Project discovery and creation.
2. Prompt/requirements intake and target selection.
3. Design direction and template choice where helpful.
4. Generation progress with meaningful stages.
5. Project editing and safe file changes.
6. Live preview and responsive viewport checks.
7. Error feedback, validation and bounded repair.
8. Save, restore, history and project state.
9. Review of changed files and verification evidence.
10. Export, deployment handoff or publish with accurate status.

Improve file navigation, preview errors, responsive controls, generation history, console/browser results and source synchronization only where the existing product supports those workflows or the roadmap warrants them. Never add a visible button whose feature is not implemented. Preserve explicit approval and verification gates for changed generated code.

## 12. Implementation phases

### Phase A — Audit and requirements
Complete the baseline, source inventory, current-state audit and reuse matrix. Map every relevant requirement to existing code or a verified gap.

### Phase B — Foundation and integration
Fix critical blockers; consolidate design tokens and component conventions; implement selected legacy modules and authorized OriginKit components; add tests for integration behavior and ensure source provenance is recorded.

### Phase C — Generation quality
Improve the design brief/AppSpec, component selection, content structure, route/page generation, iteration on existing projects and safe repair. Verify end-to-end workflows instead of only unit-level code.

### Phase D — Motion and 3D
Deliver reusable effect presets and scene templates with reduced-motion and lower-capability fallbacks. Add focused templates or examples demonstrating distinct, useful experiences rather than one generic demo.

### Phase E — Product UX
Close the highest-value gaps in project creation, editing, preview, progress, history, error recovery, export and deployment handoff.

### Phase F — Quality and release hardening
Run relevant tests, generated-project smoke tests, browser checks, accessibility review, SEO checks, dependency/security checks and representative performance measurements. Repair regressions and document remaining blockers.

Do not wait for confirmation after each normal implementation decision. If the project is too large for one pass, implement the next highest-value vertical slice, update the plan with completed evidence and continue within the available execution window.

## 13. Required documentation

Create and maintain:
- docs/BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md — this plan.
- docs/BUILD_VIBE_START_PROMPT.md — short copy/paste agent prompt.
- docs/audit/REPOSITORY_INVENTORY.md — accessible sources and verified inventory.
- docs/audit/MODULE_REUSE_MATRIX.md — reuse/adapt/replace/reject decisions and license notes.
- docs/audit/CURRENT_STATE_AUDIT.md — verified baseline, defects and evidence.
- Existing architecture, roadmap, benchmark, SEO, launch and AI agent instructions where affected.

Update all relevant active Markdown documentation when implementation or decisions change. Do not rewrite historical release notes, legal/community policies or independent deployment contracts merely to make them repeat the plan. Preserve their original purpose and update only when the new work actually changes their content.

## 14. Required quality evidence and acceptance criteria

The initiative is not complete just because code has been added.

### Engineering
- Existing tests and release/security gates remain enabled.
- Relevant type/syntax/lint/check commands and tests run successfully, or blockers are recorded.
- The app builds using the documented workflow.
- Critical project creation, generation, preview, edit, verification and publish/commit gates still behave correctly.
- No secret, unsafe generated-code execution path, unintended cross-project dependency or false success state is introduced.

### Generated product
- At least one representative professional business/SaaS site and one relevant app experience are generated and exercised end to end.
- Navigation, core controls, forms and responsive layouts work.
- Accessibility and SEO assertions are checked by automated tools where available and manually for critical flows.
- The output uses consistent design tokens and a clear design direction.

### Motion/3D
- At least one animated example is tested in the browser.
- At least one genuine 3D example is tested when the environment supports it.
- Reduced-motion, keyboard/touch usability, asset-load failure and lower-capability fallbacks are exercised.
- No performance or functionality claim is made without a recorded measurement or test.

### Documentation and status
- Reuse sources, licenses, versions and modifications are documented.
- All checks are labeled PASS, FAIL, BLOCKED or NOT RUN accurately.
- Remaining provider, credentials, runner, licensing and infrastructure requirements are explicit.
- A release-ready claim is made only when the existing release gates and these relevant acceptance criteria support it.

## 15. Final directive

Begin with the repository and runtime audit. Read the existing roadmap and relevant code before writing replacements. Build an evidence-based module map across all relevant accessible sources, respecting permissions and licenses. Then execute the highest-priority work module by module, integrating and improving real implementations into Build Vibe's own coherent architecture.

The outcome must be a verified AI creation platform that makes useful, distinctive and professional websites and applications—not a documentation-only exercise, fake demo, template gallery or collection of disconnected effects. Keep the work incremental, secure, accessible, measured and compatible with the existing verified-build contract.
