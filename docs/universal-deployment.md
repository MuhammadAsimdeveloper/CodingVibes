# Coding Vibes Universal Deployment

## Principle
Build once → export once → deploy anywhere.

Coding Vibes produces a provider-neutral project artifact. Provider adapters consume the same generated source and add only deployment-specific configuration.

## Site ownership
Every generated website contains an owner-only /admin portal.
The portal reads and edits the same structured content source used by the public site. Content changes do not require replacing the visual template.
A public /login page is generated only when the user requests login/sign-in/authentication. When enabled, the generated login uses Google OAuth. Google client secrets stay server-side.

Configure these variables in the deployed site:
- CV_SESSION_SECRET
- CV_OWNER_EMAIL
- CV_OWNER_PASSWORD
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- GOOGLE_REDIRECT_URI
- CV_GOOGLE_OWNER_EMAILS

Never commit .env. Use .env.example as the contract.

## Provider compatibility
| Provider | Source push | Static deploy | Server-backed generated admin |
| --- | --- | --- | --- |
| GitHub | Yes | Yes | Yes (source repository) |
| Download ZIP | Yes | Yes | Yes (manual host) |
| Coding Vibes Hosting | Adapter reserved | Planned | Planned |
| Vercel | — | Yes | Requires serverless persistence adapter |
| Netlify | — | Yes | Requires serverless persistence adapter |
| Cloudflare Pages | — | Yes | Requires Workers/Pages persistence adapter |
| Other/cPanel | ZIP | Yes | Yes on compatible server/shared hosting |

The matrix is intentionally conservative. A provider is not marked server-compatible merely because it can upload files.

## GitHub
The builder uses server-side OAuth connections and never sends provider credentials to the generated project or AI model. Publishing can create a repository or update an existing repository/branch.

## Manual hosting / cPanel
Download the ZIP and upload its contents to the host document root, commonly public_html/ for cPanel/shared hosting.
For Node-backed sites, the host must support a Node process and the generated environment variables.

## Re-deploy
Editing a project does not require changing the generated application's source architecture for a provider. Coding Vibes selects the latest verified workspace, rebuilds the provider-neutral artifact, and sends that artifact through the selected provider adapter.

## Adding a provider
Implement a provider inside src/deployment/providers.js and keep provider API, auth, status and error handling there. The builder should continue calling deployProject({ project, provider, options }) rather than provider-specific functions.
