# Build Vibe billing

Build Vibe supports subscription billing through Stripe and Paddle. The billing layer is provider-aware, keeps entitlements in the local database, verifies signed webhooks, and exposes a hosted customer portal.

## Local development

Run `npm run setup`. It creates `.env.local` with local-safe defaults and random server secrets. Leave `CODINGVIBES_BILLING_REQUIRED=false` for local development.

## Stripe

Set:

- `CODINGVIBES_BILLING_PROVIDER=stripe`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_TEAM_MONTHLY`

The application creates hosted subscription checkout sessions and a customer-portal session. Stripe webhooks must be delivered to `/api/billing/webhook`.

## Paddle

Set:

- `CODINGVIBES_BILLING_PROVIDER=paddle`
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_PRICE_PRO_MONTHLY`
- `PADDLE_PRICE_TEAM_MONTHLY`
- `PADDLE_CHECKOUT_URL` (your approved Paddle checkout/default payment URL)

Paddle checkout transactions are created through `/transactions`, and customers can use the hosted customer portal. Paddle webhooks are verified from the raw request body and `Paddle-Signature`, then the subscription state is synchronized into the same billing account.

Paddle portal sessions are intentionally created on demand because their authenticated links are temporary.

## Production

Set `CODINGVIBES_BILLING_REQUIRED=true`. Readiness fails closed when the selected provider is incomplete.

Never put provider API keys in source control. Keep production secrets in your host's secret manager/environment and rotate webhook secrets when necessary.

For a new deployment, run the readiness/launch checks after configuring the selected provider.
