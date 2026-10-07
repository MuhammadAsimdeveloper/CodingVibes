# Build Vibe — Google AI Studio & Competitor Audit (October 2026)

## Scope

This audit compares the public product behavior and pricing of Google AI Studio, Lovable, Bolt, Base44, Replit and v0 against the Build Vibe architecture.

## Google AI Studio — capabilities to absorb

- Natural-language iterative app building with Build mode.
- In-preview refinement and direct code editing.
- Native Android app generation with Kotlin + Jetpack Compose.
- Browser Android emulator preview, ADB device installation, and Google Play Internal Test Track publishing.
- Google Workspace integrations including Gmail, Sheets, Docs, Drive and Calendar with OAuth handled by AI Studio.
- Google Cloud Starter Tier for eligible accounts: up to 2 full-stack applications without setting up billing; deployments run on Cloud Run in one region.
- Export/sync into Google Antigravity while retaining development context.
- Generative media/assets such as Nano Banana-oriented asset creation and preview-driven workflows.

### Build Vibe gap response

Implemented or strengthened now: contextual conversational editing, project history, clarification cards, template-to-Studio handoff, 3D/media asset management, Android/APK target taxonomy, local LLM routing, verification and deployment gates.

Still a next-stage gap: browser Android emulator/ADB, one-click Play Internal Test Track, first-class Workspace OAuth connectors, richer in-preview annotation/drawing, and Antigravity-like external development handoff.

## Competitor capability matrix

| Capability | Google AI Studio | Lovable | Bolt | Base44 | Replit | v0 | Build Vibe |
|---|---|---|---|---|---|---|---|
| Conversational editing | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Persistent project/chat context | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Visual/in-preview editing | Yes | Yes | Yes | Yes | Partial | Yes | Yes |
| Backend/database included | Yes | Yes | Yes | Yes | Yes | Yes | Yes, with provider boundary |
| Native Android | Yes | No core parity | Limited | Limited | Via coding/runtime | App-oriented | Target/runner foundation |
| Public free app/site allowance | 2 eligible deploys | credit-based | token/hosting limits | 5 apps + credits | free-mode projects/hours | $5 credits + daily messages | 3 basic + 1 3D + 1 animated |
| Team/RBAC | Workspace ecosystem | Strong | Teams | Collaboration | Collaborators/Pro | Business/Enterprise | Workspace roles + approvals |
| GitHub/source export | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Production verification gate | Not Build Vibe-style | App/platform oriented | App/platform oriented | App/platform oriented | Runtime-oriented | Vercel-oriented | Source + browser + visual + repair |
| 3D product/catalog workflow | Not primary | Not primary | Not primary | Not primary | Not primary | Not primary | Dedicated 3D/content layer |

## Pricing benchmark

- Google AI Studio uses model/service quotas and Google Cloud deployment eligibility rather than behaving like a simple website-builder subscription. Eligible Starter Tier users can publish up to two full-stack applications at no billing setup.
- Lovable: Free, Pro $25/month, Business $50/month, Enterprise custom.
- Bolt: Free, Pro $25/month, Teams $30/user/month, Enterprise custom.
- Base44: Free; Starter $16/month billed annually; Builder $40; Pro $80; Elite $160; Enterprise custom.
- Replit: Core $20/month or $18 annually; Pro $100/month or $90 annually; Enterprise custom.
- v0: Free; Plus $30/user/month; Business $100/user/month; Enterprise custom.

## Recommended Build Vibe commercial position

Build Vibe should remain materially cheaper than the major $20–$30 creator tiers because its differentiator is verified product output plus 3D/catalog workflows, not simply chat volume.

Current proposed tiers:
- Free: $0 — 3 basic websites, 1 animated website, 1 3D website, assistant/history/design/verification; no native APK.
- Pro: $7/month — 25 basic, 25 animated, 10 3D, 10 APK/native-app creations plus advanced SEO, AI video, deployment and custom domains.
- Team: $15/month — 100 basic, 100 animated, 50 3D, 40 APK/native-app creations plus roles, approvals, audit and larger capacity.
- Business: $39/month — 500 basic, 500 animated, 200 3D, 100 APK/native-app creations plus higher AI capacity and scale-out controls.

## Remaining gaps turned into product phases

### Phase A — AI Studio parity
1. In-preview annotation/drawing tool with screenshot-linked notes.
2. Saved system instructions / reusable assistant presets.
3. Browser Android emulator + ADB verification bridge.
4. Play Internal Test Track adapter.
5. Workspace OAuth connector wizard.

### Phase B — Data platform
1. PostgreSQL primary-store adapter.
2. One-click Neon/Supabase/local Postgres configuration wizard.
3. Database schema preview and migration history.
4. Secure connection test and rotation.
5. Import/export/restore tooling.

### Phase C — Product intelligence
1. Usage/cost estimates before expensive generations.
2. Credits/top-ups and overage policy.
3. Per-project assistant memory controls.
4. Automated research briefs and competitor snapshots.
5. Customer-facing diagnostics and release evidence.

### Phase D — Scale + distribution
1. Native build runners for Android/iOS.
2. Artifact signing and store submission adapters.
3. Queue-backed multi-agent execution.
4. S3-compatible object storage.
5. Deployment promotion/rollback and canary environments.

## Launch-readiness finding

Build Vibe is approaching launch readiness but should not be labeled fully production-ready until the final full CI pipeline is green on the latest commit and the required external credentials/runners are configured. PostgreSQL support is currently a scale-out/control-plane path; the synchronous core Store remains SQLite.