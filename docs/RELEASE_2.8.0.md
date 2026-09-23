# Release 2.8.0 — OmniRoute Connectors + Durable Engineering Loop

2.8.0 turns the model layer into a connector-aware inference fabric and makes agent runs recoverable instead of disposable.

## AI connectors

The router now supports first-class connector definitions for OmniRoute, OpenRouter, OpenAI, DeepSeek, Groq, Mistral, xAI, Cerebras, Together AI, Fireworks AI, Anthropic, Ollama, LM Studio and a custom OpenAI-compatible endpoint.

Use `CODINGVIBES_PROVIDER` for the primary connector and `CODINGVIBES_PROVIDER_CHAIN` for ordered failover, for example:

```bash
CODINGVIBES_PROVIDER=omniroute
OMNIROUTE_API_KEY=...
CODINGVIBES_MODEL_STANDARD=if/kimi-k2-thinking
CODINGVIBES_PROVIDER_CHAIN=omniroute,openrouter,anthropic
```

OmniRoute defaults to `http://127.0.0.1:20128/v1` and is treated as an OpenAI-compatible gateway. Provider credentials are read from environment variables; secrets are never persisted in the connector catalog.

## Durable engineering loop

Every run now creates bounded filesystem checkpoints outside the worktree. Checkpoints are created at workspace initialization, after generated changes are applied, and after repair cycles. A checkpoint can be restored explicitly, and cancelled runs can resume verification from the latest checkpoint.

The repository index is now consumed by context selection so model context favors relevant files instead of simply reading the first bounded files from disk.

## Accurate usage accounting

Planning, generation and repair streaming calls report provider, model, input/output token counts when the upstream protocol exposes them, tool-call count and elapsed time into the existing usage table.

## HTTP API

- `GET /api/connectors`
- `POST /api/connectors/test`
- `GET /api/runs/:id/checkpoints`
- `POST /api/runs/:id/checkpoints`
- `POST /api/runs/:id/checkpoints/:checkpointId/restore`
- `POST /api/runs/:id/cancel`
- `POST /api/runs/:id/resume`

## UI

The workspace now shows the agent lifecycle task graph, checkpoint count, connector count, and explicit cancel/resume controls.
