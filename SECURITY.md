# Security

## Reporting

Please report suspected vulnerabilities privately rather than opening a public issue with exploit details.

Include the affected area, reproduction steps, impact, and any relevant logs or screenshots.

## Secrets

Never commit production API keys, OAuth client secrets, signing credentials, database files, or generated runtime state. Use environment configuration and the repository's secret-safe deployment settings.

For GitHub, enable secret scanning and push protection in repository security settings. This session cannot verify or change those repository-level settings, so their status is **NOT_VERIFIED** until confirmed in GitHub.

## Scope

Security issues in the control plane, generated-project runtime, authentication, deployment connectors, AI gateway, runner fleet, or verification system are in scope for responsible disclosure.

## Service security configuration

In production, set `CODINGVIBES_TRUST_PROXY=true` only when a trusted reverse proxy overwrites `X-Forwarded-For`/`X-Forwarded-Proto`. Use `CODINGVIBES_PUBLIC_URL` and, when needed, `CODINGVIBES_ALLOWED_ORIGINS` to pin browser origins. The public health endpoint intentionally exposes liveness only; detailed readiness diagnostics belong to operators.

A vulnerability reporting route is published at `/.well-known/security.txt`.

## CI security gates

Pull requests are checked by dependency review and CodeQL workflows. Security-critical CI failures are intended to remain fail-closed. Dependabot already covers npm and GitHub Actions updates.

