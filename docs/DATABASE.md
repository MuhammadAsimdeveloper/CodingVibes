# PostgreSQL on a laptop

Build Vibe 14.0.0 keeps **SQLite as the primary application Store** and adds a reproducible PostgreSQL path for the existing scale-out adapters. This is deliberate: the repository already has PostgreSQL contracts and migrations, but silently switching the whole application Store would be a larger migration with a different failure profile.

## Recommended local setup

The easiest zero-cost local database is PostgreSQL in Docker.

1. Create your local environment file:
```bash
cp .env.example .env.local
```

2. Start PostgreSQL:
```bash
docker compose -f compose.local.yml up -d postgres
```

3. For host-side scripts, set these values in `.env.local`:
```env
CODINGVIBES_DB_BACKEND=postgres
DATABASE_URL=postgresql://buildvibe:buildvibe@127.0.0.1:5432/buildvibe
CODINGVIBES_PG_SSL_MODE=disable
```

4. Initialize the PostgreSQL reference schema:
```bash
npm run postgres:setup
```

5. Verify the whole scale-out layer:
```bash
npm run scaleout:doctor
```

6. Start Build Vibe normally:
```bash
npm start
```

The Compose `build-vibe` service overrides `DATABASE_URL` to use the internal hostname `postgres` and waits for the database health check.

## What the PostgreSQL migration currently creates

The current reference migration creates:
- `codingvibes_schema_migrations`
- `codingvibes_outbox`
- `codingvibes_object_refs`
- `codingvibes_audit_events`

## Important architecture boundary

The existing `Store` class still writes application accounts, projects, sessions, runs, messages and related control-plane state to SQLite. `CODINGVIBES_DB_BACKEND=postgres` enables the PostgreSQL scale-out adapter and readiness checks; it does **not** claim that all application persistence has migrated.

That means this is safe to use on a laptop now, while a later release can migrate selected high-write workloads behind the adapter without destabilizing the launch-critical local Store.

## Direct connection

After PostgreSQL is running:
```bash
psql "postgresql://buildvibe:buildvibe@127.0.0.1:5432/buildvibe"
```

Use Host `127.0.0.1`, Port `5432`, Database `buildvibe`, User `buildvibe`, Password `buildvibe` in local database clients.

Do not reuse the development password in a public deployment. Use secret-managed credentials and TLS outside the private local network.

## Hosted free Postgres option

Supabase currently offers a Free plan with two free projects across your organizations. citeturn882923search8 Neon is another PostgreSQL-focused provider worth evaluating before production, but the local Docker path is provider-neutral and requires no hosted account.

## Production migration gate

Before making PostgreSQL the authoritative application Store, the next migration should include a compatibility layer, data backfill, dual-read/write validation, rollback tooling, and a production backup/restore drill. Until those gates exist, keep SQLite authoritative and use PostgreSQL for the explicit scale-out contracts.
