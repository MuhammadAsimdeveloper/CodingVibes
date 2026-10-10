# Build Vibe Tool Fabric

Date: 2026-10-09

## Purpose and ownership

Build Vibe owns the canonical developer/web/SEO/app-builder tool contracts in `src/tool-fabric/contracts.js`. The executor in `src/tool-fabric/index.js` is local and deterministic by default. The contract catalog is intended for agents and the existing backend; it does not add a generic Tools navigation section to the product.

Every contract supplies a stable ID and aliases, an input/output schema, risk class, execution mode, network/auth/confirmation requirements, timeout, retry policy, audit event, fallback behavior, status, and provenance. Consuming projects should copy the smallest needed module and its tests into their own repository. Do not add a runtime call to Asim Tools or a GitHub-source fetch.

## Canonical contracts

| ID | Execution mode | Current behavior / boundary |
|---|---|---|
| `seo.meta.generate` | local | Escaped title, description and optional canonical-tag generation |
| `seo.sitemap.generate` | local | Validates absolute HTTP(S) URLs, removes duplicates and emits XML |
| `seo.robots.generate` | local | Creates robots.txt rules after path/newline validation |
| `design.favicon.generate` | local | Generates escaped, dependency-free SVG icon markup |
| `seo.og.generate` | local | Escaped Open Graph and Twitter card tags |
| `seo.audit` | local | Static inspection of supplied HTML; it does not crawl a URL |
| `web.performance.audit` | local | Scores supplied numeric browser/Lighthouse metrics; without metrics returns NEEDS_BROWSER_METRICS |
| `web.accessibility.audit` | local | Static HTML checks; it does not replace browser, screen-reader or human testing |
| `image.optimize` | browser | Studio Content & data optimizer; local Canvas/ImageBitmap only; raster input allowlist, 25 MiB input cap and 50 MP decoded-pixel ceiling; Node invocation returns BROWSER_REQUIRED |
| `json.format` | local | JSON parsing, validation and deterministic pretty printing |
| `json.typescript` | local | Deterministic interface generation from JSON values |
| `api.test` | adapter | Produces a redacted request plan; live outbound HTTP is NOT_CONFIGURED and no request is sent |
| `regex.test` | local | Bounded input and conservative rejection of common catastrophic regex shapes |
| `jwt.inspect` | local | Decodes JWT header/payload only; signature verification is always false |
| `encoding.base64-binary` | local | Base64 and 8-bit binary conversions over UTF-8 text |
| `design.color.palette` | local | Generates validated HEX tint/shade/complement palette |
| `design.css.gradient` | local | Validates HEX stops and returns a bounded CSS linear-gradient |
| `qr.generate` | local | Dependency-free QR Code Model 2, byte mode, error-correction L, versions 1–4; ASCII payload up to 78 bytes |
| `text.count` | local | Unicode code points, UTF-16 units, UTF-8 bytes, words, lines and paragraphs |
| `text.case.convert` | local | Explicit lower/upper/title/sentence/camel/Pascal/kebab/snake/constant casing modes |
| `text.lines.sort` | local | Stable ascending/descending line sorting, optional case-insensitive comparison |
| `text.duplicates.remove` | local | Stable duplicate-line removal; preserves first occurrence and optional trimming/case-folding |
| `text.replace` | local | Literal-only first/all replacement, no user-controlled regex, bounded replacement count/output |
| `text.diff` | local | Bounded line-based diff, up to 500 lines per side |
| `text.whitespace.clean` | local | Line-ending/trailing-space/blank-line normalization or whitespace collapse |
| `text.slug.generate` | local | Bounded ASCII slugs with combining-mark removal and empty-result rejection |
| `text.unicode.inspect` | local | Unicode code points, UTF-16 offsets and UTF-8 bytes, capped at 1000 code points |
| `calc.percentage` | local | Percentage-of-value calculation with bounded finite numbers |
| `calc.ratio` | local | Simplifies positive ratios to six decimal places and returns share percentages |
| `calc.discount` | local | Discount amount, discounted price and optional post-discount tax |
| `calc.profit_margin` | local | Profit and margin from supplied revenue and cost |
| `calc.roi` | local | ROI percentage and gain from supplied investment values |
| `calc.break_even` | local | Contribution margin and exact/rounded-up units at break-even |
| `calc.compound_interest` | local | Bounded compound-interest estimate from supplied assumptions |
| `calc.loan` | local | Fixed-payment amortization estimate; excludes fees and variable-rate changes |
| `convert.units` | local | Length, mass, volume, elapsed-time and temperature conversions; dimensions must match |
| `time.duration` | local | Converts fixed elapsed-time units; calendar months/years are excluded |
| `time.age` | local | Calendar age between strict YYYY-MM-DD dates; leap-day policy is explicit |
| `time.timezone` | local | Converts a supplied ISO-8601 instant with explicit offset between IANA zones |
| `data.size.convert` | local | Decimal SI and binary IEC byte units with safe-integer limits |
| `data.json.csv` | local | Converts bounded arrays of JSON objects to RFC-style CSV with stable first-seen columns, quoted nested values and spreadsheet-formula string neutralization |
| `data.csv.json` | local | Parses bounded RFC-style CSV with strict quoting, safe unique headers, consistent record widths and JSON output limits |
| `data.json.yaml` | local | Serializes bounded JSON text to conservative YAML with quoted strings, safe keys, nesting/node caps and output-size checks |
| `dev.hash.generate` | local | SHA-256/SHA-384/SHA-512 text digests in hex or Base64; not for password storage |
| `security.checksum.verify` | local | Validates supplied digest encoding and compares fixed-size digests in constant time |
| `dev.uuid.generate` | local | Cryptographically secure UUID v4 generation using Node crypto |
| `dev.url.encode` | local | Explicit encode/decode URI and component modes; does not navigate or fetch URLs |
| `dev.timestamp.convert` | local | Converts strict ISO-8601 instants with explicit offsets to Unix seconds/milliseconds and back, validating calendar fields and timestamp bounds |
| `pdf.info` | local | Bounded PDF metadata, page count, dimensions and rotations from supplied Base64; rejects malformed/encrypted PDFs |
| `pdf.merge` | local | Merges 2–10 PDFs in order, capped at 1 MB combined input, 200 pages and 2 MB output |
| `pdf.split` | local | Extracts selected one-based pages into separate one-page PDFs; bounded aggregate outputs |
| `pdf.rotate` | local | Rotates all or selected pages by validated right-angle multiples |
| `pdf.reorder` | local | Reorders all pages by a complete unique one-based permutation; preserves page-level rotation/dimensions and basic metadata |
| `image.to_pdf` | local | Converts 1–20 bounded PNG/JPEG images into one A4 PDF page per image; validates Base64, MIME/signature, dimensions and total bytes before embedding |


