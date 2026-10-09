# Build Vibe Reconstruction Audit

Date: 2026-10-09  
Repository: `MuhammadAsimdeveloper/CodingVibes`  
Baseline commit: `08332195527edcf097d2b0656cb2add105b8a9c9` (`main`, release 13.0.0)  
Audit branch: `codex/reconstruction-audit-2026-10-09`

## Decision

**In progress — do not treat this audit as a launch approval.** The repository already contains substantial working architecture, and this change set extends it rather than replacing it. The new source and regression checks must pass the repository CI before the code changes can be called verified. Deployment readiness still depends on live infrastructure and credentials described by the existing readiness contract.

## Audit scope and evidence

Inspected the tracked repository tree; `package.json` and release identity; `docs/BUILD_VIBE_LAUNCH_PLAN.md`; `docs/AI_BUILD_START_HERE.md`; existing baseline/final audit documents; CI workflow inventory; requirements/AppSpec planning; generation and model-routing paths; design-system and experience recipes; the Three.js runtime and its generated markup; verification, browser QA, SEO/discoverability, target and deployment modules; and the private OriginKit setup repository.

The requested `docs/BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md` did **not** exist in the inspected default-branch tree. A replacement plan is being added as an explicit planning artifact. The prior final-audit document records results for a previous source line; those historic results are not evidence that this audit branch has passed.

## Architecture inventory

| Area | Existing code and coverage | Audit disposition |
| --- | --- | --- |
| Requirements and generation | `src/agent/requirements.js`, `app-spec.js`, `planner.js`, `model-generator.js`, `project-generator.js`; generation and product-quality tests | Preserve the canonical spec and generator; expand regression coverage around real generated output. |
| Agent execution | `src/agent/orchestrator.js`, `task-graph.js`, `execution-policy.js`, repository context, diagnostics and repair | Preserve timeouts, budgets, bounded repair, checkpoints and explicit verification. Do not create a parallel orchestration stack. |
| Design and motion | `src/agent/design-system.js`, `experience-recipes.js`, `experience-quality.js`, `src/templates/catalog.js`, generated motion runtime | Use the existing tokens and progressive enhancement; ensure real reduced-motion behavior. |
| Immersive 3D | `src/templates/runtime/three-experience.js`, `experienceMarkup()` in `project-generator.js`, generated site content records | A concrete accessibility/performance/media gap was found and addressed in this branch; CI/browser evidence is pending. |
| Browser verification | `src/verification/playwright.js`, `visual.js`, `http.js`, `contract.js` | Added mobile, tablet and desktop overflow checks to the browser smoke path; needs execution in CI with the browser dependency available. |
| SEO and discoverability | `src/seo/`, `src/verification/discoverability.js`, sitemap, robots and public page route model | Preserve centralized SEO rules; use `npm run seo:check` and `npm run launch:check` as distinct gates. |
| Auth/security/runtime | `src/security/`, `src/core/safe-path.js`, `src/runtime/`, `src/runners/`, HTTP/security tests | Keep strict input, safe-path, auth/session, and isolated-execution boundaries. |
| Storage/operations | SQLite store plus optional PostgreSQL, object storage, Redis Streams, outbox/worker and readiness adapters | Optional adapters are not proof that production services are configured. Keep NOT_CONFIGURED states explicit. |
| Native/deployment | `src/targets/`, `src/runners/`, `src/artifacts/`, `src/deployment/` | A native target is verified only when its real toolchain/runner and artifact validation pass. Deployment handoff is not deployment success. |
| External component reuse | Private `MuhammadAsimdeveloper/Originkit` repository and its CLI config | No official component source was installed in that repository. No OriginKit source was copied into Build Vibe. See the dedicated reuse decision. |

## Findings and disposition

### High priority — immersive 3D motion and resource use

Before the changes in this branch, the Three.js runtime scheduled a new animation frame continuously after initialization, including when the scene was off-screen or the document was hidden. The runtime queried `prefers-reduced-motion` but only altered the status message; camera transitions and the perpetual render loop still ran. The renderer also requested `preserveDrawingBuffer` despite no current need for a persistent drawing buffer. These behaviors increase GPU/CPU activity and fail to honor the user's motion preference.

