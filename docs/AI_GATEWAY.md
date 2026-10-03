# Universal AI Gateway

Coding Vibes 11.0 adds a user-owned AI routing layer on top of the existing verified build agent.

## What it does

- Connects provider credentials per user, encrypted at rest.
- Supports the existing connector catalog: OpenAI, Anthropic, DeepSeek, Groq, Mistral, xAI, Cerebras, Together AI, Fireworks AI, OpenRouter, OmniRoute, Ollama, LM Studio, and custom OpenAI-compatible endpoints.
- Lets a user select a primary provider and ordered fallback chain.
- Uses the user's routing for planning, generation, repair, review, and verification.
- Preserves environment-configured providers as a server-managed fallback.
- Exposes an OpenAI-compatible gateway at /v1/chat/completions and /v1/models.
- Personal gateway tokens are hashed in the database and shown only once when created.

## Connecting a provider

Open **AI providers** in /app, choose a provider, paste its API key, and optionally set a default model.

For custom providers, use a HTTPS base URL. HTTP is restricted to local loopback endpoints for local model servers.

## External AI tools

Create a gateway token in the **Use Coding Vibes from another AI tool** section.

Use the Coding Vibes server origin as the base URL and /v1 as the API path. Plugin clients can discover the protocol at /.well-known/codingvibes-ai.json.

Example request shape:

    {
      "model": "your-model-id",
      "messages": [
        {"role": "system", "content": "You are a coding assistant."},
        {"role": "user", "content": "Build a landing page for a SaaS product."}
      ],
      "stream": true
    }

Send the token as:

    Authorization: Bearer cv_live_...

An optional X-CodingVibes-Provider header can force a configured provider for a request.

## Security model

Provider API keys are encrypted with AES-256-GCM through the existing Coding Vibes credential vault. Gateway tokens are stored as SHA-256 hashes, so the raw token cannot be recovered from the database.

Custom endpoints are validated before storage to reject embedded credentials, insecure remote HTTP endpoints, loopback/private literal IPs, and common internal DNS suffixes.

Never place a provider API key or gateway token in generated application source, browser storage, Git, or public documentation.

## Operations

Every provider connection, routing update, token creation, and token revocation is recorded in the existing durable audit log.

The control plane still owns project permissions, verification gates, deployment records, and owner-only administration; the provider router only chooses how model inference is performed.
