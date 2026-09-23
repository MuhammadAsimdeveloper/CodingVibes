# codingVibes

**AI coding platform that ships VERIFIED software, not just code.**

codingVibes turns natural-language product requirements into a target-aware application contract, plans and model-generates the correct project shape, uses bounded repository context, executes web builds in an isolated preview runtime, performs target-specific source/toolchain verification for mobile/native/desktop projects, runs bounded AI repair when configured, and leaves the changeset reviewable before an explicit commit.

## Core architecture

```text
Browser
  -> Node HTTP API + session auth
  -> SQLite project/session/run persistence
  -> model provider router
  -> AppSpec planner
  -> project-local Git repository
  -> isolated cv/<run-id> worktree
  -> controlled file operations
  -> Daytona / Docker / local preview runtime
  -> check + test + HTTP smoke + optional Playwright
  -> evidence.v2 + diff
  -> bounded repair loop
  -> explicit commit
```

## Start locally

```bash
cp .env.example .env
# set CODINGVIBES_SESSION_SECRET in .env
npm install
npm test
npm run check
npm run e2e
npm start
```

Open `http://127.0.0.1:4400` and create an account.

The deterministic planner works without a hosted model credential. For model-driven planning/repair configure a provider and model. `CODINGVIBES_PROVIDER=ollama` and `CODINGVIBES_PROVIDER=lmstudio` support local OpenAI-compatible servers; OpenRouter, Anthropic Messages API, and custom OpenAI-compatible base URLs are supported through the same router.

## Runtime modes

Development defaults to `local`. Production defaults to `daytona`.

`container` uses Docker with network disabled, CPU/memory/PID limits, dropped Linux capabilities, no-new-privileges, a read-only project mount and a temporary filesystem for `/tmp`.

`daytona` uses the official `@daytona/sdk`. Configure `DAYTONA_API_KEY` plus optional `DAYTONA_API_URL` and `DAYTONA_TARGET`.

## Supported build targets

codingVibes now has first-class target profiles for Node web apps, installable PWAs, Android Trusted Web Activity wrappers, Expo/React Native, Flutter/Dart, native Android/Kotlin, SwiftUI, Electron, Tauri/Rust, and Kotlin Multiplatform. The planner detects these from the prompt or the target selector and the model receives the exact target contract. Native artifacts are never marked verified unless the required toolchain and an isolated target runner actually complete the build.

The target catalog mirrors the current platform landscape: Expo/EAS can produce Android/iOS binaries; Kotlin Multiplatform spans Android/iOS/desktop/web/server; SwiftUI spans Apple platforms; Trusted Web Activity can package web content for Android. citeturn393736search0turn757531search0turn757531search1turn757531search8

## Verified build contract

A changeset cannot be committed through the UI unless verification has passed. Verification records:

- generated contract and acceptance criteria,
- `npm run check`,
- generated application tests,
- HTTP smoke for every generated page/API,
- browser verification when enabled,
- repair attempts and their bounded limit,
- Git branch, status and diff.

After editing a generated file in the UI, its changeset moves back to `needs_verification` until re-verified.

## Security model

Repository content is untrusted data, never an instruction source. File paths reject traversal, null bytes and symlink escapes. Mutating requests are same-origin checked. Sessions are signed and HTTP-only. Dangerous Git actions require explicit confirmation. Public production use should run generated code in Daytona or the hardened container runtime rather than on the host.

## Design and UI quality layer

The application contract now carries an explicit design-system intent: palette, typography family, radius language, elevation, layout pattern, motion preset, accessibility expectations, responsive breakpoints, and 3D/canvas/glass/parallax effects. When browser verification is available, codingVibes also checks document title, language, viewport metadata, headings, image alt text, accessible control names, internal links, and horizontal overflow in addition to console/request failures.

This follows the direction of current AI design/build systems that combine prompt generation with visual refinement and code-backed editing, such as Figma Make, Webflow AI, and Wix Harmony. citeturn985444search0turn889226search0turn889226search2

## Launch-candidate product layer

