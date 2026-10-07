# Build Vibe Phase 14 — Competitive Audit & Local Database Setup

## Executive result

Build Vibe is ahead of many basic prompt-to-site builders on verified generation, target-aware builds, native runner contracts, structured content, 3D recipes and deployment evidence. The largest remaining product gaps are stateful assistant UX, visible execution traces, multimodal project intake, integrated tool traces and full PostgreSQL persistence.

## Google AI Studio audit

Current Google AI Studio emphasizes: prompt-to-app creation from ideas/screenshots/docs; remixing existing creations; conversational editing; preview/share; one-click deployment to Google Cloud Run; and Save to GitHub. Its developer stack adds a stateful Interactions API with previous-interaction conversation continuity, observable execution steps, background execution, and a unified model/agent interface.

Google's current tool surface includes Google Search, Maps, Code Execution, URL Context, Computer Use (preview), File Search, and custom Function Calling. This is the benchmark for the next Build Vibe assistant evolution: build context + tools + execution trace + background work + persistent history.

## Competitor audit

Lovable: $25/month Pro and $50/month Business on its current public pricing; credit-based app building and collaboration.
Bolt: $25/month Pro and $30/member/month Teams; public/private projects, tokens, hosting, databases, custom domains and SEO.
Replit: free entry plus paid Core/Pro/Enterprise; usage credits, AI agents, hosting, collaboration and database capabilities.
Base44: free entry; current public annual pricing shows Starter $16, Builder $40, Pro $80 and Elite $160; integrated backend/database, visual editor, analytics and app-building.
v0: free entry with paid credit-based tiers; design-to-full-stack workflow and database-connected application generation.

## Build Vibe pricing policy

Free — $0
- 3 basic website creations
- 1 3D website creation
- 1 animated website creation
- 0 APK/native creations
- 5 build runs/month
- 250k model tokens/month
- assistant history, templates, visual editing and core SEO

Pro — $7/month
- 25 basic, 10 3D, 25 animated and 10 APK/native creations
- 100 runs/month and 5M tokens/month
- deployment, private projects, custom domains, advanced SEO, AI video and advanced animation

Team — $15/month
- 100 basic, 50 3D, 100 animated and 40 APK/native creations
- 1,000 runs/month and 25M tokens/month
- collaboration, approvals, audit export and scale-out

Business — $39/month
- 500 basic, 200 3D, 500 animated and 100 APK/native creations
- 5,000 runs/month and 75M tokens/month
- extended video and production-scale capabilities

Enterprise — custom
- SSO/security/compliance, dedicated capacity, private infrastructure, custom retention/SLA and onboarding

## Local PostgreSQL

The repository already has a provider-neutral PostgreSQL adapter and scale-out persistence layer. This phase standardizes the laptop workflow:

1. npm install
2. npm run db:postgres:up
3. npm run db:postgres:setup
4. npm run db:postgres:doctor

Compose starts PostgreSQL and Adminer on the laptop. A copyable configuration is included in .env.postgres.local.example.

Important boundary: SQLite remains the synchronous application Store by default. PostgreSQL currently backs the scale-out durability primitives instead of silently changing all application persistence semantics. A full Store migration is a separate portability phase requiring schema mapping and integration/regression coverage.

Recommended hosted free database options:
- Supabase for PostgreSQL plus Auth/Storage/API; current Free tier advertises 500 MB database storage and 50,000 MAU.
- Neon for database-first serverless PostgreSQL with a Free tier and scale-to-zero behavior.

## Full audit — remaining gaps

Critical before broad public launch:
- Make the assistant's execution timeline first-class and visible.
- Add background assistant tasks with resumable state beyond build runs.
- Unify screenshot/document uploads with assistant context and asset storage.
- Add a safe 'tools used' trace so users can inspect what happened without seeing credentials.
- Add separate cost/size limits for 3D provider jobs and generated assets.
- Verify real Android/iOS binaries on configured runners; generation alone must never equal verification.
- Complete full application Store-to-PostgreSQL migration when operational database portability is required.

Important quality improvements:
- Expand visual-edit parser coverage and make element selection survive generated DOM changes.
- Add richer product variant/material records for 3D commerce.
- Add automated browser regression scenarios for assistant + templates + 3D Model Lab.
- Add usage analytics around project type, model cost, 3D generation success rate and repair frequency.

## Release gate

Run the complete repository release suite plus:
- npm run db:postgres:up
- npm run db:postgres:setup
- npm run db:postgres:doctor

Production deployment is ready only after the full CI workflow passes and the selected AI provider, 3D providers, storage, database, runner fleet, TLS, monitoring and billing credentials are configured.