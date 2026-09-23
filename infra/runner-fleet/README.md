# codingVibes runner fleet

This is the production runner boundary for native builds:

- Linux Docker builders: Android/TWA/Kotlin, Flutter, and Rust/Tauri.
- macOS Xcode runner: SwiftUI/iOS builds on a real macOS host or disposable macOS VM.
- Android device runner: a dedicated host with `adb` and a real device or emulator.

GitHub Actions self-hosted runners are selected by labels. Registration tokens are short-lived and must be supplied only at provisioning time; never bake them into images or the repository.

## Provision

The provisioning scripts require a pinned GitHub Actions Runner version and exact SHA-256 so the bootstrap is reproducible.

Linux builder host:

```bash
RUNNER_URL=https://github.com/ORG/REPO \
RUNNER_TOKEN='short-lived-token' \
RUNNER_NAME='cv-android-01' \
RUNNER_LABELS='codingvibes,android-builder,x64' \
RUNNER_VERSION='PINNED_VERSION' \
RUNNER_SHA256='EXACT_TARBALL_SHA256' \
./provision-linux.sh
```

Use distinct labels/hosts for Flutter and Rust. The macOS host uses `provision-macos.sh` with `codingvibes,macos-xcode,xcode` labels.

The repository workflow `.github/workflows/runner-fleet-smoke.yml` is a smoke workflow only; production runner access should be restricted to trusted private repositories and approved runner groups.

## Security boundary

Build phase: **no network**. Dependency installation uses only an operator-created Docker network whose name matches `codingvibes-deps-*`; `host`, `bridge`, and arbitrary networks are rejected by the application layer. After dependency installation, the build is rerun with network `none`.

The child build process receives an allowlisted environment by default, so codingVibes model/provider credentials are not inherited accidentally.

Production runner images should be digest-pinned. Dependency caches are keyed from lockfiles, build descriptors, toolchain version and runner image identity and are stored outside the source workspace.

## Device smoke

The Android build stage produces a SHA-256 identified APK. The device stage validates the checksum before installation, waits for device boot completion, calls `adb install -r`, force-stops and launches the declared activity, verifies package/activity state, and captures recent logcat output when verification fails.

## macOS runner service

On the macOS host, run the HTTP worker behind a private network/load balancer and HTTPS. Use an environment-only bearer token and keep artifact-service credentials outside the build child environment:

```bash
CODINGVIBES_MACOS_RUNNER_TOKEN='long-random-token' \
CODINGVIBES_MACOS_EPHEMERAL=true \
CODINGVIBES_ARTIFACT_UPLOAD_URL='https://artifact.example/upload' \
PORT=8787 node infra/runner-fleet/macos-runner/server.mjs
```

The application uploads a bounded versioned file manifest. The runner verifies per-file SHA-256 values and the whole-workspace manifest, then runs a fixed iOS simulator Debug profile instead of accepting arbitrary client commands. The runner uploads collected `.app` artifacts to the configured artifact service, reports checksums and upload evidence, and deletes the disposable workspace before returning.

Never expose the macOS build endpoint to the public internet.

## 2.6 security, provenance and control-plane contract

Every runner job is treated as untrusted generated code. The fleet enforces:

- build phase: Docker network `none`; read-only container root; writable workspace/tmpfs only; dropped Linux capabilities; no-new-privileges; seccomp default; CPU/memory/PID ceilings; hard timeout.
- dependency phase: named controlled-egress network only, with no fallback to Docker bridge/host networking.
- scheduling: bounded capability leases with timeout and release evidence.
- macOS runner: bearer token mandatory; uploaded symlinks rejected; fixed job schema/profile; per-file and workspace checksum validation; bounded concurrency; immediate disposable-workspace cleanup.
- artifacts: SHA-256 recalculated after copying; upload size/HTTPS/timeout controls; optional remote checksum acknowledgment.
- fleet manifest/status: runner capabilities, images, limits, security posture and live lease state are exposed to authenticated operators without secrets.

The production egress network should allow only the package registries/source-control hosts required by the target toolchain, while denying arbitrary destinations. DNS, HTTP(S), and proxy logs should be retained outside the generated workspace.


## Control-plane runner daemons

The fleet has two application execution daemons in addition to optional GitHub Actions runners:

- Linux: `linux-runner/server.mjs` receives `codingvibes.linux-job.v1`, executes only fixed Android/Flutter/Tauri profiles through Docker, uploads SHA-256-addressed artifacts, and deletes its workspace. `linux-runner/install-service.sh` installs it as `codingvibes-linux-runner.service`.
- macOS: `macos-runner/server.mjs` receives `codingvibes.macos-job.v3`, runs simulator tests before the Xcode build, uploads verified artifacts, and returns an attested `verified` result. `provision-macos.sh` stores the HTTP secret in Keychain and installs the runner as a LaunchAgent.

Set `CODINGVIBES_LINUX_RUNNER_URL`/`TOKEN` or `CODINGVIBES_MACOS_RUNNER_URL`/`TOKEN` in the control plane to route native builds remotely. Remote runner endpoints must be private-network/HTTPS endpoints.
