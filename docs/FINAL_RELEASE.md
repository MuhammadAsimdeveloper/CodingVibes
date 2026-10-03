# Coding Vibes 10.0.0 — final release contract

Coding Vibes 10.0.0 is the consolidated launch candidate for the verified AI product-builder workflow.

## Customer flow
1. Create an account.
2. Create a project and describe the product in natural language.
3. Build a structured product blueprint.
4. Generate a provider-neutral application.
5. Run isolated verification and bounded repair.
6. Review the diff/evidence and optionally commit.
7. Edit structured content through the owner-only generated `/admin`.
8. Publish the latest verified artifact through a compatible provider.
9. Re-enter the builder, modify the product and repeat verification/redeployment.

## Generated-site guarantees
Every generated website contains an owner-only `/admin` portal. A public `/login` page is generated only when requested; Google OAuth is supported when configured. Provider credentials and runtime secrets remain outside generated source.

Generated application records persist in `.data/records.json` for portable single-node deployments. Control-plane records, usage, deployments, provider connections, audit events, artifacts and sessions persist in the Coding Vibes SQLite database.

## Operations
The protected `/ops` console provides customer/project/run/deployment health, audit visibility and database backup creation. Production readiness blocks launch when the session secret, isolated runtime, quota enforcement, model provider, super-admin allowlist or backup directory requirements are missing.

## Native targets
Android, Flutter, Tauri/Rust and other native targets remain verification-gated: source generation alone never marks a binary verified. A target is verified only when its authoritative runner completes the build and required smoke tests.

## Production boundary
10.0.0 is a production-ready single-instance architecture. Horizontal scaling or managed PostgreSQL should be introduced before multi-instance operation. Third-party OAuth, model, payment, deployment and native-build credentials are deployment configuration, not repository content.

## Final verification
Use:

`npm run final:check`

which runs the complete test, syntax, end-to-end and launch-check sequence.
