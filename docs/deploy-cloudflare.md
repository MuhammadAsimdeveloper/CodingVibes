# Cloudflare deployment strategy

Coding Vibes' full control plane should run on a normal Node.js host because it uses SQLite and Node APIs. Cloudflare is still a strong edge layer.

## Recommended uses

1. Point your domain's DNS to the Hostinger origin through Cloudflare.
2. Proxy the public landing pages and static assets through Cloudflare.
3. Cache static assets aggressively; never cache authenticated `/api/*` responses.
4. Add Cloudflare WAF and rate limiting before the application.
5. Host exported, static generated websites on Cloudflare Pages when a project does not need a server.

Pages Functions run on Workers and have a subset of Node APIs, while static asset requests can be free and unlimited on the Cloudflare Workers/Pages free tier. The current Coding Vibes SQLite/Node server is therefore not a direct drop-in Pages Function.

## Static export convention

When a generated project is static-only, export its `public/` directory (or equivalent static output) to Cloudflare Pages. Keep application secrets out of the generated site.

## Generated-site visual readiness

Use [BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) alongside this Cloudflare-specific guide when deploying generated visual experiences. Confirm the actual target build, asset paths, environment configuration, redirects/canonicals and post-deploy smoke checks; do not infer successful deployment from generated source or a handoff package.
