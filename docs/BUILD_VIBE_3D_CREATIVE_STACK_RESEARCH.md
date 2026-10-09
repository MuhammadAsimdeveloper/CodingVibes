# Build Vibe — 3D Creative Stack Research and Plan Status

Date: 2026-10-09
Repository: MuhammadAsimdeveloper/CodingVibes
Roadmap: docs/BUILD_VIBE_LAUNCH_PLAN.md, section 39
Scope: PeachWeb, Threlte, Theatre.js and Spline

## Executive decision

Use **Spline as the product/workflow benchmark**, **PeachWeb as the no-code 3D website workflow benchmark**, **Theatre.js as an optional timeline-authoring candidate**, and **Threlte as an optional Svelte-target renderer**. Do not replace the existing Three.js generated runtime, design system, AppSpec, motion engine, deployment adapters, or launch plan. Extend those existing modules incrementally.

This is a feature-fit assessment from official product/docs pages, not a hands-on benchmark of the products, nor a claim that Build Vibe already implements their full feature sets.

## Feature extraction

| Product | Core role | Observed capabilities | Best use in Build Vibe | Important caveat |
| --- | --- | --- | --- | --- |
| PeachWeb | Visual no-code/low-code WebGL site builder | Drag-and-drop scene editor; Three.js-based 3D; keyframe animation and interactions; responsive UI/layout and scroll effects; embed/export; hosted publishing/CDN; templates/marketplace; node editor for custom interactions/shaders listed as coming soon | Product workflow reference for combining a 3D scene with normal responsive website UI, scroll behavior, embeddable output and optimization/publishing | Feature page distinguishes current features from the node editor marked “coming soon”; no claims about its internals or actual measured performance |
| Threlte | Open-source developer framework | Declarative/type-safe/reactive Three.js components for Svelte; interactivity/events; plugins/extras; GLTF tooling; Rapier physics; Theatre.js integration; XR support | Optional rendering target for projects that Build Vibe explicitly generates as Svelte and need deeper component/physics/XR integration | Developer framework, not a no-code editor; adopting it for vanilla HTML output would add an unnecessary framework |
| Theatre.js | Motion design/animation authoring library | Sequence editor; dope sheet; graph editor and easing presets; property editing; extensible custom tools/workflows; Three.js, React Three Fiber, HTML/CSS/SVG and custom JS/WebGPU integrations | Optional authoring adapter for timeline/keyframe animation, camera paths and object/property choreography | Does not supply the whole scene editor, asset library, product generator or deployment pipeline |
| Spline | Browser-based interactive 2D/3D design product | Real-time collaborative editing; modeling/sculpting; layered materials; lights/cameras; timeline/state animation; particles/physics; events/actions; game controls; AI scene/object/material editing; text/image-to-3D; AI textures; embed and web/mobile exports; separate 2D interface/graphics canvas (Hana) | Main product/UX benchmark for prompt-to-scene creation, editable AI results, visual editing, interactivity, collaboration and publishing | AI uses plan-based monthly credits; generated detailed meshes can slow scenes; must validate export format/runtime/license before depending on it |

## Ranking by Build Vibe's needs

1. **Spline — best overall reference for product direction.** Most closely matches a user-facing, AI-assisted visual creation workflow with editable results, interaction, collaboration and publishing.
2. **PeachWeb — best reference for 3D website authoring.** Especially relevant to mixing 3D with responsive HTML UI, scroll effects and embedding/publishing.
3. **Theatre.js — best specialist candidate for motion timelines.** Evaluate after Build Vibe defines a stable, versioned animation/scene document.
4. **Threlte — best implementation option for a subset of generated Svelte projects.** Use only when target and capability justify it; not a default for all generated sites.

This ranking is based on product fit, not a universal quality rating. No pricing comparison is included because plans/credits change and the immediate task is implementation strategy.

## Recommended original Build Vibe implementation

### Keep
- Current Three.js runtime and GLTF loader path for vanilla web projects.
- Existing design tokens, visual-intent parser, project generator, motion engine and responsive QA.
- Existing safe-path, authorization, project storage, asset library, deployment, verification and billing/quota boundaries.

