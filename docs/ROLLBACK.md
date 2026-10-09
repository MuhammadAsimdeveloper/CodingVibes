# Build Vibe rollback

Rollback is an explicit operator action, never an automatic bypass of verification.

## Application source

Every verified build is associated with a project workspace, changeset and evidence records. Revert the deployment to the last known-good verified commit or restore a verified checkpoint, then rerun verification before publishing again.

For a run checkpoint, use the existing checkpoint restore endpoint only with an authenticated editor and explicit confirmation. A restored run is marked edited and must be verified again.

## Deployment

Keep the deployment provider ID, URL, commit SHA, target ID and artifact fingerprint from the deployment evidence. Roll back to the previous verified provider deployment or redeploy the previous verified commit.

A deployment attestation is recorded in deployment metadata. Signed attestations require CODINGVIBES_ATTESTATION_SECRET; unsigned state is reported as UNSIGNED and must not be presented as cryptographic proof.

## Database

Backups are produced with a consistent SQLite snapshot and SHA-256. Before restoring a production database, stop write traffic, verify the backup hash, copy it to a separate path, run the schema migrations, and execute a health/read check. Never overwrite the live database with an unverified file.

## Managed scale-out

For PostgreSQL/object storage/Redis deployments, use the provider's tested point-in-time or snapshot restore mechanism plus application verification. The local SQLite backup workflow is not a substitute for managed database backup guarantees.

## Rollback gate

After any rollback:

1. health/liveness;
2. authentication and authorization;
3. source and application verification;
4. browser/visual checks where configured;
5. target-specific verification for native projects;
6. deployment smoke;
7. audit log evidence.

A rollback is complete only when those checks pass or the release is explicitly marked BLOCKED.

## Rollback readiness for visual changes

Implement the [reconstruction plan](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) in reviewable increments. If a visual system, animation or 3D addition regresses critical flows or performance, revert the smallest affected change or disable the relevant optional capability without weakening core verification or deleting unrelated user work.
