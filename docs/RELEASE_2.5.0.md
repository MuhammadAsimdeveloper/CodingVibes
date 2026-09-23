# codingVibes 2.5.0 — Runner Fleet Audit & Hardening

## Audit result

The 2.4 runner-fleet design was structurally sound but had several production gaps: dependency networking was not sufficiently constrained at the application boundary, Docker execution had no hard timeout, child processes inherited the host environment, remote macOS accepted a broader command model than necessary, remote iOS verification did not produce an authoritative promotion path, native verification duplicated expensive builds, artifact uploads lacked timeout/integrity controls, and fleet readiness/lease state was not observable.

## Delivered

- Docker runner hardening with timeout, named dependency-egress policy, digest-pinning policy, resource ceilings, seccomp/no-new-privileges, and secret-safe child environments.
- Dependency cache keying based on lockfiles/build descriptors/toolchain/image identity.
- Capability lease manager with bounded concurrency and timeouts.
- Stable runner failure taxonomy.
- Single authoritative native-build evidence chain; duplicate native rebuild removed.
- Android device verification with checksum validation, boot readiness, install, launch, activity/package checks, and diagnostic logcat.
- Artifact upload HTTPS/size/timeout/checksum acknowledgement controls.
- Versioned authenticated macOS job protocol with per-file/workspace SHA-256 validation, fixed build profiles, bounded concurrency, artifact collection/upload, secret isolation, and disposable workspace cleanup.
- Fleet readiness endpoint (`GET /api/fleet`) and local `npm run fleet:doctor` command.
- Explicit fleet specification and operational hardening documents.
- Centralized application version metadata.

## Verification

- `npm run check` — passed
- `npm test` — 36/36 passed
- `npm run smoke` — passed, runtime reports version 2.5.0
- `npm run e2e` — passed
- provisioning shell scripts — `bash -n` passed
- macOS runner protocol — `node --check` passed

## Environment limitation

This development host still does not contain Docker, Android SDK/adb, Flutter, or Xcode. The release therefore verifies the fleet control plane, security contracts, job protocols, failure handling, and deterministic test paths but does not claim a real APK/device/iOS build from this host.

Actual native binary verification requires the provisioned external runners described in `docs/RUNNER_FLEET_SPEC.md`.
