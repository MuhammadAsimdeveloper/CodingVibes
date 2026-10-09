# Asim Tools Module Plan — CodingVibes

Date: 2026-10-09

## Role
Developer/web/SEO/app-builder backend.

## Integration rule
Use **local copied modules** from `MuhammadAsimdeveloper/Our-Tools-`. Do not call Asim Tools at runtime, do not link to tool pages for execution, and do not add a standalone Tools section in this product. Copy the smallest deterministic implementation and focused tests into this repository's existing backend/service structure. Preserve validation, privacy boundaries and explicit network behavior.

## First local module tranche

| Family | Canonical source | Initial copied capability | Runtime / safety rule |
|---|---|---|---|
| Text | `Our-Tools-/src/tools.js` | Slugification, line sorting/uniqueness, trim/collapse whitespace, text diff | Deterministic local only |
| Developer / encoding | `Our-Tools-/src/tools.js` | JSON format/validation, JSON-to-TypeScript, Base64/hex/binary, UUID | Bound input size; no network |
| Security | `Our-Tools-/src/tools.js` | JWT payload inspection, secret-pattern scan | Decoding is not signature verification; do not transmit secrets |
| SEO & Web | `Our-Tools-/src/tools.js` | Meta, robots, sitemap, Open Graph metadata, URL/tag extraction | Generation only; network crawling requires a separately hardened adapter |
| Design | `Our-Tools-/src/tools.js` | Color conversion/palette, WCAG contrast, gradient generation, favicon SVG | Escape markup; validate colors before interpolating |
| API & Testing | `Our-Tools-/src/advanced-tools.js` | OpenAPI document/operation validation and request-plan generation | No outbound fetch in this tranche; credentials never included in logs |
| Image / QR / Browser | `Our-Tools-/src/advanced-tools.js` (selective) | Browser-local processing contracts only | Keep client APIs as explicit BROWSER_REQUIRED until actual runtime verification exists; no fake server-side compression, QR encoding or remote browser success |

## Ownership and privacy
- Build Vibe owns the canonical creation and developer/web capabilities; this file records the minimum subset copied here.
- Aira consumes named contracts and handles permissions/orchestration; it must not duplicate business logic.
- Atlas consumes capabilities through local adapters, with tenant-scoped execution.
- There is no runtime HTTP, iframe, or GitHub dependency on Asim Tools.
- Every behavioral copy must include a local test and an internal provenance comment retaining the canonical tool ID.

## Implementation order
1. T0 contract and failing tests.
2. T1 deterministic local utilities and named registry.
3. T2 SEO/document-generation helpers.
4. T3 static SEO/accessibility audits and metrics-based performance reports.
5. T4 browser-only image and QR adapters, explicitly BROWSER_REQUIRED until actual browser runtime verification exists.
6. T5 cross-product adapter manifests (no duplicate logic).

## Current evidence
- Repository CI on `main` is currently blocked by a missing visual-intent module and missing generated visual-selection runtime. Fixes should land on an isolated branch and rerun the full CI gates.
- Production runner/toolchain credentials and infrastructure remain environment-dependent and must not be marked configured based only on source code.
