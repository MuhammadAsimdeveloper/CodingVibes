# codingVibes native runners

codingVibes treats native builds as untrusted execution and does not execute native commands directly on the application host when the isolated runner is enabled.

## Android / Gradle

Set `CODINGVIBES_TARGET_RUNNER_MODE=docker` and provide an Android runner image containing the Android SDK, JDK, Gradle, and adb. Dependency resolution runs on a named controlled-egress network. The actual test/build phase runs again with network disabled, dropped capabilities, CPU/memory/PID limits, no-new-privileges, seccomp default, a read-only container root, and a writable project mount.

The native Android pipeline performs Gradle tests followed by `assembleDebug` and stores a SHA-256 identified APK/AAB artifact.

## Flutter

Use a runner image containing Flutter and Dart. The runner performs `flutter analyze`, `flutter test`, and `flutter build apk --debug`, then hashes and stores the resulting artifact.

## Rust / Tauri

Use a Rust/Tauri runner image. The runner performs `cargo check`, `cargo test --no-run`, and `cargo tauri build`, then collects desktop artifacts.

## Kotlin Multiplatform

The KMP target uses the Android/Gradle runner and performs `gradle test` before artifact collection.

## iOS / SwiftUI

iOS signing and Xcode builds require macOS. codingVibes therefore uses a configured macOS runner endpoint (`CODINGVIBES_MACOS_RUNNER_URL`). The endpoint receives a versioned workspace manifest, validates every file checksum, and executes a fixed simulator Debug build profile. It is authoritative only when the authenticated response echoes the expected job ID and workspace manifest hash and reports `status=built`.

## Expo / React Native / EAS

Set `CODINGVIBES_TARGET_RUNNER_MODE=eas` for cloud builds. The adapter invokes EAS non-interactively and records the build ID and artifact URL. Android preview builds request an APK profile; production distribution should use AAB.

## Device verification

When an Android emulator/device is attached to the device runner, codingVibes validates the artifact checksum, waits for boot, installs with `adb install -r`, force-stops the application, launches the declared activity with `am start -W`, verifies package/activity state, and captures recent logcat on failure. Physical-device verification requires an explicitly connected device and enabled debugging; it is never assumed.

## Fleet hardening in 2.5

The runner fleet adds bounded leases, explicit capability routing, digest-pinning policy for production images, safe dependency-network naming, dependency cache keys, secret-safe child environments, hard Docker timeouts, stronger artifact upload controls, stable failure codes, a fleet readiness API, a local `fleet:doctor` command, and checksum-aware Android device verification.

See `docs/RUNNER_FLEET_SPEC.md` and `docs/RUNNER_FLEET_HARDENING.md` for the execution contract and production security/operations requirements.
