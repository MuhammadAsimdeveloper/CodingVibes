# codingVibes connectors

The connector layer keeps model routing independent from the agent. A connector can be the primary model provider, a gateway, or a fallback in the provider chain.

## OmniRoute

Set:

```bash
CODINGVIBES_PROVIDER=omniroute
OMNIROUTE_API_KEY=your-key
CODINGVIBES_MODEL_STANDARD=if/kimi-k2-thinking
```

The default base URL is `http://127.0.0.1:20128/v1`. Override it with `CODINGVIBES_OMNIROUTE_BASE_URL` or a connector profile.

## Fallback chain

Use a comma-separated ordered chain:

```bash
CODINGVIBES_PROVIDER_CHAIN=omniroute,openrouter,deepseek,openai
```

The router uses the first configured connector and falls back only when a request fails before any streamed tokens have been emitted.

## Supported connector families

OmniRoute, OpenRouter, OpenAI, DeepSeek, Groq, Mistral, xAI, Cerebras, Together AI, Fireworks AI, Anthropic, Ollama, LM Studio, and custom OpenAI-compatible endpoints are represented in the connector catalog.

`GET /api/connectors` exposes non-secret connector metadata and configuration status. `POST /api/connectors/test` performs a live `/models` connectivity check for the selected connector.

## Local component versus connector boundaries

For the [reconstruction initiative](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md), distinguish copied/adapted project-local components from genuine external-service connectors. A generated site must not depend on a separate repository at runtime just to render a component. External connectors still require explicit configuration, credential boundaries, health checks and truthful failure states.
