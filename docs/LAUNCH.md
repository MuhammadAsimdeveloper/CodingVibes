# Launch guide

## 1. Local development

```bash
cp .env.example .env
npm install
npm test
npm run check
npm run e2e
npm run smoke
npm start
```

Use the deterministic fallback to validate infrastructure. For the real AI-builder experience, configure a model provider so planning, application generation and bounded repair can run model-first. The UI shows whether a run used model generation or the safe fallback.

## 2. Model providers

OpenAI-compatible hosted provider:

```env
CODINGVIBES_PROVIDER=openai
OPENAI_API_KEY=...
CODINGVIBES_MODEL_STANDARD=...
```

OpenRouter:

```env
CODINGVIBES_PROVIDER=openrouter
CODINGVIBES_API_KEY=...
CODINGVIBES_MODEL_STANDARD=openrouter/free
```

Anthropic native Messages API:

```env
CODINGVIBES_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
CODINGVIBES_MODEL_STANDARD=claude-sonnet-5
```

Local Ollama / LM Studio use the OpenAI-compatible endpoint. The platform does not promise a permanently free inference API; free-model availability and limits are external provider behavior.

## 3. Runtime

Production should use Daytona or the container runtime. For Daytona install the optional SDK dependency and provide `DAYTONA_API_KEY`:

```bash
npm install @daytona/sdk
```

Then configure `DAYTONA_API_URL` / `DAYTONA_TARGET` only when your Daytona account requires non-default values.

The local runtime is intentionally blocked in production unless `CODINGVIBES_ALLOW_HOST_EXECUTION=true` is explicitly set.

## 4. Browser verification

The production image installs Chromium through Playwright. Keep `CODINGVIBES_ENABLE_BROWSER=true` when browser verification is part of the launch contract. If Playwright is enabled but unavailable, verification fails closed.

## 5. Persistence and scaling

SQLite is suitable for the initial single-instance MVP. Before horizontal scaling, move the persistence layer to a managed relational database and introduce explicit job coordination/locking.

## 6. Production requirements

Set a long random `CODINGVIBES_SESSION_SECRET`, terminate TLS at the edge, keep the application behind authentication, isolate generated code in Daytona or the hardened container runtime, define model/provider budget controls, back up persistent state, and add monitoring/log retention.

## 7. Model-first generation limits

The model receives a bounded, secret-filtered repository context. It can return a constrained complete-file changeset, but new package installation is not implicitly performed by the generator. Prefer browser-native capabilities or dependencies already present in the project until an explicit dependency-approval flow is added.

## 8. Launch candidate gates

Version 3.0 adds explicit dependency approval, billing/usage controls and a production readiness endpoint. Before opening the service to the public, run `GET /ready` and require `ready: true`. Configure a production model provider, a secure session secret, isolated execution, quota enforcement, database persistence/backups, TLS at the edge, monitoring, and (when monetizing) Stripe prices plus the webhook secret.

The platform already supports bounded task orchestration, repository indexing, checkpoints, cancellation/resume, review gates, GitHub import, AI connector fallback, target runners and browser verification. Multi-agent parallelism, full visual diffing and one-click multi-cloud deployment remain later scale features rather than prerequisites for the core verified build workflow.


## Target builds

Native/mobile targets require their real SDK toolchains. codingVibes now blocks verification when those toolchains are unavailable instead of treating source generation as a successful artifact build. See `docs/TARGET_MATRIX.md`.
