# codingVibes architecture

## Product contract

codingVibes is an AI coding workspace whose central invariant is:

> **Changes are reviewable and verified before they can be explicitly committed.**

The system is not a fixed full-stack starter. A request becomes a structured application contract (`spec.v2`) describing pages, APIs, data entities, behavior, components, styling and acceptance criteria. That contract drives generation, runtime verification and the evidence record.

## Build lifecycle

```text
request
  -> requirements + visual-intent planning
  -> AppSpec validation
  -> bounded repository context capture
  -> model-first file generation (deterministic fallback)
  -> isolated project Git repository
  -> isolated cv/<run-id> worktree
  -> controlled writes
  -> preview sandbox
  -> check + test + HTTP smoke + browser verification
  -> evidence.v2
  -> bounded repair (max 6 cycles)
  -> verified changeset
  -> explicit commit
```

### Persistence

SQLite stores users, sessions, project metadata, runs, messages, changesets, tool calls, events and evidence. Every user project gets its own Git repository under `CODINGVIBES_PROJECT_ROOT`.

### Runtime boundary

Development may use the local Node runtime. Production should use Daytona or the hardened Docker runner. Host execution is explicitly blocked in production unless `CODINGVIBES_ALLOW_HOST_EXECUTION=true` is deliberately set.

### Model boundary

`ModelRouter` uses OpenAI-compatible chat-completions semantics and supports:

- OpenAI-compatible hosted providers
- OpenRouter-compatible models
- Ollama
- LM Studio
- custom compatible base URLs
- JSON model profiles for per-tier model selection

Missing hosted credentials fall back to the deterministic planner. No claim is made that a third-party API is universally free.

### Generation safety

Model output is treated as untrusted file data. Generated paths are normalized and blocked from `.git`, `.codingvibes`, `node_modules`, secret-like files and traversal/symlink escapes. Model-generated file sets are capped by file count and byte budgets before writes. Repository context is bounded and excludes common secrets and build artifacts.

### Agent safety

Repository text is data, not instructions. File writes are confined by `safe-path.js`, including null-byte, traversal and symlink checks. Review/dangerous tool permissions are explicit. Build concurrency is bounded per user. Mutating HTTP requests are same-origin checked.

### Verification

A verification report contains command results, HTTP results and browser results. A missing Playwright installation is a verification failure when browser verification is enabled, not a false pass. Each browser route gets a fresh page context to avoid cross-route error contamination.

## Deployment and native execution

Verified project artifacts can be exported as ZIP, pushed to GitHub, or sent through registered deployment adapters. Vercel, Netlify and Cloudflare Pages are direct static adapters; GitHub is the source path; Hostinger is an assisted GitHub-to-Node.js flow. Static-only adapters reject server-required artifacts.

Native source generation covers Android, Expo/React Native, Flutter, SwiftUI, Electron, Tauri/Rust and Kotlin Multiplatform. Local/container runners plus optional remote Linux/macOS runners can perform builds; binary verification is accepted only with required artifact and test evidence.

## Production release invariant

A commercial production launch requires a green /ready response. The gate checks HTTPS public URL, isolated runtime, AI provider, browser verification, persistent storage, quotas, backups, super-admin configuration and Stripe production configuration when billing is required.

## Intentional deferrals

Multi-agent swarms, credit packs and a fully managed Coding Vibe hosting control plane remain later scale features. The current deployment and runner abstractions are already used by the verified build workflow.


## Generated 3D module and motion boundary

Generated immersive pages include an import map resolving the bare module specifier three to the same versioned ES module URL used by the generated experience runtime. It is emitted before the experience module and other module scripts so OrbitControls and GLTFLoader can resolve their imports in a browser. A generator regression test checks map ordering and URL.

The Three.js runtime uses a live prefers-reduced-motion media query. Under reduced motion, it avoids continuous animation-frame scheduling, disables control damping, makes camera selection non-animated and pauses automated tour recording. When the page becomes hidden, active frames and camera/tour work stop; when visible again, the renderer paints once and restarts continuous rendering only when motion is permitted. This does not replace physical-device browser QA.

Three.js, OrbitControls and GLTFLoader are currently loaded from jsDelivr. The import map repairs module resolution but does not make those dependencies offline or self-contained. Projects that must run without network access need the 3D assets bundled or vendored as part of their dependency/package strategy.


## Uploaded 3D asset lifecycle

The generated 3D runtime owns and releases temporary object URLs: uploaded GLB/GLTF URLs are revoked in a `finally` block even when GLTF parsing fails, and replaced walkthrough video URLs are revoked before a new URL is assigned. File input values reset after selection so users can select the same file again. Empty camera-path data falls back to a built-in safe shot sequence. Full browser/WebGL and physical-device asset testing remains part of the release gate.
