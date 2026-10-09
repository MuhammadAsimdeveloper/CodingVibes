# Build Vibe Reconstruction Audit

Date: 2026-10-09  
Repository: `MuhammadAsimdeveloper/CodingVibes`  
Baseline commit: `08332195527edcf097d2b0656cb2add105b8a9c9` (`main`, release 13.0.0)  
Audit branch: `codex/reconstruction-audit-2026-10-09`

## Decision

**Automated checks PASS on the latest verified branch commit; production launch is not approved by this audit.** Branch head `ee8ca3069bd6711c8d6a1b10cbdf041250457912` (`docs: distinguish source verification from audit document updates`) has successful Build Vibe CI run `37919884973` (#809), CodeQL run `37919884987` and Dependency Review run `37919885041`. Unlike the earlier checkpoint, the current branch includes subsequent source/test commits for project-scoped design-token preservation, allowlisted natural-language design edits, safe CSS application, 3D image-texture application and its regression tests. The latest workflow ran against this branch head and passed the configured CI steps listed below. These are repository CI results, not proof of production deployment or physical-device/GPU behavior. Live third-party services, native device builds, durable user-upload persistence, production deployment and hardware/GPU experience checks remain unverified or not configured.

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

### Additional implementation findings addressed on this branch

#### Saved design tokens were not reliably carried into generation

The orchestrator wrote a default design system again after planning, which could overwrite user-saved Design Mode settings. Generated CSS did not consistently consume stored project tokens or allowlisted visual edits.

**Changes made:** existing project-level tokens are now retained, injected into `spec.styling.designSystem`, and recorded as design-system evidence. The deterministic generator emits bounded, validated palette/type/layout/radius/motion CSS and supported text-driven style operations. For model-generated web projects, the orchestrator applies the validated token CSS through a fixed-path helper that rejects symlink paths. The browser UI has a project-scoped natural-language design editor backed by `POST /api/projects/:id/design/intent`, authorized with the existing editor role. It records only operation metadata in the audit log and retains a bounded history of 24 edits. Unsupported requests return an explicit 422 rather than fabricated success.

Supported edits are intentionally focused (named/hex colors, text size, alignment, weight, radius, spacing and visibility); this is not a claim of unrestricted natural-language recreation of every arbitrary UI element. The generated-site visual selection runtime is disabled by default and can be enabled explicitly. It emits selection metadata and does not eval or run user-supplied CSS/JavaScript.

#### Local image-to-3D texture behavior

The generated 3D runtime now provides an explicit “Apply image texture” action. In the local browser session, a selected image can be loaded as a Three.js texture and applied to meshes of the loaded GLTF model or fallback scene. Original mesh materials are restored when changing texture/models or tearing down; clones, textures and object URLs are disposed/revoked. CI syntax/contract tests pass for these paths. No real device/GPU rendering benchmark or dedicated live-CDN/WebGL screenshot validation was performed here.

Video upload provides an MP4/WebM preview only. Image/video/model choices are local browser files; they are not persisted server-side or attached to a durable public asset record. Persisting media requires the authorized storage/asset flow and remains follow-up work.

## Validation status

| Check | Status | Evidence |
| --- | --- | --- |
| Repository code/docs and regression changes | PASS (latest branch CI) | Draft PR #55, branch `codex/reconstruction-audit-2026-10-09`, head `ee8ca3069bd6711c8d6a1b10cbdf041250457912`. Build Vibe CI run #809 (`37919884973`), CodeQL (`37919884987`) and Dependency Review (`37919885041`) all completed successfully on this head. Source/test changes after the earlier #806 checkpoint include bounded design-token/text-edit and 3D image-texture improvements; this row reflects the latest run, not only the older checkpoint. |
| Unit/regression test suite and coverage | PASS | CI #806 `npm test`: 255 tests, 255 passed, 0 failed, 0 skipped; coverage command also completed with 255 passed, 0 failed. Includes visual-edit intent/API, safe CSS, generated visual-selection, 3D media/texture, and security-path regression coverage. |
| Syntax/static and release check | PASS | CI #806 `npm run check` and release check passed; `packageLockPresent: true`. Generated admin server syntax regression discovered during implementation was fixed and the generator syntax test passed. |
| SEO/discoverability checks | PASS | CI #806 `npm run seo:check`: score 100, grade A+, no issues or warnings. |
| Generated-project HTTP/E2E | PASS | CI #806 `npm run e2e`: `status: verified`, 9 pages, 5 APIs, 19 evidence records. |
| Playwright browser E2E and responsive overflow contract | PASS | CI #806 `npm run browser:e2e`: `status: verified`, 9 pages, 5 APIs, 19 evidence records. Browser QA now measures phone 390×844, tablet 768×1024 and desktop 1440×900 and fails on horizontal overflow. This is not a separate physical-device or dedicated GPU/WebGL certification. |
| Security preflight and dependency review | PASS | CI #806 `npm run security:check`: PASS; CodeQL run #372: success; Dependency Review run #357: success. The workspace CSS applier refuses symbolic-link paths. |
| Operations/load and recovery smoke | PASS (CI environment) | CI #806 `ops:load`: PASS, concurrent cases show zero failures and p95 below the 1000 ms limit; `recovery:smoke`: PASS, restored project verified. `scaleout:doctor` reports configured CI/local adapters, not production-service readiness. |
| Launch-readiness script | PASS (preflight only) | CI #806 `npm run launch:check`: `ok: true`, 20 checks. |
| Benchmark realism | LIMITED | Benchmark suite reports 60/60 planning-contract scenarios passed (100%); `measurementStatus: PLANNING_CONTRACT_ONLY` and `targetArtifactStatus: not_executed`. It does not measure real native artifacts or production performance. |
| Native runner/device and binary verification | NOT RUN / environment-dependent | No device build or physical Android/iOS/macOS runner artifact was produced by this audit. A unit/contract pass is not a native artifact. |
| Production deployment | NOT CONFIGURED | CI `deployment:preflight`: provider is null with `deployment_provider_not_selected`; no production deploy or rollback smoke was executed. |
| Live OriginKit component use | NOT USED | Official source was not installed/copied. See the module reuse/license decision. |
| Live MiroFish simulation | NOT CONFIGURED | CI `mirofish:status`: `NOT_CONFIGURED`; the required URL and API key are absent. No live simulation result is claimed. |

## Release caveats

Do not mark Build Vibe production-ready on source inspection alone. Production requires configured secrets, isolated runner/runtime, persistent storage and tested backups, TLS/reverse proxy and domain settings, monitoring, quota controls, live integration credentials where enabled, and post-deployment smoke/rollback evidence. Optional PostgreSQL/S3/Redis adapters remain separate from the development SQLite store until a verified migration path is deliberately enabled.

## Follow-up order

1. Capture visual browser artifacts and manually inspect an actual generated 3D page with a GLB model, image texture and MP4/WebM preview; exercise the real WebGL/CDN-failure fallback on representative hardware.
2. Broaden the generated website/application acceptance corpus across CRUD, commerce, booking, dashboards, content, native targets and malicious repository inputs; benchmark real artifacts in addition to planning contracts.
3. Persist user-selected media through the existing authorized asset/storage pipeline if the intended product behavior requires uploads to survive a reload or publish.
4. Complete physical native builds, live provider simulations and production deployment/rollback tests only when the relevant credentials, runners, device toolchains and infrastructure are configured.
5. Update `docs/IMPLEMENTATION_BASELINE.md` only when its release-line baseline should be advanced; never replace environment blockers with assumed PASS results.


## Implementation update — October 9, 2026

The older audit rows above describe the pre-media baseline and are historical; this addendum supersedes their stale statement that durable media uploads were still unimplemented.

### Phase 51 — durable assets / 3D scene media

Implemented on the audit branch: authenticated project-scoped media uploads; allowlisted media types and format-aware content inspection; server-generated flat filenames; SHA-256 and byte-length validation; metadata sanitization; local/S3 object-store persistence; client-safe asset records; authenticated preview/file routes; missing-workspace fallback; upload deletion; scene-editor image/video/model upload; add/remove node operations; safe same-origin asset URLs; model preview loading; and deployment-time asset restoration that merges instead of deleting the assets directory.

Verified on source checkpoint ebbbcf2112faf8d77e3c0e638871d603eb548322: Build Vibe CI 37973098545, CodeQL 37973098422, and Dependency Review 37973098446 all completed successfully. Checks included unit/regression tests, coverage, syntax/release checks, SEO, generated-project E2E, Playwright browser E2E, operations/load, recovery, deployment preflight, security preflight, scale-out doctor and launch readiness. The successful local object-store recovery test is an adapter/integration test; it does not certify a live S3 bucket, multi-instance storage permissions, or production retention/backups.

### Phase 52 — Tool Fabric initial contracts

The current code checkpoint introduces a central 18-tool catalog and four no-egress local adapters: JSON formatting/validation, JSON-to-TypeScript, Base64 text encode/decode, and decode-only JWT claim inspection. The catalog distinguishes executable and planned tools, defines metadata for privacy, auth, network, risk, timeout/retry, audit and fallback, and exposes an authenticated catalog/execution API. Network-bound tools remain planned and fail closed. Verification for this addition is pending on the new branch head until CI, CodeQL and Dependency Review finish.

### Release decision and remaining boundaries

Build Vibe is not approved for production launch by this addendum. No live production deployment or rollback, real production S3 bucket, production primary-database migration, native device build or live MiroFish simulation is claimed. The primary application Store remains SQLite; PostgreSQL/S3/Redis are adapter foundations where not explicitly enabled and verified. Launch acceptance still requires the production environment gates in the canonical roadmap.
