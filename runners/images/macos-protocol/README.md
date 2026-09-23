# macOS runner protocol

Linux cannot legitimately execute Xcode/iOS simulator builds. codingVibes therefore treats macOS as a remote isolated runner boundary.

The endpoint configured by `CODINGVIBES_MACOS_RUNNER_URL` receives the versioned `codingvibes.macos-job.v3` contract. The control plane sends a bounded file manifest with per-file SHA-256 values and a workspace manifest hash.

The production runner validates every file checksum, materializes the source in a disposable workspace, runs a fixed iOS simulator Debug profile (not arbitrary client commands), collects `.app` artifacts, hashes them, optionally uploads them to the artifact service, and returns the manifest hash, build results, artifact metadata, and upload evidence.
