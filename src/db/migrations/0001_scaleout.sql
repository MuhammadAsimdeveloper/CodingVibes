-- Build Vibe scale-out reference schema.
-- Runtime migrations are defined in src/db/postgres.js for self-contained deployments.
CREATE TABLE IF NOT EXISTS codingvibes_outbox (
  id UUID PRIMARY KEY, topic TEXT NOT NULL, payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(), locked_at TIMESTAMPTZ, locked_by TEXT,
  last_error TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_codingvibes_outbox_ready ON codingvibes_outbox(status, available_at);

CREATE TABLE IF NOT EXISTS codingvibes_object_refs (
  id UUID PRIMARY KEY, object_key TEXT UNIQUE NOT NULL, provider TEXT NOT NULL, bucket TEXT,
  size_bytes BIGINT NOT NULL, sha256 TEXT NOT NULL, content_type TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS codingvibes_audit_events (
  id UUID PRIMARY KEY, actor_user_id TEXT, action TEXT NOT NULL, resource_type TEXT NOT NULL,
  resource_id TEXT, metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_codingvibes_audit_events_created ON codingvibes_audit_events(created_at DESC);