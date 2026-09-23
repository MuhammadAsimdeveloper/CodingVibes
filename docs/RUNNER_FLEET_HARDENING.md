# codingVibes 2.5 Runner Fleet Hardening

## Security baseline

The runner fleet executes generated repository content as untrusted code. GitHub explicitly warns that self-hosted runners can be persistently compromised by untrusted workflows and recommends restricting their use and access. Runner groups should therefore be private-repository scoped, and dedicated build runners must not contain long-lived production credentials.

### Linux build runners

Build phase: `network=none`, read-only container root, writable `/workspace`, dropped capabilities, `no-new-privileges`, seccomp default profile, pids/CPU/memory limits, explicit timeout, and no inherited secret environment by default.

Dependency phase: only a named network matching `codingvibes-deps-*` is accepted. `host`, `bridge`, and arbitrary Docker networks are rejected by the application layer.

Production images must be digest pinned unless explicitly overridden for development. The fleet manifest records this policy.

### Dependency caching

Caches are keyed from target, runner image, toolchain fingerprint, lockfiles, and build descriptors. A cache volume is never the source workspace and is disabled by default. Enable with `CODINGVIBES_ENABLE_DEP_CACHE=true` after establishing a controlled cache lifecycle.

### Artifact integrity

Artifacts receive SHA-256 hashes before storage. Uploads enforce size limits, production HTTPS, request timeouts, and optional checksum acknowledgment from the artifact service.

### Android device verification

The device verifier now checks boot completion, verifies the artifact checksum before install, installs with `adb install -r`, force-stops the package, launches with `am start -W`, checks package presence and activity state, and captures recent logcat output on failure.

### macOS / Xcode runner

Apple documents `xcodebuild`, `xcrun`, and related tooling as Xcode command-line tools; Xcode must be installed and selected as the active developer directory.

The macOS endpoint now accepts a versioned job schema, validates every uploaded file against its declared SHA-256, validates the complete workspace manifest, uses fixed build profiles rather than arbitrary client-supplied commands, limits concurrent builds, and deletes disposable workspaces.

The production macOS machine should be an ephemeral/private runner or disposable VM. Do not expose it to public pull requests or give it production credentials.

## Fleet scheduling

`RunnerLeaseManager` provides bounded in-process concurrency and lease timeouts for Android, Flutter, Rust, macOS, and device capabilities. A multi-instance deployment should move these leases to a shared database/queue; the in-memory manager is intentionally safe-by-default for a single control-plane process.

## Supply-chain controls

Provisioning requires an explicit GitHub Actions runner version and SHA-256 for the downloaded runner archive instead of silently selecting the latest release. This makes the host bootstrap reproducible and reviewable.

## Operational SLOs

Recommended production targets:

| Metric | Initial target |
|---|---:|
| Runner registration/health success | >= 99% |
| Queue lease acquisition p95 | < 2 s |
| Native verification success rate | >= 95% excluding missing toolchains |
| Build timeout rate | < 2% |
| Artifact checksum mismatch | 0 |
| Unverified native binary presented as verified | 0 |
| Secrets present in runner workspace | 0 |
| Runner image digest drift | 0 |

## Evidence contract

Every native verification should persist:

- runner capability and image identity;
- dependency-install result and cache key;
- build commands and bounded stdout/stderr;
- artifact SHA-256, size, and storage state;
- device serial/boot state when a device is used;
- install/launch/package/activity/logcat evidence;
- macOS workspace manifest and runner response when applicable;
- lease acquisition/release metadata;
- final verification status and failure class.

## Control-plane features

`GET /api/fleet` exposes non-secret fleet readiness, configured capabilities, image policy state, macOS URL configuration, dependency-network safety, and current in-process runner leases to authenticated operators.

`npm run fleet:doctor` provides a local readiness report without installing toolchains or making cloud changes.

Runner failures have stable codes (`RUNNER_TIMEOUT`, `DEPENDENCY_INSTALL_FAILED`, `BUILD_FAILED`, `ARTIFACT_UPLOAD_FAILED`, `DEVICE_INSTALL_FAILED`, `DEVICE_SMOKE_FAILED`, and related codes) so UI/repair logic can act on failure classes instead of parsing free-form stderr.