### Add in sequence
1. **Scene and asset contract:** typed/versioned scene document for object identity, model/media refs, materials, lights, camera, interactions, keyframes, responsive behavior and publish target.
2. **Natural-language scene edits:** translate text into typed allowlisted operations; show a preview/diff; preserve unrelated scene data; support undo/redo and project-scoped history.
3. **Durable media:** connect user-selected files to the existing authenticated asset/storage path. Until then, label local previews as session-only.
4. **Visual scene editor:** hierarchy/layers, viewport, transform tools, camera/light/material inspectors, asset panel and accessible non-canvas controls.
5. **Timeline:** define a versioned keyframe/easing/trigger format; prototype Theatre.js as an optional authoring adapter, not a default runtime dependency.
6. **Target-aware rendering:** Three.js baseline; optional Threlte for Svelte output only after parity, bundle, SSR, accessibility and generated-artifact tests.
7. **Publishing/collaboration:** use existing deployment adapters, RBAC, audit and version history; implement secure embed policies and explicit conflict behavior before multiplayer editing.

## Plan completion snapshot

This is a repository evidence-based status, not a statement that every planned product feature has been shipped.

| Area | Status | Evidence / remaining work |
| --- | --- | --- |
| Requirements/AppSpec and deterministic generator | Implemented baseline; expansion ongoing | Canonical requirements/planner/generator exists. Add a versioned 3D scene schema and round-trip/migration tests. |
| Basic generated 3D runtime | Implemented baseline | Three.js/GLTF, fallback, accessible controls, reduced-motion handling, render pause and resource cleanup are documented in the current audit. |
| Local image/video/model workflow | Partially implemented | Browser-local inputs/previews and local image texture application exist. Durable upload/storage and publish persistence remain. |
| Natural-language design edits | Partially implemented | Allowlisted color/type/spacing/alignment/radius/visibility operations exist. Arbitrary scene graph edits, object selection/transform and property-aware scene intent remain. |
| Full visual 3D editor | Not complete | Need hierarchy, viewport manipulation, properties inspector, save/reload and keyboard/touch QA. |
| Timeline/dope sheet/graph editor | Not complete | Need native animation contract; then assess Theatre.js integration and runtime cost. |
| Threlte adapter | Not implemented | Optional Svelte-target-only proof of concept; not a launch blocker for vanilla output. |
| Collaboration for scene editing | Not complete | Reuse existing RBAC/audit/version infrastructure; real-time conflict model still needs design and tests. |
| Responsive/browser QA and SEO checks | Automated coverage exists | CI must pass on latest commit; visual screenshot review and real GPU/device testing are still separate evidence requirements. |
| PostgreSQL as primary application store | Not complete / blocked | Async repository methods and tests exist, but legacy routes and Store are still synchronous SQLite. Migrate auth, then projects/conversations; preserve ownership/session semantics. |
| Deployment and native artifact verification | Environment-dependent / incomplete | Existing adapters and preflight are not proof of a real production deployment or device artifact. |
| Live MiroFish and external provider runs | Not configured unless credentials/URL are supplied | Existing contract/status checks do not count as a live run. |

## Current CI issue discovered during this research

The CI run for commit `b222f4b1597436bf19a2fc32d57021beb3d0f0b5` failed during `npm test`: the new repository test asserted that a zero session limit clamps to 1, but the repository's existing contract clamps to 50. The test was corrected in commit `e6b403e9e61c1c88d2e3d2ac43a3e8691123c257`; the latest CI must still be checked before this repair can be considered verified. CodeQL and Dependency Review succeeded on the prior head, but CodeQL had emitted DOM text-to-HTML findings in the generated 3D runtime. Those alerts require review/fix/verification.

## Official references

- PeachWeb features: https://peachweb.io/features
- Threlte docs: https://threlte.xyz/
- Threlte source and MIT license: https://github.com/threlte/threlte
- Theatre.js: https://www.theatrejs.com/
- Spline overview: https://docs.spline.design/basics/what-is-spline
- Spline docs: https://docs.spline.design/
- Spline AI 3D generation: https://spline.design/solutions/ai-3d-generation
