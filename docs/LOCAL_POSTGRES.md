# Local PostgreSQL for Build Vibe

## Fastest laptop setup

1. Install Docker Desktop.
2. Run `docker compose -f compose.postgres.yml up -d`.
3. Copy `.env.postgres.example` to `.env.postgres.local` and export/load it.
4. Run `npm run db:postgres:setup`.
5. Run `npm run db:postgres:doctor`.
6. Open Adminer at http://127.0.0.1:8080 with server `postgres`, user `buildvibe`, password `buildvibe_dev_password`, database `buildvibe`.

## Managed free option

Neon is a good lightweight managed PostgreSQL option for development: as of October 2, 2026 its Free plan provides 100 projects and 1 GB of Postgres storage per project.

Supabase is another option when you want PostgreSQL plus auth, storage and other application services.

## Important architecture note

Build Vibe currently keeps its synchronous transactional Store on SQLite for the core application path, while PostgreSQL is already supported as the scale-out database/control-plane backend (`CODINGVIBES_DB_BACKEND=postgres`) with migrations, outbox, object references and audit events. This keeps local development simple while providing a safe migration boundary for the full async PostgreSQL Store in a later phase.

Do not put production passwords into committed files. Use environment variables or a secret manager.
