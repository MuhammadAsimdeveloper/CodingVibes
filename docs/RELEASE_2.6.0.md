# codingVibes 2.6.0 — Durable Runner Control Plane

This release extends the native fleet from isolated execution adapters into a durable control-plane contract.

## Included

- Durable runner registration and heartbeat records in SQLite.
- Dedicated runner control token; runner APIs never accept end-user sessions.
- Fleet status now reports registered/stale runners.
- Native Docker builds use disposable sanitized staging workspaces.
- `.git`, runtime state, `.env` files, private keys, and symlinks are excluded from native runner input.
- Durable artifact metadata with SHA-256, size and download-safe storage paths.
- Authenticated artifact metadata/download endpoints.
- macOS protocol v3 with simulator test-before-build, artifact upload acknowledgment, and authoritative `verified` state.
- Native verification accepts an attested remote build without rebuilding it a second time.
- Fleet image tags are aligned to the release version.

## Verification

Run `npm test`, `npm run check`, `npm run smoke`, and `npm run e2e`.

## Runner execution plane

For Android/Flutter/Tauri the new Linux runner daemon is the application-facing execution plane. For iOS/SwiftUI the macOS runner daemon is the application-facing execution plane. GitHub Actions self-hosted runners are optional CI/bootstrap infrastructure, not the artifact-verification authority.

## External infrastructure

Actual Docker, Android/adb and macOS/Xcode execution still requires the physical runner fleet and its credentials; the application remains fail-closed when those are unavailable.
