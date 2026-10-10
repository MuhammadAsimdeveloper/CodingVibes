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

 
## Current implementation checkpoint — 2026-10-09

- Added the local Tool Fabric registry with 18 stable contracts and typed input/output descriptors.
- Implemented deterministic local execution for SEO metadata and artifact generation, static SEO/accessibility audits, metrics-based performance assessment, JSON formatting and TypeScript generation, guarded regex testing, decoded-only JWT inspection, Base64/binary conversions, color palettes, CSS gradients and a local QR SVG generator.
- Implemented a browser-local Canvas/ImageBitmap image optimizer as a separate adapter. The Node runner returns BROWSER_REQUIRED rather than claiming image compression occurred.
- API testing currently produces a redacted request plan only. The default execution path never sends outbound requests; live network execution remains NOT_CONFIGURED pending a dedicated SSRF-safe runner, timeouts, credential isolation, audit and explicit approval.
- Website audits analyze supplied HTML only. Performance reports require caller-supplied measurements; the registry does not fabricate browser or Lighthouse metrics.
- Local contracts and tests are located in src/tool-fabric/ and test/tool-fabric.test.js. Consume these modules directly; never call Asim Tools over HTTP at runtime.


## Build verification integration — 2026-10-09

- The agent orchestrator now invokes `auditGeneratedProject` after browser smoke/product quality on web builds and records a `tool_fabric_audit` evidence object plus a compact event summary.
- The helper scans public HTML locally with bounds: maximum 40 HTML files by default, maximum 1 MB per file, maximum 2,000 discovered HTML files, no symlink traversal, and per-file overflow statuses. SEO and accessibility findings are advisory evidence; they do not replace Playwright checks or independently approve a release.


## Calculator and date/time suite — 2026-10-10

- Extended the canonical Tool Fabric from 27 to 40 contracts with eight local calculator tools, a dimensional unit converter, duration and age helpers, an IANA time-zone converter, and a decimal/binary data-size converter.
- Executors live in `src/tool-fabric/calculators.js` and are routed through the existing `runTool` dispatcher. Every new tool is local-only and uses bounded input validation and the normal explicit result envelope; no network adapter or duplicate catalog was introduced.
- Focused tests cover numeric outcomes, leap-day age policy, explicit-offset time-zone conversion, decimal versus binary size units, domain validation and fractional break-even rounding. The break-even unit ceiling uses the unrounded contribution margin so rounding the display value cannot understate the quantity required.
- Verification record: implementation revision `4b796eb615ce77d734a66230995c57d353406bb9` passed Build Vibe CI run [37987930669](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37987930669), 309/309 tests, CodeQL run [37987930550](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37987930550), and Dependency Review run [37987930570](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37987930570). This is source/CI evidence only, not proof of configured production infrastructure.


## Hash, checksum, UUID and URL utilities — 2026-10-10

- Added four local contracts: `dev.hash.generate` (SHA-256/384/512, hex/Base64), `security.checksum.verify` (strict digest parsing and fixed-size constant-time comparison), `dev.uuid.generate` (cryptographic UUID v4) and `dev.url.encode` (explicit URI/component encode/decode modes).
- Implementation uses Node built-ins only, runs through the canonical `runTool` envelope, and reports no network use. Hashes are integrity utilities, not password storage or authentication; URL helpers never navigate to or fetch a URL.
- Expanded the canonical catalog from 40 to 44 tools. Focused tests check known SHA-256 output, Base64 output, match/mismatch and invalid checksums, random UUID v4 shape, URL round-trips and bad-input handling.
- Verification record: implementation revision `b65c87d61dab2abc873f8765084c2255240cdf1c` passed Build Vibe CI [37988776436](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37988776436) with 314/314 tests, and passed CodeQL [37988776447](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37988776447) and Dependency Review [37988776485](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37988776485). See the current PR checks for the documentation-inclusive head.

## Local PDF and image conversion — 2026-10-10

- Extended the existing canonical Tool Fabric with `image.to_pdf`; no Asim Tools runtime call or second registry was added.
- The local adapter converts PNG/JPEG payloads to one A4 page per image, with strict MIME/signature checks, 1 MB per-image and aggregate input caps, 20-image count cap, 10,000-pixel edge and 20-megapixel image limits.
- Mixed PNG/JPEG real-fixture tests verify the result can be reopened as a valid multi-page PDF. Malformed, unsupported and over-budget inputs fail explicitly; network use remains false.
- See `docs/PDF_TOOLS.md` for the canonical behavior and current exclusions. PDF compression, raster rendering, text extraction and OCR remain unfinished.
