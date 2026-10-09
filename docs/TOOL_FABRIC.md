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
