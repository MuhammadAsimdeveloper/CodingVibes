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

## Priority order
Tool/Agent Fabric → 18 Zee-derived utilities → Teamily-derived multi-agent/memory/automation/studio capabilities → integrations/MCP/OAuth → visual/product depth → cloud/operations → deployment/native → benchmarks/release.

## Definition of done
Code exists, tests prove behavior, security boundaries are enforced, docs describe reality, and the launch matrix says PASS only when evidence exists.

Start building immediately after reading the authority files; do not ask the user to restate this plan.

## Mandatory generated-site checklist context (2026-10-10)

Before implementing or changing website generation, read [`GENERATED_WEBSITE_QUALITY_GATE.md`](GENERATED_WEBSITE_QUALITY_GATE.md). It is the current source-inspection status and development plan for the 20-point generated-site checklist. Preserve existing SEO helpers, discoverability audit, product-quality contracts, motion/accessibility baseline, and verification gates. Do not claim universal support from source-level presence; implement artifact/HTTP/browser tests and update the status only when evidence exists. Critical generated-site failures must block publishing. Never invent owner contact data, analytics configuration, or legal facts.


## Latest verified checkpoint (2026-10-11)

- Repository recovery confirmed newer commits had already completed the previously visible contact/analytics and image-optimizer work; do not replay those commits.
- Generated-site browser verification now measures each route at 375px mobile, 768px tablet and 1440px desktop widths. Horizontal overflow fails the browser quality result and includes diagnostics.
- Fixed the generated owner-admin page's long configuration hint overflow. Full CI passed on `29f57ebea72a9725e3ac62cc73ea035d3f45732f`: https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/38080632604.
- Next priorities: platform-specific favicon/app icon sizes; optimize generated raster assets as part of export rather than only in the browser-local optimizer; extend accessibility and responsive budgets; keep real provider credentials, monitoring, backup/recovery and deployment evidence explicit.
- Continue TDD from the first unfinished item. Do not mark launch-ready based only on source presence or CI; verify configured production services separately.


## Latest implementation checkpoint — platform icons (2026-10-11)

- Added deterministic PNG generation for Apple touch (180×180), PWA (192×192), and maskable PWA (512×512) assets, keeping the SVG favicon as a fallback.
- Generated public pages, custom 404, admin and sign-in now reference the icon set; the manifest is emitted once and contains the two PNG install sizes.
- Tests verify PNG dimensions/decompression, generated output, manifest entries, MIME type and served asset dimensions.
- Full CI passed on `588156e398bd643c7ed3bd7a5a17979983bea329`: https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/38081225750.
- Continue from the next unfinished roadmap item: generated-export raster optimization. Do not confuse the existing browser-local image optimizer with automatic optimization during export. Keep accessibility budgets and production environment/credentials/monitoring/recovery open until evidenced.
