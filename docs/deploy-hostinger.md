# Coding Vibes on Hostinger

Hostinger is the primary deployment target for the full Coding Vibes service because the app is a Node.js server with SQLite persistence, isolated workspaces, and optional Daytona previews.

## Recommended production shape

Internet → Cloudflare DNS/CDN → Hostinger Node.js app or VPS → persistent `data/` volume → optional Daytona for previews.

### Managed Node.js hosting

Connect the public GitHub repository in Hostinger's Node.js Web App flow.

Build / install:
```bash
npm install
```

Start:
```bash
npm start
```

Set `HOST=0.0.0.0` and configure these secrets in Hostinger:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=4400
CODINGVIBES_SESSION_SECRET=<long-random-secret>
DATABASE_PATH=./data/codingvibes.db
CODINGVIBES_PROJECT_ROOT=./data/projects
CODINGVIBES_WORK_ROOT=./data/worktrees
CODINGVIBES_CHECKPOINT_ROOT=./data/checkpoints
CODINGVIBES_RUNTIME=daytona
DAYTONA_API_KEY=<your-daytona-key>
CODINGVIBES_PROVIDER=openrouter
OPENROUTER_API_KEY=<your-key>
RUNWAYML_API_SECRET=<your-runway-key>
CODINGVIBES_ENFORCE_QUOTAS=true
STRIPE_SECRET_KEY=<optional>
STRIPE_WEBHOOK_SECRET=<optional>
STRIPE_PRICE_PRO_MONTHLY=<optional>
STRIPE_PRICE_TEAM_MONTHLY=<optional>
```

### VPS / Docker

Use the included Dockerfile with a persistent bind mount for `/app/data`. Do not put `codingvibes.db` inside an ephemeral container layer.

Example:
```bash
docker build -t codingvibes .
docker run -d --name codingvibes \
  -p 4400:4400 \
  -e NODE_ENV=production \
  -e HOST=0.0.0.0 \
  -v /opt/codingvibes/data:/app/data \
  --env-file /opt/codingvibes/.env \
  codingvibes
```

Put Cloudflare in front of the Hostinger origin for DNS, TLS, caching, WAF, and rate-limit rules. Keep `/api/*` uncached.

## Free core / paid extras

The free tier is intentionally useful: users can generate basic sites, inspect and edit source, and run the normal verification loop. Paid features are gated server-side so hiding a button cannot bypass the product limits.
