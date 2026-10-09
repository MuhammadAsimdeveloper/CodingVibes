# Build Vibe security threat model

The control plane treats generated code, imported repositories, user project content, plugins/connectors and web research as untrusted inputs.

| Threat | Primary control | Launch posture |
| --- | --- | --- |
| Path traversal / symlink escape | project path policy and workspace boundary checks | FAIL-CLOSED |
| Command injection | allowlisted command runner and argument arrays; isolated runtime adapters | FAIL-CLOSED |
| SSRF | provider-controlled outbound research/deployment URLs, URL validation and explicit connector configuration | BLOCKED when untrusted target cannot be proven safe |
| XSS | generated content/source remains inside project boundaries; public rendering uses escaping/sanitization contracts | VERIFY |
| CSRF | same-site/secure session settings and origin checks where browser mutation is exposed | VERIFY |
| Prototype pollution | null-prototype sanitizers and rejected constructor/prototype keys | FAIL-CLOSED |
| Unsafe deserialization | bounded JSON parsing and schema validation; provider data never becomes executable instructions | FAIL-CLOSED |
| Secret leakage | secret-aware logs/status, API-token hashing, provider status redaction, analytics key filtering | FAIL-CLOSED |
| Dependency attacks | committed lockfile, npm ci, dependency review and CodeQL | FAIL-CLOSED |
| Prompt injection | external research is evidence-only; imported repository text is untrusted; agent hand-offs include provenance | FAIL-CLOSED |
| Tenant isolation | project/workspace role checks and owner/member authorization | FAIL-CLOSED |
| Resource exhaustion | bounded request bodies, agent concurrency/timeouts/retries/cost budgets, queue limits | FAIL-CLOSED |
| Webhook forgery | provider signature verification in existing billing/connectors | FAIL-CLOSED |
| Provider outage | explicit retry/backoff and BLOCKED provider readiness states | NO-FAKE-SUCCESS |

## Security logging

Security-relevant logs contain identifiers and outcomes, not raw credentials or full private source payloads. Product analytics is intentionally separate from audit/security logs.

## Verification rule

No runtime, artifact, native binary, deployment, research result or managed service connection is reported as verified merely because a code path returned without throwing. The corresponding infrastructure and evidence must exist.

## Additional considerations for imported modules and generated visual assets

The [reconstruction plan](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) requires license/provenance validation and safe handling of imported source, prompts, textures, models and dependencies. Repository files and web-retrieved content are untrusted input. Do not execute arbitrary generated code inside the trusted application process; preserve sandbox isolation, file-path validation, dependency controls and resource limits.
