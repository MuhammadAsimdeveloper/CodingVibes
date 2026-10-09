# Build Vibe Module Reuse and OriginKit Compatibility Audit

Date: 2026-10-09  
Repository: `MuhammadAsimdeveloper/CodingVibes`  
Purpose: preserve canonical implementations and safely evaluate compatible external UI/3D modules without duplicating logic or crossing licensing/security boundaries.

## Decision summary

Build Vibe already has canonical modules for design tokens, site kits, templates, generated motion, 3D scenes, QA, SEO, AI routing, safe execution and deployments. Extend these modules instead of adding competing implementations.

**No OriginKit component source is installed or copied into Build Vibe by this change.** The private `MuhammadAsimdeveloper/Originkit` repository is a Next.js App Router + TypeScript + Tailwind showcase configured for the official Originkit CLI. Its README says the official component source is not installed yet and authenticated delivery is required. The installed component's real API/dependencies therefore cannot be inspected or verified from the repository.

The official Originkit licensing page says components can be used in projects, including commercial websites and apps, but restricts bundling them in templates, themes and starter kits that are distributed to other developers without a partnership. Build Vibe generates websites/apps and distributes starter source to its users. Until an explicit compatible license/partnership covers that use, do not embed OriginKit components in generated templates or the template catalog. Official terms: https://www.originkit.dev/docs/licensing . The CLI/stack guide is https://www.originkit.dev/docs/components .

## Canonical module reuse matrix

| Need | Existing source of truth | Reuse / integration rule |
| --- | --- | --- |
| Requirement analysis and acceptance criteria | `src/agent/requirements.js`, `src/agent/app-spec.js`, `src/agent/product-quality.js` | Extend the existing AppSpec and acceptance contract. Avoid another prompt-to-spec parser. |
| Build orchestration and agent roles | `src/agent/orchestrator.js`, `src/agent/task-graph.js`, `src/agent/execution-policy.js`, `src/agent/review.js` | Add bounded task roles to the current graph; preserve timeout, cancellation, retry, concurrency, budget and audit behavior. |
| Design tokens and styling intent | `src/agent/design-system.js`, `src/platform/feature-suite.js`, `src/agent/experience-quality.js`, `src/agent/project-generator.js` | Keep palette, typography, radius, motion and reduced-motion tokens centralized. The orchestrator now preserves the stored project system and applies validated CSS through the canonical generation flow; do not let model fallbacks overwrite user token choices. |
| Natural-language and visual editing | `src/assistant/intent.js`, `src/server.js` project design-intent endpoint, `src/templates/runtime/visual-edit.js` | Route text edits through a project editor permission check and an allowlisted intent/CSS contract. The generated visual-selection runtime is opt-in and emits selection metadata; do not evaluate user-authored CSS/JavaScript or silently mutate copy. |
| Website/app starter catalog | `src/templates/catalog.js`, `src/site/kits.js`, `src/agent/project-generator.js` | Add original templates through the canonical catalog/site-kit path and existing quality checks. Do not mirror a third-party catalog. |
| Generated motion | `src/templates/runtime/motion-engine.js`, `public/workspace-motion.js`, `src/agent/experience-quality.js` | Reuse progressive enhancement and reduced-motion safeguards. Avoid a second global animation engine unless a measured gap justifies it. |
| Interactive 3D | `src/templates/runtime/three-experience.js`, `src/agent/experience-recipes.js`, `experienceMarkup()` in `src/agent/project-generator.js` | Extend the runtime and template markup together. Keep WebGL/CDN fallback, upload constraints, explicit image-to-mesh texture application, object/material/texture cleanup, bounded frame scheduling, reduced motion and accessible non-canvas controls. Video is previewed locally; do not claim persisted media until the authorized asset/storage path saves it. |
| Structured media/content | `src/site/content.js`, `src/site/runtime.js`, `src/assets/library.js`, generated site-content schema | Reuse structured records when media must persist. File input previews are local-only unless an authenticated storage adapter saves and returns a durable asset URL. |
| Browser and visual QA | `src/verification/playwright.js`, `src/verification/visual.js`, `src/verification/http.js`, `src/verification/contract.js` | Extend existing pass/fail evidence. Browser QA now exercises mobile/tablet/desktop overflow; do not create a second smoke runner for the same pages. |
| SEO and AI discoverability | `src/seo/metadata.js`, `src/seo/public-pages.js`, `src/verification/discoverability.js` | Keep metadata, indexability, route inventory, sitemap and validation centralized. Avoid duplicate SEO engines. |
| Security / untrusted code | `src/core/safe-path.js`, `src/security/`, `src/runtime/`, `src/runners/`, `src/agent/execution-policy.js` | Reuse safe-path, network isolation, explicit runner availability and fail-closed policy. Do not move generated execution onto a privileged host to simplify integrations. |
| Model providers / external services | `src/ai/router.js`, `src/ai/connectors.js`, `src/integrations/connectors.js`, existing provider adapter modules | Route through current adapter contracts with timeouts, bounded retries, secret handling, explicit health/status and non-fabricated failure states. |
| Git/deployment/native target support | `src/git/`, `src/deployment/`, `src/targets/`, `src/runners/`, `src/artifacts/` | Keep the target registry authoritative and require target-specific runner/artifact proof before reporting verification or deployment success. |

