# Build Vibe 14.0.0 — Deep Google AI Studio + Competitor Audit

Date: 2026-10-07  
Repository: `MuhammadAsimdeveloper/CodingVibes`  
Workstream: Phase 14 — AI Studio-inspired Build Mode, pricing policy, free quotas, local PostgreSQL

## Executive decision

**Repository-side phase 14 is implemented on branch `phase-14-ai-studio-postgres`.**

The product now has a stricter free-plan policy of **3 basic websites + 1 3D website + 1 animated website per month**, with **native Android/iOS/desktop and APK/AAB generation paid-only**. Build Mode now exposes structured AI Studio-inspired chips, annotation/focus context and remixable gallery entries, while preserving Build Vibe's existing verified build/repair contract.

The PostgreSQL path is operational as a local scale-out foundation, not a pretend full migration of the application Store.

## 1. Google AI Studio capability extraction

Google AI Studio Build mode currently provides:
- prompt-first full application generation with live preview;
- AI Chips for specialized prompt context such as image generation and Google Maps data;
- an “I'm Feeling Lucky” starting point for generated project ideas;
- an App Gallery with remix/copy behavior;
- GitHub import, bidirectional sync and local ZIP export;
- a Code tab for direct edits;
- context-aware multi-file agent behavior;
- verified execution intended to reduce hallucinated changes;
- multimodal prompting;
- a platform selector for web and native Android;
- native Android generation using Kotlin + Jetpack Compose, with a browser-based emulator and physical-device installation path;
- Google Workspace integrations where configured;
- direct deployment from Build mode through Google Cloud/Cloud Run for eligible accounts.

Sources: Google AI for Developers' current Build mode and deployment documentation. citeturn336878search1turn336878search0

### Build Vibe parity matrix

| Capability | Before phase 14 | Phase 14 result |
|---|---|---|
| Prompt-first build | Present | Retained |
| Live preview | Present | Retained |
| Context-aware multi-file changes | Present | Retained |
| Verified execution | Present | Retained and surfaced in Build Mode |
| Iterative text changes | Present | Retained |
| GitHub import/export | Present | Exposed as first-class Build Mode capability |
| App gallery | Existing template catalog | Remix surface added |
| AI chips | Missing as a unified surface | Added as structured chips |
| Annotation/focus mode | Missing as a unified surface | Added as bounded structured annotations |
| Multimodal prompt context | Asset system existed | Build Mode can pass chip/annotation context |
| Platform selector | Existing target selector | Preserved and tied to plan policy |
| Native Android/APK | Existing paid-capable target pipeline | Explicitly blocked on Free |
| Google Workspace auto-OAuth | Not implemented as an AI Studio clone | Remains a provider-specific future connector |
| Cloud Run Starter Tier | Not implemented | Deployment remains adapter-based |

### Important product distinction

The new Build Mode layer is **inspired by the interaction patterns**, not a copy of Google AI Studio's internal services. Chips are Build Vibe context controls; they do not falsely claim that a Google image or Maps backend exists when the corresponding provider is not configured.

## 2. Competitor benchmark

### Bolt

Current public pricing lists Free at $0, Pro at $25/month, Teams at $30 per member/month, and Enterprise as custom. Free includes a 300K daily / 1M monthly token allowance, hosting and unlimited databases; Pro adds custom domains, SEO, larger limits and AI image editing. citeturn882923search0

### Lovable

Current public pricing lists Free at $0, Pro at $25/month and Business at $50/month, with Enterprise custom. Free includes private workspace projects, unlimited collaborators and Cloud; Pro adds custom domains, roles/permissions and design systems. citeturn882923search1

### Base44

Current pricing lists Free at $0, Starter at $16/month when billed annually, Builder at $40/month, Pro at $80/month and Elite at $160/month. Free includes up to five apps plus authentication, database functionality and analytics; paid tiers add more credits, domains, GitHub and support. citeturn882923search2turn882923search4

### Replit

Current public pricing lists Core at $20/month ($18/month billed annually), Pro at $100/month ($90/month billed annually), and Enterprise custom. Core includes AI integrations and free-mode usage; Pro adds higher limits, parallel agents, collaborators and database rollback. citeturn882923search5

## 3. Build Vibe pricing decision

