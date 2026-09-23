# codingVibes Runner Fleet Specification v2.5

## Objective

Execute generated native software as untrusted code on dedicated toolchain runners and produce cryptographically identified verification evidence without ever marking a native binary verified from source structure alone.

## Runner classes

| Capability | Targets | Execution boundary | Network | Device |
|---|---|---|---|---|
| Android builder | Android Kotlin, TWA, KMP, Expo Android | isolated Linux container | none during build; named egress during dependency install | no |
| Flutter builder | Flutter/Dart | isolated Linux container | same | no |
| Rust builder | Tauri/Rust | isolated Linux container | same | no |
| Android device | Android APK targets | dedicated device/emulator host | controlled | yes |
| macOS/Xcode | SwiftUI/iOS | dedicated private macOS runner/VM | controlled | simulator by default |

## Job lifecycle

`queued → leased → dependency_install → building → artifact_collection → device_smoke → verified`

Failure branches terminate at `failed` or `blocked`; `released` is emitted after the lease is returned.

## Lease contract

Each native verification acquires a capability lease with a bounded wait. The single-process implementation defaults to Android=2, Flutter=1, Rust=1, macOS=1, device=1. A multi-instance control plane should externalize leases to a shared queue/database before scaling horizontally.

## Dependency contract

Dependencies are installed once per verification attempt. The command is target-specific and deterministic:

- Android/KMP: Gradle dependency resolution
- Flutter: `flutter pub get`
- Expo: `npm ci`
- Tauri: `cargo fetch`

Dependency networking may only use a Docker network named `codingvibes-deps-*`. The build phase rejects all network access.

## Build contract

Android/Kotlin/TWA: `gradle test` then `assembleDebug`.

Flutter: `flutter analyze`, `flutter test`, `flutter build apk --debug`.

Tauri: `cargo check`, `cargo test --no-run`, `cargo tauri build`.

KMP: `gradle test`.

iOS/SwiftUI: remote macOS fixed build profile using `xcodebuild` for simulator Debug, or `swift build` for Swift Package-only projects.

## Artifact contract

Each artifact must have:

- target and run identifier;
- size;
- SHA-256;
- storage/upload status;
- optional remote checksum acknowledgment;
- source workspace manifest hash.

A remote macOS build is not authoritative unless the control plane receives the expected job ID, workspace manifest hash, `status=built`, and an authenticated response.

## Android device verification contract

The APK checksum is checked before installation. Verification then requires:

1. `adb wait-for-device` success.
2. `sys.boot_completed=1`.
3. `adb install -r` success.
4. force-stop and `am start -W` success for the declared activity.
5. package presence check.
6. activity state probe.
7. diagnostic logcat capture on failure.

## Failure taxonomy

Failures are returned as stable codes so UI and repair logic can classify them without parsing prose: `RUNNER_BUSY`, `RUNNER_TIMEOUT`, `RUNNER_NETWORK_POLICY`, `TOOLCHAIN_UNAVAILABLE`, `DEPENDENCY_INSTALL_FAILED`, `BUILD_FAILED`, `ARTIFACT_MISSING`, `ARTIFACT_UPLOAD_FAILED`, `ARTIFACT_INTEGRITY_FAILED`, `DEVICE_UNAVAILABLE`, `DEVICE_INSTALL_FAILED`, `DEVICE_SMOKE_FAILED`, and `RUNNER_MANIFEST_MISMATCH`.

## Trust boundaries

The application server, runner host, generated workspace, dependency network, artifact service, and connected Android device are separate trust boundaries. Generated source is treated as untrusted data. The child build environment receives no codingVibes provider/API secrets by default.

## Production gate

Production requires:

- private/restricted self-hosted runner access;
- digest-pinned runner images;
- short-lived runner registration credentials;
- dedicated runner hosts with no production credentials;
- HTTPS for control-plane and artifact endpoints;
- ephemeral/disposable macOS execution or an equivalent isolated VM policy;
- persistent evidence storage;
- fleet monitoring and alerting.


## Linux control-plane daemon

`infra/runner-fleet/linux-runner/server.mjs` is the production Linux job boundary. The control plane sends a bounded file manifest using `codingvibes.linux-job.v1`; the runner verifies per-file checksums and the workspace manifest, runs only target-specific dependency/build profiles inside the approved Docker image, collects APK/Tauri/native artifacts, uploads them with SHA-256 headers, and deletes the workspace. It does not accept arbitrary commands.

Install it with `infra/runner-fleet/linux-runner/install-service.sh` under the `codingvibes-runner` system account. The service is intentionally separate from GitHub Actions registration. GitHub self-hosted runners can remain available for CI, while the codingVibes daemon is the application execution plane.

## macOS control-plane daemon

`infra/runner-fleet/macos-runner/start.sh` loads the runner bearer token from macOS Keychain. `provision-macos.sh` installs the HTTP service as a per-user LaunchAgent so iOS Simulator/Xcode can operate in a GUI-capable session without putting the secret into the plist.
