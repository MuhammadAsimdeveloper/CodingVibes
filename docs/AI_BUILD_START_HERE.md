# AI BUILD START HERE — Build Vibe

## Authority
Read these files before changing code:
1. `docs/BUILD_VIBE_LAUNCH_PLAN.md` — authoritative implementation roadmap.
2. `docs/ZEE_TOOLS_ECOSYSTEM_PLAN.md` — canonical 18 utility/tool layer.
3. `docs/INDUSTRY_TOOL_ARSENAL.md` — broader agent/tool fabric.
4. `docs/AI_BUILD_START_HERE.md` — execution rules in this file.

## Mission
Continue the existing Build Vibe architecture; do not rebuild it. Make it a production-grade AI product builder with a canonical Tool/Agent Fabric, verified generation, research, multi-agent execution, SEO/AEO, visual editing, integrations, deployment and operations.

## Ownership
Build Vibe owns canonical web/developer/creation implementations. Aira orchestrates them; Atlas consumes business capabilities; Auto-Vid consumes media capabilities; Asim-OS consumes local adapters. Do not duplicate canonical logic.

## Required execution
1. Inspect git status, branch, package.json, source, tests and existing architecture.
2. Identify the highest unfinished roadmap phase.
3. Implement in small increments.
4. For behavior changes use TDD: failing test → minimal implementation → refactor → full verification.
5. Preserve security/verification gates and truthful NOT_CONFIGURED/BLOCKED states.
6. Never silently replace user work.
7. Update roadmap/checklists as work becomes real.
8. Run the repository's actual checks before claiming completion.
9. Do not mark a feature complete without implementation + tests + verification evidence.
10. If external credentials/infrastructure are missing, build the adapter and tests, then record the exact blocker.

## Reconstruction addendum (2026-10-09)

- The project design system is a source of truth, not just a settings form. Preserve the saved `store.getDesignSystem(project.id,userId)` contract when building; pass it into `spec.styling.designSystem` and apply only validated tokens/allowlisted text edits to generated web CSS.
- Design Mode's text editor uses the editor-authorized `POST /api/projects/:id/design/intent` route. It supports focused color, typography, alignment, radius, spacing and visibility edits; unsupported instructions should return an explicit response, not silently claim success. The UI tells the user that a rebuild applies the edit.
- Generated-site visual selection is opt-in. It is enabled through `?visualEdit=1` or `Alt+Shift+E`, reports the selected element through a bounded custom-event contract, and must not execute arbitrary CSS, inject arbitrary selectors or mutate content silently.
- For 3D experiences, preserve reduced-motion behavior, pause render scheduling when hidden/off-screen, bound media/model inputs and dispose object URLs/materials/textures. An uploaded image may be applied as a local-session texture. Image/video previews are not persistent uploads; durable user assets require the existing authorized asset/storage path.
- Validate current changes with the repository's real scripts: `npm test`, `npm run check`, `npm run seo:check`, `npm run e2e`, `npm run browser:e2e` and the configured launch/ops checks. Report each CI commit SHA. Treat MiroFish/deployment as `NOT_CONFIGURED` unless the provider is actually connected and exercised.

## Priority order
Tool/Agent Fabric → 18 Zee-derived utilities → Teamily-derived multi-agent/memory/automation/studio capabilities → integrations/MCP/OAuth → visual/product depth → cloud/operations → deployment/native → benchmarks/release.

## Definition of done
Code exists, tests prove behavior, security boundaries are enforced, docs describe reality, and the launch matrix says PASS only when evidence exists.

Start building immediately after reading the authority files; do not ask the user to restate this plan.