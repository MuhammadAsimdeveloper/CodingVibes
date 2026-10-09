# Build Vibe dependency security boundary

Build Vibe keeps runner-specific SDKs as optional dependencies so the core control-plane installation can be audited independently from environment-specific runner integrations.

## Core audit

CI enforces:

```bash
npm ci --no-audit --no-fund
npm audit --omit=optional --audit-level=high
```

This is the launch-blocking dependency-vulnerability gate for the core application.

## Optional runner dependencies

The Daytona SDK is optional and is loaded dynamically only when a Daytona runtime is configured. The current npm dependency graph reaches the `braces` package through Daytona's `fast-glob`/Micromatch chain.

The GitHub-reviewed advisory GHSA-vfj7-8cjw-p6xm / CVE-2026-93687 affects braces <=3.0.3 and currently lists no patched upstream release. The dependency is therefore not silently ignored: it is isolated behind the optional runner boundary, explicitly documented, and excluded only from the core dependency gate.

Runner operators must:
- install optional runner dependencies only on isolated runner infrastructure;
- keep untrusted brace/glob patterns out of runner tooling;
- apply updated Daytona/braces releases when an upstream fix becomes available;
- keep the runner sandboxed with CPU, memory, filesystem and network controls.

A production release must not claim zero known dependency vulnerabilities while this advisory remains present in the optional runner graph.

## Dependency checks for animation and 3D modules

For candidate motion/3D or component-library dependencies, follow [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md). Check license and maintenance status, bundle impact, transitive vulnerabilities, browser support, dependency approval policy and graceful failure behavior before adding them.
