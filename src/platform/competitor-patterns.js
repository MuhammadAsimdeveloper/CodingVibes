// Product patterns are feature-inspired, not copied source code or proprietary assets.
// Each pattern is represented as an original Coding Vibes capability.
export const COMPETITOR_PATTERNS = [
  {source:'Replit Agent',pattern:'agentic_build_loop',adaptation:'Plan, generate, test, repair and deploy from one conversation.'},
  {source:'Lovable',pattern:'prompt_to_product',adaptation:'Prompt-first product generation with database, auth, integrations and hosting-aware verification.'},
  {source:'WordPress',pattern:'extensible_cms',adaptation:'Structured content collections, visual editing, media, revisions and extension points.'},
  {source:'Bubble',pattern:'visual_full_stack',adaptation:'Visual product controls for data, workflows and responsive behavior without making code the primary UX.'},
  {source:'FlutterFlow',pattern:'multi_platform_mobile',adaptation:'One product model can target Android/iOS/web with platform-specific capabilities.'},
  {source:'Bolt',pattern:'fast_preview_deploy',adaptation:'Fast prompt-to-preview loop with deployment as a first-class action.'},
  {source:'Base44',pattern:'built_in_services',adaptation:'Treat auth, database, storage, email and payments as composable platform services.'},
  {source:'v0',pattern:'design_to_app',adaptation:'Design-system-aware generation and iterative UI refinement from natural language.'},
  {source:'Lovable',pattern:'parallel_drafts',adaptation:'Independent project/draft conversations with separate preview state and safe acceptance before publishing.'},
  {source:'Bolt',pattern:'visual_edits',adaptation:'Dependency-free preview selection metadata feeds the conversational edit target.'},
  {source:'Base44',pattern:'grounded_assistant',adaptation:'Product-aware assistant combines project state, stored conversations and explicit fallback rules.'},
  {source:'modern_3d_builders',pattern:'media_rich_3d',adaptation:'3D scenes treat models, images, video, hotspots, camera paths, materials and lighting as editable data.'},
];

export function competitorResearch(){return COMPETITOR_PATTERNS.map(x=>({...x}));}
