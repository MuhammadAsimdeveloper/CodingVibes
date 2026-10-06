# Build Vibe laptop quickstart

Requirements: Node 22+, npm, Git, and a working model provider for real generation.

## First run

```bash
git clone https://github.com/MuhammadAsimdeveloper/CodingVibes.git
cd CodingVibes
npm ci
npm run setup
```

Open `.env.local` and add one AI provider key. Then:

```bash
npm start
```

Open `http://127.0.0.1:4400`. For Paddle sandbox checkout testing, set `PADDLE_CLIENT_TOKEN` and use `/pay` as the approved/default payment-link page.

## Verify before shipping

```bash
npm test
npm run check
npm run security:check
npm run launch:check
```

For browser verification and operations checks:

```bash
npm run e2e
npm run browser:e2e
npm run ops:load
npm run recovery:smoke
npm run deployment:preflight
npm run benchmark
npm run mirofish:status
```

## Production

Use a managed HTTPS endpoint, persistent storage/backups, a safe isolated runtime (Daytona or container), quota enforcement, a configured model provider, browser verification, and either Stripe or Paddle when paid billing is required.

Run:

```bash
NODE_ENV=production npm run launch:preflight
NODE_ENV=production npm run final:check
```

Do not mark an external deployment successful merely because a handoff artifact was created; use the target's post-deploy smoke verification.
