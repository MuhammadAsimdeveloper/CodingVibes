# Release 2.7.0 — Agent Lifecycle Foundation

This release adds the first persistent control-plane primitives for a resumable AI software factory.

## Added

- Persistent per-run agent task graph with lifecycle states and dependencies.
- Task progress synchronization from orchestration events.
- Repository index containing file hashes, languages, symbols and import edges while excluding runtime noise.
- Persistent repository index storage per run.
- Per-run model usage records for provider/model/tier and basic execution accounting.
- API endpoints for task state, repository index and usage telemetry.
- Regression coverage for task lifecycle and repository indexing.

## Why

The previous release already had a verified build loop, target-aware generation, isolated runners, Git changesets and browser/source verification. 2.7.0 adds the persistent state needed to turn that loop into a resumable agent runtime instead of a single opaque request.

## Next

The next build phase should consume the repository index during context selection, add durable checkpoints/snapshots, improve model usage token accounting, and expose task progress in the UI.