**Changes made:** reduced-motion mode disables damping and turns camera-tour motion into a single view change; the render loop pauses when the document is hidden or the scene is outside the viewport; the loop resumes when needed; the renderer no longer requests a preserved drawing buffer; event listeners, renderer resources and object URLs are cleaned up on page teardown. The generated experience now includes labeled rotate/zoom controls and a polite status region.

### High priority — media workflow in non-property 3D experiences

Previously the image upload workflow did not exist in the general 3D experience. The visible video-upload control was only emitted for property-tour layouts, despite product/scene records also allowing media references.

**Changes made:** the generated 3D product/scene and property-tour sections now have image and video attachment inputs and previews. Browser-side checks restrict supported image/video types and cap image/video/model files at 20/100/150 MB, respectively. Local object URLs are revoked when replaced and on teardown. These local previews do not claim to persist a user's files to the server.

### High priority — responsive browser QA coverage

The browser smoke path accepted a viewport argument but verified layout overflow only at the primary viewport.

**Changes made:** the browser QA flow checks 390px phone, 768px tablet and 1440px desktop widths, records per-viewport measurements, and fails verification on horizontal overflow. These checks are now part of the existing browser QA contract rather than a second test runner.

### Medium priority — reproducible acceptance evidence

Documentation on the baseline includes past CI results, while the current audit branch has not yet produced new workflow evidence. The final audit must be refreshed only after the current branch's tests, browser smoke and launch checks complete. Passing a static source check does not establish a live provider integration, native build, production deployment or external MiroFish simulation.

### Medium priority — OriginKit compatibility and licensing

The private OriginKit setup repo states that the official component source has not yet been installed and that copying/installing needs authenticated delivery. Build Vibe's default generator emits user-facing websites/apps and starter experiences; the official licensing page excludes bundling Originkit components in distributed templates/themes/starter kits without a partnership. The proper decision is to keep it out of generated templates unless a compatible license/partnership explicitly authorizes that distribution. No catalogue scraping, bulk replication or source copying is part of this audit. See `docs/BUILD_VIBE_MODULE_REUSE.md`.

### Medium priority — runtime network dependency

The 3D experience imports Three.js, OrbitControls and GLTFLoader from a pinned CDN URL at runtime. It already has a procedural fallback when import/model loading fails; that fallback should remain visible and usable. Offline reliability and third-party license/version checks must be measured separately from generator tests.

## Validation status

| Check | Status | Evidence required |
| --- | --- | --- |
| Source edits and new tests are committed to the audit branch | In progress | Branch commit history and diff |
| Unit/regression test suite | Pending | GitHub Actions test output for this branch |
| Syntax/static check | Pending | CI `npm run check` result |
| Browser E2E at phone/tablet/desktop widths | Pending | CI browser job output and per-viewport reports |
| SEO/discoverability checks | Pending | `npm run seo:check` and launch-check output |
| Security preflight and dependency review | Not re-certified in this audit | Current branch workflow evidence |
| Native runner/device and binary verification | Environment dependent | Real toolchain run and verified artifact record |
| Production services and deployment smoke | Blocked until configured | Real deployment environment, credentials and smoke results |
| Live OriginKit component use | Not installed / not used | Owner-authenticated official CLI delivery, dependency review and allowed distribution path |
| Live MiroFish simulation | Not run here | Real configured MiroFish job/response; adapter contract tests are not a live simulation |

## Release caveats

Do not mark Build Vibe production-ready on source inspection alone. Production requires configured secrets, isolated runner/runtime, persistent storage and tested backups, TLS/reverse proxy and domain settings, monitoring, quota controls, live integration credentials where enabled, and post-deployment smoke/rollback evidence. Optional PostgreSQL/S3/Redis adapters remain separate from the development SQLite store until a verified migration path is deliberately enabled.

## Follow-up order

1. Wait for no follow-up work; instead use current CI evidence to repair any regressions in this branch.
2. Capture actual browser reports at all supported widths and test a generated 3D website that attaches an image and video, while confirming a graceful WebGL/CDN fallback.
3. Complete a broader generated website/application acceptance corpus spanning CRUD, commerce, booking, dashboards, content, native targets and malicious repository inputs.
4. Re-audit authentication, tenancy, dependency egress and deployment secret boundaries when real credentials/infrastructure are present.
5. Update this report and `docs/IMPLEMENTATION_BASELINE.md` only with observed evidence and explicit blockers.
