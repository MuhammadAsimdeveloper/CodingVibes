# Deployment credential verification

Build Vibe provides a **read-only** credential probe for the selected deployment adapter:

```sh
CODINGVIBES_DEPLOY_PROVIDER=vercel npm run deployment:credentials
```

Set `CODINGVIBES_DEPLOY_PROVIDER` to the provider ID you intend to use. Supported IDs and the required environment variables are:

| Provider ID | Required environment variables | Read-only check |
|---|---|---|
| `github` | `GITHUB_TOKEN` | GitHub `GET /user` confirms token authentication and identity |
| `hostinger` | `GITHUB_TOKEN` | GitHub identity only; repository write permissions are not proven |
| `vercel` | `VERCEL_TOKEN` | Vercel `GET /v2/user` confirms token authentication and identity |
| `netlify` | `NETLIFY_AUTH_TOKEN` | Netlify `GET /api/v1/user` confirms token authentication and identity |
| `cloudflare` | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Verifies token is active and configured account is readable |
| `coding-vibes` | `CODINGVIBES_HOSTING_API_URL` or `CODINGVIBES_CLOUD_API_URL` | Reports `UNVERIFIED` until the hosting adapter exposes a documented, non-mutating health/credential endpoint |
| `manual` | None | Reports `NOT_REQUIRED` |

## Verify a saved provider connection

A signed-in workspace user can send `POST /api/deployment/providers/{providerId}/verify`. The server reads that user's saved connection and runs the provider's read-only probe; it does not accept or echo a token in the request body. The response includes a sanitized verification status and never proves provider write/publish permissions. Supported connected providers are checked with an identity/token endpoint; Build Vibe Cloud remains `UNVERIFIED` until its hosting adapter defines a safe non-mutating credential endpoint. A stored token alone is not reported as authenticated.

## Result meanings

- `PASS`: a provider's read-only identity/token check succeeded.
- `NOT_REQUIRED`: manual ZIP export needs no managed provider credential.
- `NOT_CONFIGURED`: provider or required environment variables are missing.
- `BLOCKED`: provider rejected the credential, the token is inactive, the account is not accessible, the endpoint configuration is invalid, or the provider ID is unsupported.
- `UNVERIFIED`: the provider is unavailable, its response cannot be validated, or Build Vibe has no safe probe for that adapter.

The JSON output lists variable names and sanitized check results only. It never prints token values or response bodies. Requests use bounded timeouts and do not follow redirects.

**Important boundary:** `PASS` validates authentication and, for Cloudflare, account readability. It does not prove permission to create/update projects, upload files or publish production deployments. Complete `npm run deployment:preflight`, confirm the required provider scopes with the provider administrator, and perform a deliberate staging deployment/smoke test before a production launch. Do not make destructive test deployments to production.

These probes are intentionally not part of ordinary CI because CI must not require live customer/provider secrets. They must be run in the intended production environment, with secrets supplied through the deployment platform's secret manager—not committed to the repository.