## Local calculator, converter and date/time tools

The calculator tranche is deterministic and local-only. It adds eight finance/math helpers (`calc.percentage`, `calc.ratio`, `calc.discount`, `calc.profit_margin`, `calc.roi`, `calc.break_even`, `calc.compound_interest`, `calc.loan`), one unit converter (`convert.units`), two time helpers (`time.duration`, `time.age`), an IANA time-zone conversion helper (`time.timezone`), and decimal/binary data-size conversion (`data.size.convert`). All 13 tools declare contracts before execution is enabled and share `runTool` error envelopes.

Inputs must use finite JSON numbers rather than numeric strings; each operation applies explicit domain bounds. Money-like outputs are rounded to cents. The loan calculator estimates fixed-rate amortization only; it does not include fees, insurance, taxes, changing rates or lender-specific rules. Ratio inputs must be positive and are simplified at six decimal places. Unit conversions reject mismatched dimensions. Duration conversions use fixed seconds and intentionally do not guess the duration of calendar months or years. Age dates require valid `YYYY-MM-DD` values; a February 29 birthday is treated as February 28 in non-leap years. Time-zone conversion requires an ISO-8601 timestamp with `Z` or an explicit offset and validates both zones through the host's IANA/Intl database. Data-size conversion distinguishes decimal SI units (KB=1000 bytes) from binary IEC units (KiB=1024 bytes) and rejects values beyond JavaScript's exact integer range.

