# Build Vibe targets

Supported targets are registered in src/targets/registry.js.

Web/PWA and desktop Electron can use the Node-based verification flow. Android, Flutter, SwiftUI, Tauri and Kotlin Multiplatform require their actual toolchains or configured isolated runners. Build Vibe never treats source generation as proof of a native binary.

Run: npm run deployment:preflight

The preflight reports PASS when the selected provider/target prerequisites are available; BLOCKED when a selected target or deployment provider lacks required infrastructure; and NOT_CONFIGURED when no deployment provider is selected.

A configured provider must also be compatible with whether the artifact requires a server runtime or only static publishing.

## Native artifacts

Artifact types are target-specific: APK/AAB for Android, Android/iOS source and builds for Expo/Flutter, IPA for SwiftUI, installers for desktop targets, and source/web preview for web targets. Availability is environment-dependent.

## Visual effects across build targets

Use [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) to keep motion and 3D target-aware. A web effect is not automatically supported on native/mobile/desktop targets; validate each declared target and provide an appropriate fallback. Never mark a native artifact verified without its actual target toolchain and isolated runner evidence.
