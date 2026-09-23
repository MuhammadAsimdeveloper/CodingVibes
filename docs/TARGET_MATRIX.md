# codingVibes target compatibility matrix

| Target | Generated source | Local live verification | Artifact verification in current environment | Notes |
|---|---|---|---|---|
| Web · Node | Yes | Yes | Verified | Full HTTP + browser path when Playwright is installed. |
| Web · PWA | Yes | Yes | Verified | Adds manifest + service worker; installability still depends on browser/platform policy. |
| Android · Web APK (TWA) | Yes | No in current runtime | Blocked | Requires Android Gradle tooling and Digital Asset Links for production trust. |
| Mobile · Expo / React Native | Yes | No in current runtime | Blocked | Prepared for EAS; an EAS/Android/iOS build environment is required for binaries. |
| Mobile · Flutter / Dart | Yes | No in current runtime | Blocked | Requires Flutter/Dart SDK for analyze/test/build. |
| Android · Native Kotlin | Yes | No in current runtime | Blocked | Requires Android/Gradle SDKs. |
| Apple · SwiftUI | Yes | No in current runtime | Blocked | Swift is present, but Xcode/iOS simulator tooling is unavailable in this environment. |
| Desktop · Electron | Yes | Source scaffold | Blocked | Artifact packaging needs an isolated desktop-capable runner. |
| Desktop · Tauri / Rust | Yes | No in current runtime | Blocked | Requires Rust/Cargo and target packaging toolchain. |
| Multiplatform · Kotlin | Yes | No in current runtime | Blocked | Requires Gradle/KMP toolchain and platform SDKs as needed. |

## Important

A target can be **generated** without being **verified**. codingVibes deliberately keeps those states separate. Native/mobile targets will not be presented as verified simply because the source tree has the expected files.

The current execution image has Node/npm plus Java/Swift, but does not have Gradle, Android `adb`, Flutter/Dart, Rust/Cargo, or Xcode. This is why the native rows are intentionally blocked rather than falsely marked successful.