No tool reads financial accounts, contacts a lender, performs market lookup, writes user files, or makes network calls. Results are arithmetic estimates from the supplied inputs, not financial, tax or lending advice. Regression tests live in `test/tool-fabric-calculators.test.js`.

**Verification record:** implementation revision `4b796eb615ce77d734a66230995c57d353406bb9` passed Build Vibe CI run [37987930669](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37987930669), 309/309 tests, coverage, syntax/release checks, SEO, server/browser E2E and launch-gate steps. CodeQL [37987930550](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37987930550) and Dependency Review [37987930570](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37987930570) passed on the same source revision. Results are arithmetic estimates from the supplied inputs, not financial, tax or lending advice. Regression tests live in `test/tool-fabric-calculators.test.js`.

## Local JSON-to-CSV conversion

The `data.json.csv` contract converts an array of JSON objects to CSV without network calls or external dependencies. Columns are the first-seen union of row keys; missing and null values become empty cells, booleans and finite numbers use their JSON text forms, and nested arrays/objects are serialized as compact JSON. CSV fields containing commas, quotes or newlines are quoted and embedded quotes are doubled. Records use CRLF separators.

The converter is bounded to 10,000 rows, 200 columns, 500 KB serialized input, 100 KB per cell and 1 MB output. It rejects invalid row shapes, unsupported values, circular structures, excessive nesting, prototype-sensitive keys and unrecognized options. String cells and headers that begin with spreadsheet formula markers are prefixed with an apostrophe; numeric values remain numeric text. The result reports the columns, row count, byte length and number of sanitized cells, and emits a warning when formula-like text was neutralized.

Focused regression tests live in `test/tool-fabric-data-conversion.test.js`, including quotes/newlines, sparse columns, nested values, formula-injection handling, invalid input and resource limits.

## Local JSON-to-YAML conversion

The `data.json.yaml` contract accepts JSON text and emits conservative YAML 1.2-compatible block notation. Every string scalar and mapping key is double-quoted using JSON-compatible escaping, avoiding YAML's ambiguous plain-string forms (such as `yes`, `null`, values with colons, or leading special characters). Booleans, finite numbers and null remain typed scalars. Nested objects and arrays are emitted as indented block mappings/sequences; empty containers use `{}` and `[]`.

Input is limited to 500 KB, nesting to 20 levels, total values to 100,000, and YAML output to 1 MB. Invalid JSON, prototype-sensitive keys, unsupported values and unknown options fail explicitly. No YAML parser dependency or network request is used. Tests in `test/tool-fabric-data-conversion.test.js` cover nested output, ambiguous strings, scalar types, unsafe keys and resource limits.

The reverse `data.csv.json` contract parses RFC-style quoted fields, doubled quotes, CRLF/LF record separators, BOM-prefixed files, multiline cells and trailing empty cells. It returns string-valued row objects and a compact JSON string. Headers must be non-empty, unique and not prototype-sensitive; every record must match the header width. It rejects malformed quoting, lone CR separators, unsupported options and over-budget rows, columns, cells, input or output. Empty cells remain empty strings; the converter does not guess number, date or boolean types. Regression coverage for this path is in the same test file.

## Local hash, checksum, UUID and URL tools

The developer-utility tranche adds `dev.hash.generate`, `security.checksum.verify`, `dev.uuid.generate`, and `dev.url.encode`. Hash generation permits only SHA-256, SHA-384 and SHA-512 and supports hex/Base64 output. Checksum verification parses a supplied digest strictly, rejects unsupported encodings and digest lengths before comparison, and uses Node's fixed-size `timingSafeEqual`. UUID v4 uses the cryptographic random generator. URL operations require an explicit mode (`encode-component`, `decode-component`, `encode-uri`, or `decode-uri`) and malformed inputs return `INVALID_INPUT`.

Timestamp conversion requires an explicit mode. ISO inputs must include `Z` or a numeric `±HH:MM` offset, validate the actual calendar date and time, and are limited to millisecond precision. Unix-seconds input may be fractional to millisecond precision; Unix-milliseconds input must be a safe integer. Unsupported modes and out-of-range dates fail explicitly.

These helpers process only user-supplied strings and make no network calls. Hashes and checksums are for integrity verification; they are **not password storage or password authentication**. No URL is opened or fetched by the encoder.