| Plan | Price | Monthly website allowance | Native/APK | Key positioning |
|---|---:|---|---|---|
| Free | $0 | 3 basic + 1 3D + 1 animated | No | High-conversion trial |
| Pro | $12/mo | 100 basic / 20 3D / 20 animated | Yes | Serious solo builder |
| Team | $29/mo | 500 basic / 100 3D / 100 animated | Yes | Small product teams |
| Enterprise | Custom | Contracted | Yes | Commercial sales tier; not yet a separate in-app billing plan |

The paid tiers intentionally sit below Bolt/Lovable/Replit while keeping Build Vibe's verified target pipeline as the differentiator. The Free plan is deliberately capability-rich but hard-capped by build type instead of allowing unlimited low-value generations.

Annual list prices in the release config are $120/year for Pro and $290/year for Team. These are packaging numbers, not guarantees of market acceptance; monitor conversion, gross margin and support burden before locking them permanently.

## 4. Free quota model

The old Free allowance was a generic run/token budget only. Phase 14 adds stable product buckets:
- Basic: 3/month
- 3D: 1/month
- Animated: 1/month
- Native: 0/month

All five allowances are counted from created build runs for the current UTC month. This makes abuse harder to hide behind prompt wording and gives users a predictable entitlement.

A build containing 3D language is charged to the 3D bucket first. Advanced motion keywords such as GSAP/ScrollTrigger/Lottie can additionally invoke the Pro-only advanced-animation feature gate.

## 5. Native/APK policy

Build Vibe already contains Android/Kotlin, Android TWA, Expo, Flutter, SwiftUI and desktop target contracts plus isolated runner verification. Phase 14 adds an explicit plan gate so Free requests for native apps or APK/AAB output fail before a build run is created.

Paid native output still depends on a real runner/toolchain. The source cannot honestly certify an APK without Android build tooling or an isolated runner.

## 6. AI Studio-inspired implementation added

### API

- `GET /api/builder/ai-studio` returns the feature registry, chip catalog, build presets and remixable gallery metadata.
- `POST /api/agent/stream` now accepts bounded `chips` and `annotations` context.
- Free-plan build admission checks the new website buckets before creating a run.

### Studio UI

The studio now creates a compact Build Mode panel beside the prompt area with:
- image-generation context chip;
- Maps context chip;
- web-research context chip;
- workspace-data context chip;
- focus-selection annotation;
- remix buttons for featured gallery starters.

### Safety boundary

Prompt context is normalized and bounded. Annotation payloads are capped and stripped of control characters. Project files and external research remain untrusted data rather than instructions to the agent.

## 7. PostgreSQL status

Local PostgreSQL is now provisioned in `compose.local.yml` with PostgreSQL 17 Alpine, health checks, a named persistent volume, a Build Vibe service dependency and an internal Compose connection string.

`npm run postgres:setup` now health-checks the database and applies the existing reference migration.

**Architecture boundary:** the main `Store` remains SQLite. PostgreSQL currently owns only the explicit scale-out reference contracts until the full persistence migration is designed and validated.

## 8. Remaining gaps

1. True visual canvas annotation over the live preview. Current “Focus selection” is a bounded prompt-text selection that becomes structured annotation data, not yet a pixel-accurate overlay.
2. First-party Google Workspace setup parity. Build Vibe has provider connectors, but not AI Studio's automatic Google Workspace OAuth setup.
3. Provider-native image/Maps tool execution. Current AI chips are orchestration context, not bundled Google image/Maps services.
4. Full PostgreSQL application-store migration with dual-write/backfill/rollback.
5. Production runner infrastructure and Android/iOS toolchains.
6. Production payment credentials, domain/DNS/TLS, monitoring, secret management and live provider accounts.

## 9. Launch gates

This is a **phase-14 candidate**, not a claim that the public service is already launched. Before launch, the existing CI and deployment gates must confirm a real model provider, isolated runner, persistent production database/backup path, quota enforcement, browser verification, live billing credentials and production DNS/TLS.

## 10. Next engineering phase

Phase 15 should focus on real visual annotation overlays, first-class provider actions behind AI Chips, and a staged PostgreSQL persistence migration with backup/rollback drills.

## Primary sources

Google AI Studio Build mode: https://ai.google.dev/gemini-api/docs/aistudio-build-mode  
Google AI Studio deployment: https://ai.google.dev/gemini-api/docs/aistudio-deploying  
Bolt pricing: https://bolt.new/pricing  
Lovable pricing: https://lovable.dev/pricing  
Base44 pricing: https://base44.com/pricing  
Replit pricing: https://replit.com/pricing  
Supabase billing: https://supabase.com/docs/guides/platform/billing-on-supabase
