# Build Vibe current-state audit

Date: 2026-10-09
Canonical repository: MuhammadAsimdeveloper/CodingVibes
Release identity inspected: 13.0.0
Active reconstruction candidate: codex/tool-fabric-ci-recovery-2026-10-09, PR #53

## Executive assessment

The repository has a substantial existing application, not an empty scaffold. Its architecture includes multi-file generation, model routing with deterministic fallback, project persistence and Git workspaces, verification/repair, native target and runner contracts, authentication, billing, deployment adapters, route-level SEO, a design system, motion recipes, 3D templates and product QA. A greenfield rewrite would discard meaningful functionality and contradict the authoritative launch plan.

The current work should be incremental. Build Vibe CI, CodeQL and Dependency Review passed on f33576ea045b4c82711b7eabdb5d121da34a6146 and passed again on 1bc89f191c85748cf3dc9d439edc89cafb2d9cd0 after the reduced-motion fix. The import-map regression test was committed first on 93f90183229382a4a4be9054f576603138bc7365; its Build Vibe CI failed at npm test as expected because the generated page did not declare the map. The follow-up implementation commit still needs fresh CI.

## Requirement-to-implementation map

| Requirement family | Existing evidence | State | Main remaining work / gate |
|---|---|---|---|
| Roadmap and release identity | BUILD_VIBE_LAUNCH_PLAN.md; src/version.js; package scripts and lockfile; release-check and CI workflows | IMPLEMENTED BASELINE | Keep checkpoint docs synchronized; re-run CI for each new commit. |
| Website/app generation | src/agent/requirements.js, project-generator.js, ai router, target registry/generator | IMPLEMENTED, DEPTH VARIES | Continue representative generated-product verification, repair cases and UX feedback loops. |
| Prompt-based visual editing | New feature PR #53 adds src/assistant/intent.js, visual-edit-runtime.js and Studio iframe-selection wiring | IN FEATURE PR | Do not mark integrated on main until PR merges; ensure text is untrusted and CSS operations allow-listed. |
| Local tool contracts | New feature PR #53 adds 18 local tools, catalog/execution routes and tests | IMPLEMENTED ON FEATURE BRANCH; CI GREEN AT PRIOR HEAD | New commit must run through same CI. Live outbound API testing is intentionally NOT_CONFIGURED. |
| Design system / motion | src/agent/design-system.js, experience-recipes.js, experience-quality.js and motion tests | IMPLEMENTED FOUNDATION | Improve generated aesthetics and test responsive/reduced-motion runtime behavior, not just CSS token presence. |
| 3D experiences | src/templates/runtime/three-experience.js, experience recipes and real-estate/product templates. The CDN addon modules require a browser import map for the bare specifier three. | IMPLEMENTED FOUNDATION; HARDENED THIS CHECKPOINT | Respect reduced-motion and visibility lifecycle, and generate the import map before the experience module. CDN self-containment remains open. |
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
2. Updated the Three.js runtime to use the live reduced-motion preference, stop continuous rendering when motion should be reduced, pause camera transitions and tours as appropriate, and suspend animation work for hidden documents.
3. Added a generated-page import map for the Three.js bare specifier before module loading; the regression test first exposed the omission, and the generator fix is pending CI.
4. Added repository inventory, module reuse matrix and current-state audit under docs/audit, including inspected agency, Atlas, Auto-Vid and Asim-OS repositories.
5. Appended this checkpoint to the authoritative roadmap without deleting historical decisions.

## Test and release truth

No local npm command was executed in this session because the repository is accessed through GitHub repository APIs rather than a checked-out workspace. The regression test was committed before implementation to preserve test-first order. GitHub Actions for the implementation commit is the required next verification; until it completes, this change is PENDING CI. A passing source CI still does not prove production deployment, third-party credentials, native artifacts or live MiroFish operation.

## Remaining release blockers

- OriginKit component source/authenticated CLI delivery and per-component licensing details.
- Production runtime configuration: model/provider credentials, isolated runner/container images and SDKs, secure production secrets, persistent database/object storage with backup/restore, TLS/reverse proxy, public domain/DNS, monitoring/alerting and production quota policy.
- Live target-specific deployment/browser/native artifact evidence for each advertised target.
- Live third-party credentials for enabled payment/deployment/provider integrations.
- Three.js CDN reliance for exported 3D products remains a portability/performance improvement item.