Version 3.0 adds the product controls needed around the verified software loop: free/pro/team plan definitions, monthly run/token quotas, Stripe Checkout and signed webhook handling, explicit dependency approval before networked package installation, production readiness checks at `/ready`, durable checkpoints, cancellation/resume, connector health, GitHub import, and actionable diagnostics.

The research synthesis is documented in `docs/RESEARCH_SYNTHESIS.md`. Multi-agent parallelism, deep screenshot-diff infrastructure and one-click multi-cloud deployment remain later scale features rather than prerequisites for the core verified build workflow.

## External setup still required for a public launch

The application code is launch-candidate quality, but a public deployment still needs real infrastructure: a secure session secret, a model provider, isolated Daytona/Docker execution, TLS/reverse proxy, persistent storage/backups, monitoring, quota enforcement, browser verification, and (for paid plans) Stripe price IDs plus a webhook secret. `/ready` exposes the remaining deployment blockers without revealing credentials.

## Current build phase

The current 2.5 build adds model-first application generation, bounded repository context, visual-intent extraction for animation/3D/glass/editorial and related styles, protected generated-file paths, hashed tool-call snapshots, and session restoration in the UI. The deterministic generator remains the offline fallback.

For model-first generation, use a configured OpenAI-compatible provider, OpenRouter, Ollama, LM Studio, or a compatible custom endpoint. Generated projects are still constrained to the supported Node/browser runtime contract and must pass verification before commit.

## Native/mobile verification runners

Version 2.3 adds isolated native execution instead of pretending source generation is equivalent to a verified binary. Android/Gradle, Flutter, and Rust/Tauri can run in disposable Docker runners with network disabled, resource limits, dropped capabilities, and a writable project mount. Expo/React Native can use EAS cloud builds, and iOS/SwiftUI uses a configured macOS runner because Xcode requires macOS. Built APK/AAB/desktop artifacts are hashed, copied into the artifact store, and can be uploaded through the configured artifact endpoint. Android artifacts can be installed and smoke-tested with `adb` when a real emulator/device is attached to the isolated runner.

See `docs/NATIVE_RUNNERS.md` for configuration and runner boundaries.

### Acceptance scenario

A representative high-complexity prompt is:

> Create a 3D style forest that contains my online store items hanging on trees with product details and a purchase option, with a complete Stripe payment method added. Make it immersive, animated, responsive, accessible, and production-ready.

The requirements layer now extracts 3D intent, commerce pages, Stripe checkout/webhook routes, product/order entities, payment safety acceptance criteria, and visual/runtime acceptance checks. The regression suite generates a runnable fallback and verifies the generated acceptance project. A real Stripe transaction is intentionally not faked: live payment verification requires the user’s Stripe credentials and provider environment.

## Runner fleet hardening (2.5)

Native verification now uses a hardened runner-fleet contract: dependency egress is restricted to named `codingvibes-deps-*` networks, production runner images can be required to be digest-pinned, child processes inherit only an allowlisted environment by default, native jobs have bounded leases/timeouts, dependency caches are keyed and isolated, artifact uploads have HTTPS/size/timeout controls, Android device verification validates APK checksums and captures failure diagnostics, and the macOS Xcode runner accepts a fixed versioned job schema rather than arbitrary commands.

Self-hosted GitHub runners should remain private/restricted. GitHub documents that self-hosted runners can be compromised by untrusted workflow code and recommends limiting their access and treating their environment as security-sensitive.

See `docs/RUNNER_FLEET_SPEC.md` for the v2.5 execution lifecycle, capability matrix, artifact contract, device verification contract, and production gates. The authenticated `GET /api/fleet` endpoint and `npm run fleet:doctor` expose runner readiness without exposing secrets.

## 2.6.0 fleet hardening

The runner fleet now has durable runner registration/heartbeat state, sanitized disposable native workspaces, durable artifact metadata and authenticated artifact downloads, plus macOS protocol v3 with simulator tests before Xcode builds. See `docs/RELEASE_2.6.0.md` and `docs/RUNNER_FLEET_SPEC.md`.
