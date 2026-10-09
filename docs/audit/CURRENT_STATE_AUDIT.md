# Build Vibe current-state audit

Date: 2026-10-09
Canonical repository: MuhammadAsimdeveloper/CodingVibes
Release identity inspected: 13.0.0
Active reconstruction candidate: codex/tool-fabric-ci-recovery-2026-10-09, PR #53

## Executive assessment

The repository has a substantial existing application, not an empty scaffold. Its architecture includes multi-file generation, model routing with deterministic fallback, project persistence and Git workspaces, verification/repair, native target and runner contracts, authentication, billing, deployment adapters, route-level SEO, a design system, motion recipes, 3D templates and product QA. A greenfield rewrite would discard meaningful functionality and contradict the authoritative launch plan.

The current work remains incremental. The implementation head c4949625bd21abfcafbadbc9c2588d221e3a5961 passed Build Vibe CI (run 37915178917), CodeQL (run 37915178871) and Dependency Review (run 37915178851). The passing Build Vibe CI ran the dependency audit, test suite, coverage, syntax/static checks, SEO, server E2E, Playwright browser E2E, load/recovery smoke tests, deployment preflight, benchmark, MiroFish status, retention dry-run, security preflight, scaleout doctor and launch readiness. The preceding test-only commits intentionally failed at npm test for the import-map and asset-lifecycle regressions, establishing the bugs before the fixes. This evidence applies to c4949625; a later documentation-only commit will rerun CI.

## Requirement-to-implementation map

