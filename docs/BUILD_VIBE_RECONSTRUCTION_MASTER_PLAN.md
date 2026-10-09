# Build Vibe Reconstruction Master Plan

Date: 2026-10-09  
Baseline release: 13.0.0  
Baseline commit inspected: `08332195527edcf097d2b0656cb2add105b8a9c9` on `main`  
Execution branch: `codex/reconstruction-audit-2026-10-09`

## Authority and intent

This document records the audit-first reconstruction process for the existing Build Vibe repository. It complements, and does not supersede, `docs/BUILD_VIBE_LAUNCH_PLAN.md`; that file remains the canonical launch roadmap and defines the release gates. `docs/AI_BUILD_START_HERE.md` remains the execution checklist.

The named reconstruction plan was absent from the inspected `main` tree. This file replaces that missing planning artifact so later work has a durable, reviewable starting point. This is not evidence that the whole product has been rebuilt or that launch gates have passed.

## Hard rules

1. Preserve existing working behavior, architecture, public interfaces, verification gates, target registry, provider/deployment adapters, data ownership and security boundaries.
2. Do not rewrite the application or duplicate existing orchestration, SEO, target-selection or connector systems.
3. Treat generated projects, imported repositories, research results, media files and external provider responses as untrusted input.
4. Keep bounded execution, safe paths, isolated runners, explicit verification and explicit commit/release actions.
5. Keep optional external services in truthful `NOT_CONFIGURED` or `BLOCKED` states when their credentials or runners are absent.
6. Install third-party components only through their authorized delivery path, after checking stack compatibility, usage terms, dependencies and accessibility.
7. Make source and test changes together. Never remove assertions or relax thresholds merely to obtain a green build.
8. Document measured evidence separately from architectural intent and unverified capability.

## Existing product architecture to preserve

| Layer | Existing implementation | Reconstruction rule |
| --- | --- | --- |
| Requirements and AppSpec | `src/agent/requirements.js`, `src/agent/app-spec.js`, `src/agent/planner.js` | Extend acceptance criteria through the current contract rather than creating a second spec. |
| Build orchestration | `src/agent/orchestrator.js`, `src/agent/task-graph.js`, `src/agent/execution-policy.js` | Keep bounded work, retries, budgets, cancellation, checkpoints and explicit handoffs. |
| Model routing and generation | `src/ai/router.js`, `src/ai/user-router.js`, `src/agent/model-generator.js`, `src/agent/project-generator.js` | Preserve provider boundaries and deterministic offline fallback. |
| Design and experiences | `src/agent/design-system.js`, `src/agent/experience-recipes.js`, `src/agent/experience-quality.js`, `src/templates/catalog.js` | Reuse the canonical design tokens, template registry and progressive-enhancement layer. |
| Verification | `src/verification/contract.js`, `http.js`, `playwright.js`, `visual.js`, `discoverability.js` | Verification remains a blocking contract where configured; missing tools must be visible. |
| Project isolation and security | `src/core/safe-path.js`, `src/git/workspace.js`, `src/runtime/container.js`, `src/runtime/daytona.js`, `src/runners/`, `src/security/` | Do not execute generated code with broader host permissions as a shortcut. |
| Persistence and scale-out | `src/db/store.js`, `src/db/postgres.js`, `src/jobs/`, `src/storage/object-store.js` | Preserve the stated distinction between development SQLite and optional production adapters. |
| Public SEO and content | `src/seo/`, `src/site/`, `src/verification/discoverability.js` | Keep route metadata and indexability in the canonical models. |
| Deployment and artifacts | `src/deployment/`, `src/targets/`, `src/runners/`, `src/artifacts/store.js` | Do not report a handoff as a deployment or source generation as a verified native binary. |

## Work sequence

### Phase 0 — Establish the baseline

Record the branch and commit, inspect package scripts and CI, map the complete file tree, read the launch/start-here plans, identify prior audit claims, and distinguish verified tests from documentation-only claims. Preserve all unrelated work.

