# Build Vibe on Hostinger

Hostinger currently supports Node.js Web Apps on Business/Cloud hosting and VPS, with GitHub repository import and ZIP upload. Hostinger's current Node.js documentation lists Node.js 18.x, 20.x, 22.x and 24.x; Build Vibe targets Node 22.

## Recommended customer flow

1. Build and verify the project in Build Vibe.
2. Click **Prepare for Hostinger** in the Publish area.
3. Build Vibe publishes the verified project to the user's GitHub repository.
4. In Hostinger, choose **Websites → Add Website → Node.js Web App → Import Git Repository** and select that repository.
5. Enter the generated environment variables in Hostinger and deploy.

This is intentionally an assisted integration. Build Vibe does **not** pretend to have a private Hostinger deployment API. The source push is automated; the Hostinger-side website creation and account authorization are completed by the customer.

## Node.js Web App configuration

Use:

- Install/build command: `npm install`
- Start command: `npm start`
- Node.js: 22.x
- App entry: `src/server.js`/project start command through `npm start`
- Persistent data paths must point to persistent storage.

Required production environment includes:

`NODE_ENV=production`
`HOST=0.0.0.0`
`PORT=4400`
`CODINGVIBES_PUBLIC_URL=https://your-domain`
`CODINGVIBES_SESSION_SECRET=<long-random-secret>`
`DATABASE_PATH=./data/codingvibes.db`
`CODINGVIBES_PROJECT_ROOT=./data/projects`
`CODINGVIBES_WORK_ROOT=./data/worktrees`
`CODINGVIBES_CHECKPOINT_ROOT=./data/checkpoints`
`CODINGVIBES_BACKUP_ROOT=./data/backups`
`CODINGVIBES_RUNTIME=daytona`
`DAYTONA_API_KEY=<key>`
`CODINGVIBES_ENABLE_BROWSER=true`
`CODINGVIBES_ENFORCE_QUOTAS=true`
`CODINGVIBES_BILLING_REQUIRED=true`

Add your production AI and Stripe secrets separately in Hostinger's environment-variable configuration. Never commit `.env`.

## VPS

On a Hostinger VPS, Docker or a managed Node process can run the same Build Vibe application. Keep the database and project/work/checkpoint/backup roots on persistent storage and place TLS/reverse-proxy termination in front of the application.

## Generated customer websites

Customer-generated static sites can be deployed through GitHub, ZIP/manual hosting, or compatible static adapters. Server-backed generated projects require a server-capable runtime.

## Generated-site visual readiness

For projects created under [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md), retain this guide's Hostinger-specific steps and verify the real output after upload. Check asset paths, responsive behavior, forms/links, metadata and browser errors; a ZIP or successful upload alone is not proof of a working deployment.