## OriginKit compatibility facts and limits

- The connected private repository is a component-playground scaffold, not an installed component package. Its `components.json` configures `components/originkit`, but the tracked tree contains no delivered component source.
- The documented official path is authenticated `originkit` CLI delivery (or authorized MCP/component delivery), followed by inspection of the exact export, props, dependencies, stack variant and license. Do not scrape the catalogue or infer component APIs from names/previews.
- OriginKit's documented delivery variants target Framer, React/Vite and Next.js. Build Vibe's generator primarily emits ordinary HTML, CSS and browser JavaScript, while its control plane is Node.js. A Next.js/React component is therefore not automatically compatible with a generated vanilla-JS website; porting would need a reviewed implementation, not a blind source copy.
- Third-party dependency licenses remain separate from the OriginKit component license; each component's declared packages, fonts, images and icons require their own review.
- Originkit's licensing page forbids distributing its components within templates, themes, starter kits, design assets or as a competing component catalog without a partnership. Because Build Vibe generates user-downloadable project source and templates, default generator/template integration is not approved by the available terms.
- Permitted next step, if needed: use an authorized component only in Build Vibe's own application UI after authenticated delivery, stack/API review, dependency/licensing review and confirmation that the product use is within the license. Keep it out of user-generated starter templates unless written terms authorize it.
- Do not add an Originkit API key, browser session, generated private source, catalogue cache or session file to this repository.

## Third-party runtime controls

The current 3D template references pinned Three.js, OrbitControls and GLTFLoader modules through a CDN. Keep the version pinned, preserve the visible procedural fallback when imports or model loading fail, and validate transitive licensing/security during dependency review. Do not silently claim this mode works offline. Browser tests that require external CDN access must be labeled as network-dependent.

For uploaded local files, the enhanced generated 3D preview checks allowed file types and size limits, uses object URLs rather than inline data URLs, and revokes local URLs on replacement or teardown. These previews remain in the browser session: durable content requires the existing asset/content storage path and storage permission checks.

## Acceptance checklist for future component/module reuse

- [ ] The component's official source was delivered via an authorized mechanism and version/identity recorded.
- [ ] Stack and runtime are compatible with the target (control plane vs generated HTML site vs native target).
- [ ] The license permits the exact distribution path; template/starter output is treated as a separate licensing case.
- [ ] All direct/transitive dependencies, fonts, icons, images and remote assets are identified and licensed.
- [ ] No secrets/session artifacts or bulk catalogue data are committed.
- [ ] Keyboard behavior, accessible names, reduced motion and screen-reader status are verified.
- [ ] Mobile/tablet/desktop layout and performance are measured.
- [ ] Regression tests and build checks pass with evidence.
- [ ] Fallback behavior is functional when optional packages, remote assets or credentials are unavailable.
- [ ] Existing security, verification, target, storage and deployment contracts remain intact.

## Reference

- Official Originkit licensing and usage: https://www.originkit.dev/docs/licensing
- Official component installation/stack documentation: https://www.originkit.dev/docs/components
- Project setup/installation runbook: `MuhammadAsimdeveloper/Originkit/docs/ORIGINKIT_COMPONENT_INSTALLATION.md`