**Verification record:** implementation revision `b65c87d61dab2abc873f8765084c2255240cdf1c` passed Build Vibe CI [37988776436](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37988776436): 314/314 tests, 0 failed/skipped, coverage, syntax/release checks, SEO, server/browser E2E and all configured operations gates. CodeQL [37988776447](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37988776447) and Dependency Review [37988776485](https://github.com/MuhammadAsimdeveloper/CodingVibes/actions/runs/37988776485) also passed on that revision. The later documentation-only head receives a fresh CI run before merge.

## Output envelope

Successful runs return `{ ok: true, status: "COMPLETED", tool, version, output, warnings, provenance }`. Errors use explicit states such as UNKNOWN_TOOL, INVALID_INPUT, INPUT_TOO_LARGE, BLOCKED, BROWSER_REQUIRED, NEEDS_BROWSER_METRICS, and NOT_CONFIGURED. Failure states must not be presented as successful execution.

## Security and privacy rules

- Maximum serialized input size is 1 MB.
- Local tools do not make network requests.
- API plans block syntactically local/private/reserved targets and never return secret header values or query values. Because the live runner is not configured, there is no DNS resolution or request dispatch in this module.
- If live API execution is added later, URL validation must be repeated inside the dedicated runner after DNS resolution, with redirect re-validation, private-IP protection, strict timeouts/response-size limits, secret isolation, explicit confirmation and an audit record.
- Static SEO/accessibility checks only report signals detectable in provided HTML. They must not be labelled full browser audits.
- Performance scoring consumes measurements supplied by the caller, not guessed results.
- JWT payloads are untrusted and never verified by this tool.
- Image bytes stay in-browser in the Canvas adapter; no upload or remote optimizer is used.
- QR generator currently rejects non-ASCII text until a proper ECI strategy is implemented, to avoid output whose text encoding scanners may interpret inconsistently.

## Verification

Focused tests live in `test/tool-fabric.test.js`; `npm test`, `npm run test:coverage`, `npm run check` and the existing end-to-end/security/deployment-preflight gates remain required before merge. An available adapter or source code alone is not evidence that a production provider, browser runner, payment gateway or deploy target is configured.


## Build-verification integration

For web-node and web-pwa builds, `src/agent/orchestrator.js` runs `src/agent/tool-fabric.js` after the existing browser smoke test and product-quality audit. It stores a `tool_fabric_audit` evidence record and emits a `tool_fabric_audit_completed` event containing counts and truncation status. Static findings are advisory, not a substitute for the existing release gates.

The helper scans only files under a real `public/` directory, skips symlinks, limits scans to 40 pages and 1 MB per file by default, and bounds directory discovery at 2,000 HTML files. Missing or symlinked public directories are reported as skipped rather than followed.

## Authenticated backend API

The existing authenticated Build Vibe backend exposes the catalog at `GET /api/tool-fabric/catalog` and local tool execution at `POST /api/tool-fabric/execute`. Requests use the current session cookie, are rate-limited (60 executions/minute per account), and create an audit event containing tool/status/execution metadata and input/output field names only—not input values or generated output contents. Unknown tools, malformed inputs and each tool's explicit non-success status remain visible. Live outbound HTTP execution is disabled; API testing only returns an SSRF-conscious request plan.


## Bounded pipeline composition

Local tools can be composed through `runToolPipeline({ steps })` or the authenticated `POST /api/tool-fabric/pipeline` endpoint.

A pipeline contains 1–10 steps. Each step has a unique identifier, a canonical tool ID (or alias), and an object input. A value may reference a previous step's output with a single-key object such as `{"$ref":"format.output.formatted"}`. References cannot point forward, address the prototype-sensitive keys `__proto__`, `constructor` or `prototype`, or use undeclared properties. Every step is preflighted before execution. Only low-risk local tools are allowed; browser tools and network/confirmation adapters are rejected before any step starts.

Execution is sequential and fail-fast. If a tool does not return `COMPLETED`, the pipeline returns `STEP_FAILED` with the failing step and original status and does not execute later steps. The request is capped at 1 MB and cumulative serialized step outputs at 2 MB. The executor reports `networkUsed: false`; it never activates an external adapter.

The API uses the existing authenticated session and per-account tool rate limit. Audit events contain status, bounded tool IDs, step counts and duration only. They exclude step inputs and output values.

Example request:

```json
{
  "steps": [
    { "id": "format", "tool": "json.format", "input": { "text": "{\"name\":\"Build Vibe\"}" } },
    { "id": "types", "tool": "json.typescript", "input": { "json": { "$ref": "format.output.formatted" }, "rootName": "Product" } }
  ]
}
```

The current boundary is deliberately local-only. Adding live network or browser actions to a pipeline requires their own governed runner, risk/confirmation policy and separate verification evidence; pipeline composition does not bypass those boundaries.


## Studio image optimizer

The authenticated Studio Content & data tab exposes the `image.optimize` browser-local capability. Choose a raster image, output format (WebP/JPEG/PNG), quality (10–100%), and maximum dimension (64–8192 px), then optimize and download the resulting file. Supported input MIME types are PNG, JPEG, WebP, GIF, AVIF and BMP; SVG is intentionally rejected. Inputs must be non-empty and no larger than 25 MiB, and decoded images are capped at 50 megapixels.

The single canonical implementation is served from `public/tool-fabric-browser.js`; `src/tool-fabric/browser.js` re-exports it for Node-side verification. No image bytes are uploaded. The adapter rejects an encoder that returns a different MIME type than requested rather than giving the user a mislabeled extension. Object URLs created for previews are revoked when replaced and when the Studio page is left. Unsupported browser APIs or image formats produce explicit errors instead of simulated success.

Verification lives in `test/image-optimizer-ui.test.js`: it covers resize/output metadata, non-image/SVG/empty/oversized inputs, unsupported output encoders, no network calls, Studio control accessibility, and local-only UI wiring.


### Browser E2E

CI runs `npm run browser:image-optimizer` after installing Playwright Chromium. The test loads the real Studio module from a local-only HTTP harness, creates and downloads a 1x1 WebP preview from a valid PNG, rejects SVG input while preserving the previous preview, checks browser errors, and asserts that image processing made no API requests.


## Browser performance evidence

The Playwright browser smoke runner records real navigation timings, first-contentful paint, observed resource transfer sizes, JavaScript/image byte subtotals where resource timing is complete, render-blocking resource counts when the browser exposes them, Largest Contentful Paint and Cumulative Layout Shift when their observers return data. Cross-origin timing entries without readable size values are marked incomplete rather than treated as zero-byte resources.

The runner deliberately does **not** label a navigation-only measurement as Interaction to Next Paint (INP). It records observed interaction duration for diagnostics, but INP remains missing unless a real interaction/Lighthouse measurement is supplied. The Tool Fabric threshold evaluator now returns `complete:false`, `missingMetrics` and a `metrics_incomplete` finding when metrics are absent instead of reporting a false full pass. Per-route browser verification includes the measured evidence and threshold assessment; this is not a Lighthouse score.


## Bounded local PDF suite

The canonical local document adapter lives in `src/tool-fabric/pdf.js` and is registered through the existing `contracts.js` and `runTool()` executor. The implemented operations are `pdf.info`, `pdf.merge`, `pdf.split`, `pdf.rotate`, `pdf.reorder` and `image.to_pdf`. PDF inputs must be canonical Base64 with a PDF signature; each source is limited to 1 MB, merge inputs total no more than 1 MB, documents are limited to 200 pages, output to 2 MB, and merge accepts 2–10 documents. Malformed or encrypted PDFs are rejected. Reorder accepts only a full permutation of every page exactly once, expressed as 1-based page numbers. Image-to-PDF accepts 1–20 PNG/JPEG images, 1 MB per image and combined, 10,000-pixel maximum edge and 20 megapixels per image. Images are aspect-fit to portrait or landscape A4 pages with a 24-point margin. Every operation is local-only and returns `networkUsed:false`.

PDF compression, PDF-to-image rendering, text extraction, OCR, redaction and decryption are not implemented by this suite. Do not mark these functions ready or route them to the current adapter until each has a bounded implementation, real fixtures, parser/rendering limits and security tests. High-volume processing of untrusted PDFs should move to a resource-isolated worker before production exposure.
