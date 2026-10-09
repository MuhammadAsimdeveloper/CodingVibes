# Build Vibe — Assistant, Content, Templates & Immersive Product Layer

## Product intent

Build Vibe should let a beginner describe an outcome once, then continue naturally: “make the buttons blue”, “add 40 cars”, “replace the hero video”, “make the SUV black”, or “add a 360 tour”. The system keeps project context, asks focused questions when the request is under-specified, and sends actionable changes through the same verified build/repair pipeline.

## Assistant contract
- Project-aware chat with persistent conversation history.
- Two levels of context: bounded chat history plus project memory/template/build summary.
- Deterministic intent classification for common micro-edits.
- Clarification cards with selectable answers for generic or incomplete build requests.
- Safe deterministic fallback if the model provider is unavailable.
- Provider-neutral routing and streaming.
- Aira-compatible local model contract using llama.cpp/GGUF, Ollama or another OpenAI-compatible local server; Aira itself is not embedded.
- No invented execution results, no secret exposure, no verification bypass, and no unscoped project edits.
- Actionable intents can be applied directly into Studio as a verified build request.

## Template system

Templates are discovery blueprints, not a second builder. The template is selected first, persisted into project memory, and the project is then opened in Studio with the template contract already loaded.

Genre facets include:
- Landing pages
- Web apps
- Mobile apps
- Android / APK
- 3D experiences
- Animated / motion
- Portfolios
- Ecommerce
- Real estate
- Business / company
- Marketplaces
- SaaS
- Education
- Hospitality
- Events
- Content / CMS
- Immersive

Native starter templates now cover Android Kotlin, Web APK/TWA and Expo mobile apps.

## Catalog + 3D model lifecycle

1. Admin/content workflow stores product/property/scene records separately from page markup.
2. Asset upload stores source photos/video/model files inside the project asset system.
3. 1–4 source images can be sent to a provider-neutral image-to-3D adapter.
4. Meshy or Tripo runs asynchronously and returns a task id.
5. Build Vibe polls task state and stores the resulting model as a local project asset.
6. A generated model can be attached to products, properties, or scenes records.
7. The existing Three.js runtime provides orbit/360 viewing, camera tour, video walkthrough and WebGL/reduced-motion fallbacks.
8. Product edits can be issued in short natural language; the assistant maps them to the right product/build context.

## QA gates

Immersive releases now check for model loading, 360/orbit interaction, WebGL render surface, fallback, loading/error states, reduced-motion support, media integration when required, hotspots when required, camera path/walkthrough when required, and touch/keyboard interaction warnings.

The existing build verification/repair loop remains the final release gate.

## Research-driven gaps addressed

Leading AI builders increasingly combine conversational editing with contextual assistance, version/draft exploration, and built-in backend/storage integrations. Build Vibe now has the missing assistant continuity, selectable clarification, direct project-aware edits, and template-to-Studio flow while retaining its stronger verified-build architecture.

For immersive commerce, multi-view image-to-3D APIs now support 1–4 images, asynchronous tasks and GLB/other exports. Build Vibe's model adapter follows that contract and keeps provider keys server-side.

## Deployment gate

Before production:
- Configure a cloud AI provider OR a self-hosted local OpenAI-compatible backend.
- For local mode, run a compatible llama.cpp server with a GGUF model and set CODINGVIBES_PROVIDER=llama-cpp, CODINGVIBES_LLAMA_CPP_BASE_URL, and CODINGVIBES_MODEL_LOCAL.
- Configure MESHY_API_KEY and/or TRIPO_API_KEY for 3D generation.
- Configure the existing auth, GitHub, deployment, storage/database and billing integrations required by the selected plan.
- Run npm test, npm run check, SEO checks, e2e/browser e2e, security/scale-out doctors, deployment preflight and npm run mirofish:status.
- Only publish a verified build artifact; keep provider credentials out of project source.

## External scenario testing

MiroFish's public site currently exposes a static simulation/demo workflow; custom scenarios require its self-hosted backend. Use Build Vibe's MiroFish adapter for automated status/smoke checks and a self-hosted MiroFish instance for real custom-project simulation once deployment infrastructure is available.