### Phase 1 — Architecture and module-reuse audit

Create a module reuse matrix identifying canonical modules, dependencies, compatibility constraints, security boundaries and candidate gaps. Check all external component sources for authorized access and usage restrictions before import. Do not duplicate private or licensed component libraries.

### Phase 2 — Product and generated-artifact quality

Exercise deterministic generation for realistic websites and applications, including content pages, working form/API behavior, responsive design, semantics, SEO and explicit failure states. Improve design tokens, typography, spacing, component consistency and motion through existing design-system and experience-quality modules.

### Phase 3 — Immersive / 3D experience quality

Preserve the existing Three.js/GLTF experience contract. Improve reduced-motion behavior, accessible controls and status announcements, upload validation, object-URL cleanup, and frame scheduling so hidden or off-screen scenes do not consume continuous rendering resources. Keep a content fallback when WebGL or remote libraries are unavailable. Support user-attached media without claiming uploads have become persistent content unless that persistence is implemented.

### Phase 4 — Real verification

Run unit/regression tests, syntax checks, generated artifact validation, HTTP smoke tests, browser E2E, responsive viewport checks, accessibility checks, SEO checks and performance limits where the required runtime exists. Record exact command outcomes, commit identity and external blockers.

### Phase 5 — Integrations and operations

Complete only compatible, necessary modules through existing adapter contracts. Keep credentials out of the repository. Verify provider timeouts, quotas, retries, tenant boundaries, webhook signatures, health/readiness and operational recovery.

### Phase 6 — Release decision

Update the launch audit, implementation baseline and affected docs from actual CI/workflow evidence. Mark acceptance criteria PASS only when tests or live environment evidence exists. Record production credentials, DNS/TLS, databases/backups, remote runner, monitoring, billing and device toolchain blockers as explicit deployment work.

## Current audit checkpoints

- Baseline inspected: repository tree, package scripts, release identity, launch plan, start-here instructions, core generation/design/verification modules, 3D runtime, CI workflow inventory and OriginKit repository setup.
- Found: this plan file was absent from baseline `main`.
- Implemented on the execution branch: accessible 3D scene status and view controls; bounded image/video/model inputs; local media previews and explicit image-to-mesh texture application; texture/material/object-URL cleanup; reduced-motion-aware camera behavior; visibility/off-screen render pause; render-buffer optimization; mobile/tablet/desktop browser layout checks; project-persisted design tokens; an editor-authorized allowlisted natural-language design-edit route; an opt-in generated-site visual-selection runtime; safe CSS token injection and regression-test additions.
- Latest verified CI evidence: branch head `ee8ca3069bd6711c8d6a1b10cbdf041250457912`; Build Vibe CI run #809 (`37919884973`), CodeQL (`37919884987`), and Dependency Review (`37919885041`) all passed on that head. This head includes source/test changes beyond the earlier `b158811c37998bfa3ec51d2db4b47d290f459e05` checkpoint: project-scoped design-token preservation, bounded text-driven design edits, safe generated CSS application, and local 3D image-texture application with regression coverage. CI ran unit tests, coverage, syntax/release checks, SEO, generated-project E2E, Playwright browser E2E, load/recovery/deployment preflight, benchmark, MiroFish status, retention dry-run, security preflight, scale-out doctor and launch readiness. The audit document records detailed outcomes and limitations. These are automated CI results, not a production certification.


- Still unverified/not configured: visual review of saved screenshots, real GPU/WebGL/CDN behavior under representative devices, durable user-media uploads, native binary/device builds, production deployment and rollback smoke, and live MiroFish/provider executions. Benchmark output is planning-contract-only and is not real artifact performance evidence.

## Definition of done

A phase is complete only when its code is present, relevant tests exercise the behavior, verification and security contracts are unchanged or stronger, documentation matches the result, and the launch checklist contains traceable evidence. The final release decision must list passed, failed, blocked and not-configured checks separately.
