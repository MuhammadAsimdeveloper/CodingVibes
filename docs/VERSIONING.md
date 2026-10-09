# Build Vibe versioning and migration contract

## Release source

Runtime release identity is canonical in `src/version.js` as `BUILD_VIBE_VERSION`. `package.json`, repository-facing release documentation, API metadata and (when present) `package-lock.json` must agree with that value.

Run `npm run release:check` to validate the contract before a release commit.

## Compatibility

Existing project/session/run data must remain readable by newer releases. SQLite initialization uses additive `CREATE TABLE IF NOT EXISTS` and index creation; future schema changes should use numbered migrations rather than destructive rewrites.

## Migration rules

1. Add a new numbered migration for a schema change.
2. Never silently drop user/project/run data.
3. Make migrations idempotent or record completion explicitly.
4. Preserve old fields until a tested compatibility window has passed.
5. Test migration on representative fixtures before release.
6. Document rollback implications when a migration is not reversible.

## Release procedure

1. Update `src/version.js` intentionally.
2. Update `package.json` to match.
3. Run `npm run release:check`.
4. Regenerate/verify `package-lock.json` with `npm install --package-lock-only` when dependency metadata changes.
5. Run `npm test`, coverage, syntax/security/scale-out/E2E/launch checks.
6. Record version, commit SHA and verification evidence in the final audit artifact.

## Versioning for the reconstruction initiative

Changes made under [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) should follow the project's normal versioning and release-note policy when shipped. Documentation-only planning commits should not be represented as a released product version or as proof that the planned capabilities have been implemented.
