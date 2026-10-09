# macOS runner protocol

Linux cannot legitimately execute Xcode/iOS simulator builds. codingVibes therefore treats macOS as a remote isolated runner boundary.

The endpoint configured by `CODINGVIBES_MACOS_RUNNER_URL` receives the versioned `codingvibes.macos-job.v3` contract. The control plane sends a bounded file manifest with per-file SHA-256 values and a workspace manifest hash.

The production runner validates every file checksum, materializes the source in a disposable workspace, runs a fixed iOS simulator Debug profile (not arbitrary client commands), collects `.app` artifacts, hashes them, optionally uploads them to the artifact service, and returns the manifest hash, build results, artifact metadata, and upload evidence.

## Reconstruction plan alignment

The [Build Vibe reconstruction plan](../../../docs/BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) does not broaden this runner's command protocol or permissions. Any macOS/SwiftUI or visual build support must use the fixed schema, supported toolchain and real test evidence; do not pass arbitrary model-generated commands or infer successful target verification from source generation alone.

