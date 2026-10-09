# Zee-Inspired Tool Ecosystem Plan

Date: 2026-10-07

Zee AI Tools presents 170+ browser utilities across SEO, developer, media, PDF, AI and general utility categories. We are selectively implementing the 18 high-value tools already identified for our ecosystem, not copying the full catalog. urlZee AI Toolshttps://zeeaitools.com/

## Canonical ownership matrix

| Tool | Build Vibe | Aira | Atlas | Auto-Vid | Web Agency | Asim-OS |
|---|---|---|---|---|---|---|
| SEO Meta Generator | Own | Route | Consume | — | Consume | — |
| Sitemap Generator | Own | Route | Consume | — | Consume | — |
| robots.txt Generator | Own | Route | Consume | — | Consume | — |
| Favicon/App Icon Generator | Own | Route | Consume | — | Consume | Local |
| OG/Social Preview | Own | Route | Consume | Consume | Consume | — |
| SEO Auditor | Own | Route | Consume | — | Consume | — |
| Performance Auditor | Own | Route | Consume | — | Consume | — |
| Accessibility Auditor | Own | Route | Consume | — | Consume | — |
| Image Optimizer | Own | Route | Consume | Consume | Consume | Local |
| JSON Formatter/Validator | Own | Route | Consume | — | — | Local |
| JSON → TypeScript | Own | Route | Consume | — | — | Local |
| API Tester | Own | Route | Consume | — | — | Local |
| Regex Tester | Own | Route | Consume | — | — | Local |
| JWT Inspector | Own | Route | Consume | — | — | Local |
| Base64/Binary | Own | Route | Consume | — | — | Local |
| Color Palette | Own | Route | Consume | Consume | Consume | Local |
| CSS Gradient | Own | Route | Consume | Consume | Consume | Local |
| QR Generator | Own | Route | Consume | Consume | Consume | Local |

## Rules
1. Build Vibe/CodingVibes is the source of truth for shared web/developer implementations.
2. Aira receives all 18 through safe named-tool contracts; it does not become a second implementation repository.
3. Atlas, Auto-Vid, the Web Agency and Asim-OS consume capabilities only where they advance their existing products.
4. Do not copy Zee code, branding, text, testimonials or proprietary assets; reimplement behavior from public requirements.
5. Prefer local processing for privacy-sensitive tools and document every network boundary.
6. Every behavioral implementation follows test-first development.

## Build order
T0 Contracts → T1 developer tools → T2 website foundation → T3 audits → T4 asset pipeline → T5 ecosystem integrations.

## Definition of done
All 18 tools have contracts, tests, Build Vibe implementations, Aira routing metadata, ownership documentation and truthful runtime status.


## Implementation checkpoint — 2026-10-09

The canonical catalog exposes 18 unique tool contracts with explicit owners, categories, input/output schemas, privacy/execution mode, network and confirmation flags, risk, timeouts/retries, audit event, fallback and implementation status.

Executable locally today: dev.json.format, dev.json.typescript, dev.base64 and security.jwt.inspect. These adapters are bounded, run on the Build Vibe server without third-party egress and do not persist input or output payloads in audit events. JWT inspection is decode-only and does not verify a signature.

Contract-only / not available: the remaining 14 tools are visible as planned; the local execution endpoint responds tool_not_available and does not improvise a network request. Network execution still requires an allowlisted outbound adapter, SSRF controls, explicit user consent, timeouts, response-size limits and audit/verification tests.
