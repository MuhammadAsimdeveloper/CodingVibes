# Build Vibe 12.2 — Account authentication release contract

## Release objective
Build Vibe 12.2 closes the account-entry gap in the launch workflow by supporting both email/password accounts and first-party Google account creation/sign-in.

## Authentication contract
- Email signup remains available with an 8+ character password.
- Email login remains available through the signed Build Vibe session.
- Google OAuth uses a server-side authorization-code flow with PKCE.
- OAuth state is generated server-side, expires after 10 minutes, is consumed once, and is checked against an HTTP-only browser cookie.
- The Google callback requires a verified Google email address.
- A Google identity first resolves by Google subject; when new, a verified email can link to an existing Build Vibe account or create a new account.
- Google access tokens are used only during the login exchange; they are not stored as account credentials.
- After successful Google authentication, the user receives the same signed HTTP-only Build Vibe session used by email login.
- OAuth errors return to /app with sanitized error codes instead of exposing provider responses.

## Required Google Cloud configuration
Set these environment values in the real deployment:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI

Register the exact value of GOOGLE_REDIRECT_URI in the Google Cloud OAuth client configuration. Do not commit credentials.

## User experience
The authenticated builder login surface now presents:
- Sign in with email/password
- Create account with email/password
- Continue with Google, when Google OAuth is configured

The Google button stays hidden when the provider is not configured so email authentication remains functional in development and deployments that have not enabled Google.

## Verification
The release suite covers configuration, authorization URL construction, PKCE, one-time state consumption, verified-email enforcement, identity linking, UI entry points, server route wiring, environment examples and the JavaScript syntax gate.

Run:

npm test
npm run check
npm run final:check

## Production boundary
The repository implements the Google OAuth flow, but live Google login is only enabled after the deployment environment has real Google Cloud credentials, the exact redirect URI is registered, HTTPS is active, and the production readiness checks pass.

## Explicit non-claims
This release does not claim that a Google Cloud OAuth client is already created, that production credentials are already configured, or that a public deployment is already live.
