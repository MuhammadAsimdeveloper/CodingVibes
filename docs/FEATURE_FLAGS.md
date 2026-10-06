# Feature flags

Build Vibe feature flags are deterministic, bounded and fail closed.

Each flag has a key, enabled state, optional percentage rollout, allowed environments, a kill switch and an opaque configuration object. Rollouts are deterministic from the flag key plus user/project identity, so a user does not randomly move between variants during a session.

A kill switch always disables a feature. An environment not listed in a flag is also disabled.

Super-admin management is exposed through:

- `GET /api/ops/feature-flags`
- `PUT /api/ops/feature-flags`

Project-facing evaluation is exposed through:

`GET /api/feature-flags/evaluate?key=<flag>&projectId=<project>`

No flag endpoint returns secrets. Flag configuration should contain presentation or behavior parameters only.

Feature flags are for controlled rollout and rapid rollback; they must not be used to bypass authentication, authorization, verification, dependency approval or release gates.
