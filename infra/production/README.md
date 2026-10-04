# Build Vibe production infrastructure reference

This directory contains the missing scale-out service definition for PostgreSQL, Redis, and S3-compatible object storage.

## Before use

1. Copy the repository production environment into the secret manager as .env.production.
2. Set POSTGRES_PASSWORD and MinIO credentials to randomly generated secret values.
3. Set MINIO_IMAGE, POSTGRES_IMAGE, and REDIS_IMAGE to pinned production image references. Digest pinning is preferred.
4. Keep the application behind TLS/WAF/reverse proxy.
5. Treat this stack as infrastructure for the new adapters; the legacy Store class still uses SQLite until an explicit schema migration is performed.

## Validation

After dependencies and secrets are configured, run:

  npm run scaleout:doctor

The doctor command initializes the PostgreSQL reference migration and health-checks the selected queue and object-storage services.