# Build Vibe production launch checklist

This checklist is the final operator gate for a public paid launch.

## 1. Core production contract

Set NODE_ENV=production, HOST=0.0.0.0, an HTTPS CODINGVIBES_PUBLIC_URL, a random session secret of at least 32 characters, persistent database/project/work/checkpoint/backup directories, an isolated production runtime (Daytona or a hardened container), browser verification, and quota enforcement.

Run:

npm install
npm test
npm run check
npm run e2e
NODE_ENV=production npm run launch:preflight

The /ready endpoint must return ready: true before public traffic is enabled.

## 2. AI providers

Configure at least one production model provider. Provider secrets remain server-side.

## 3. Billing

Set CODINGVIBES_BILLING_REQUIRED=true for commercial launch and configure Stripe secret/webhook values plus the Pro and Team monthly price IDs.

## 4. Customer delivery

Verified projects can be pushed to GitHub, exported as ZIP, and deployed through compatible adapters. Vercel, Netlify and Cloudflare Pages are direct static deployment adapters. GitHub is the portable source path.

### Hostinger

Current Hostinger Node.js Web Apps support GitHub repository import and ZIP upload, including Node.js 22.x. Build Vibe uses Node 22 and can therefore be deployed there.

Build Vibe has a Hostinger-assisted deployment path: it publishes the verified project to GitHub and returns the exact next step for importing that repository into Hostinger. A direct Hostinger deployment API is deliberately not claimed.

For a complete Build Vibe server deployment on Hostinger, use a Node.js Web App or VPS and configure environment variables in Hostinger rather than committing .env files.

## 5. Native apps

Android, Flutter, iOS, Tauri and other native targets are source-generatable, but final binary verification requires the real SDK/toolchain runner.

## 6. Security and operations

Use TLS at the edge, keep /api/* uncached, maintain backups, keep the /ops console restricted by CODINGVIBES_SUPERADMIN_EMAILS, rotate credentials, and monitor application/runtime/provider errors.

## 7. Launch decision

GREEN: GET /ready is 200 with ready:true, CI is green, billing is configured, at least one production AI provider is configured, browser verification is enabled, backups are writable, and the production deployment has been smoke-tested.

RED: any blocker from /ready, any failing CI gate, missing Stripe production configuration for a paid launch, missing AI provider, missing isolated runtime, or inability to verify browser-visible output.

## Additional visual-quality checks

For relevant release candidates, use [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) and verify:

- [ ] Visual hierarchy and typography are coherent.
- [ ] Mobile, tablet and desktop layouts work.
- [ ] Key controls and forms function.
- [ ] Reduced-motion and fallback states work.
- [ ] Animation and 3D asset failures are recoverable.
- [ ] Accessibility and SEO checks ran.
- [ ] Browser/runtime errors and performance evidence were reviewed.

Mark unavailable checks BLOCKED or NOT RUN, never PASS.