| Requirement family | Existing evidence | State | Main remaining work / gate |
|---|---|---|---|
| Roadmap and release identity | BUILD_VIBE_LAUNCH_PLAN.md; src/version.js; package scripts and lockfile; release-check and CI workflows | IMPLEMENTED BASELINE | Keep checkpoint docs synchronized; re-run CI for each new commit. |
| Website/app generation | src/agent/requirements.js, project-generator.js, ai router, target registry/generator | IMPLEMENTED, DEPTH VARIES | Continue representative generated-product verification, repair cases and UX feedback loops. |
| Prompt-based visual editing | New feature PR #53 adds src/assistant/intent.js, visual-edit-runtime.js and Studio iframe-selection wiring | IN FEATURE PR | Do not mark integrated on main until PR merges; ensure text is untrusted and CSS operations allow-listed. |
| Local tool contracts | Feature PR #53 adds 18 local tools, catalog/execution routes and tests | IMPLEMENTED ON FEATURE BRANCH; VERIFIED AT c4949625 | CI gates are green for the current implementation head. Live outbound API testing remains intentionally NOT_CONFIGURED. |
| Design system / motion | src/agent/design-system.js, experience-recipes.js, experience-quality.js and motion tests | IMPLEMENTED FOUNDATION | Improve generated aesthetics and test responsive/reduced-motion runtime behavior, not just CSS token presence. |
| 3D experiences | src/templates/runtime/three-experience.js, experience recipes and real-estate/product templates. The CDN addon modules require a browser import map for the bare specifier three. | IMPLEMENTED FOUNDATION; HARDENED THIS CHECKPOINT | Respect reduced-motion and visibility lifecycle, and generate the import map before the experience module. CDN self-containment remains open. |
| 3D uploaded asset lifecycle | Three.js runtime permits GLB/GLTF/video input; regression tests cover object URL cleanup and empty camera-path fallback. | IMPLEMENTED; CI GREEN AT c4949625 | Model object URLs are revoked in finally; replaced video URLs are released and inputs reset; empty camera-path arrays use built-in viewpoints. CDN self-containment remains open. |
| SEO/discoverability | src/seo/*, discoverability verification, generated metadata, sitemap/robots, seo:check | IMPLEMENTED BASELINE | Keep public/private indexability correct; rankings/indexing are not guaranteed. |
| Authentication/security | src/security/*, server route checks, safe-path/runtime sandbox boundaries, CodeQL/dependency review | IMPLEMENTED FOUNDATION | Production secret/session/provider policies need actual environment configuration; keep generated code isolated. |
| Export/deployment/native | src/deployment/*, src/targets/*, src/runners/*, preflight scripts | ADAPTERS PRESENT; ENVIRONMENT-DEPENDENT | Verify actual per-target artifact builds and deploy smoke tests only where runners/credentials exist. |
| Postgres/scaleout/storage | src/db/postgres.js, storage/object-store.js, jobs/queue.js, scaleout and diagnostics scripts | ADAPTERS / NOT UNIVERSALLY CONFIGURED | Verify live database, worker, backup/restore, quotas and observability on target infrastructure. |
| OriginKit component integration | Private showcase exists; official component source not yet installed | BLOCKED | No authentic component implementation was available in inspected repository. Avoid fabricated integration; require authorized source/authentication and license review. |
| Reuse from Asim Tools | Private source with reusable modules; broad overlap with local tool contracts | REVIEW REQUIRED | Do not bulk-copy or add runtime coupling. Narrow imports require rights/provenance and comparative tests. |
| Production release | readiness/launch/security/deployment gates and machine-readable historical readiness artifact | SOURCE-READY / DEPLOYMENT NOT VERIFIED | Production runner, secrets, persistent storage/backups, TLS/domain, monitoring and live third-party/payment credentials are outstanding until checked in the real environment. |

## Verified source observations

- package.json and src/version.js consistently identify Build Vibe as 13.0.0 on the inspected feature branch.
- The launch plan's notes about earlier 12.x release mismatches and a launch-readiness syntax error are historical audit context; the inspected 13.0.0 source has a canonical version check and the new head must be tested rather than assuming those historical failures persist.
- The previous feature-head CI had successful test, coverage, syntax/static, SEO, browser/e2e, recovery/load/deployment preflight, benchmark, MiroFish-status, security and scaleout/launch stages, plus CodeQL and Dependency Review.
- MiroFish is an adapter contract; the release-readiness artifact says it is not configured and no real simulation evidence exists.
- Tool Fabric's API tester plans requests rather than sending them. Its static audits analyze supplied HTML; performance scores require supplied measurements; JWT inspection decodes claims but does not verify signatures. These boundaries are explicit and preferable to false capability claims.
- The 3D runtime loads Three.js/OrbitControls/GLTFLoader from jsDelivr. This is a network dependency in exported generated projects unless assets are bundled later.

## Implemented in this checkpoint

1. Added test-first regression coverage for reduced-motion preference, camera-tour/recording policy and renderer lifecycle.
2. Updated the Three.js runtime to use the live reduced-motion preference, pause tours as appropriate, and stop rendering/camera work when motion is reduced or the tab is hidden.
3. Added the tested Three.js import map to generated immersive pages before module loading.
4. Added test-first regression coverage for uploaded media object URL cleanup and empty camera-path fallback; CI passed on the resulting implementation commit c4949625bd21abfcafbadbc9c2588d221e3a5961.
5. Added the three requested audit documents and recorded OriginKit unavailability plus reuse choices for accessible related repositories, including Website Inspector.
6. Appended this checkpoint to the authoritative roadmap without deleting historical decisions.

## Test and release truth

No local npm command was executed in this session because the repository is accessed through GitHub repository APIs rather than a checked-out workspace. GitHub Actions executed the repository's actual test and release-check commands on the hosted runner. The test-first regression sequence is preserved: tests-only commits failed at npm test, then implementation commit c4949625 passed the complete Build Vibe CI plus CodeQL and Dependency Review. Passing repository CI does not prove production deployment, third-party credentials, native artifacts or live MiroFish operation.

## Remaining release blockers

- OriginKit component source/authenticated CLI delivery and per-component licensing details.
- Production runtime configuration: model/provider credentials, isolated runner/container images and SDKs, secure production secrets, persistent database/object storage with backup/restore, TLS/reverse proxy, public domain/DNS, monitoring/alerting and production quota policy.
- Live target-specific deployment/browser/native artifact evidence for each advertised target.
- Live third-party credentials for enabled payment/deployment/provider integrations.
- Three.js CDN reliance for exported 3D products remains a portability/performance improvement item.
