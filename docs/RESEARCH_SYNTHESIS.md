# codingVibes 2.2 research synthesis

## Market patterns reviewed

The current market is converging around several patterns rather than one “vibe coding” product category:

- **Prompt-to-product builders:** Webflow AI, Wix Harmony, Figma Make and similar systems combine natural-language generation with visual refinement. Figma Make explicitly supports prompt-generated screens/logic/code, visual properties and code editing; Webflow AI generates multi-page sites and a foundational design system; Wix Harmony combines an AI agent with manual editing.
- **AI coding agents:** Claude Code Projects, OpenHands and comparable agents increasingly emphasize parallel work, shared context, branch/worktree isolation, repair loops and reviewable outputs.
- **Mobile/native builders:** Expo/EAS, Flutter, React Native, Kotlin Multiplatform and SwiftUI represent distinct paths from one source tree to mobile/native artifacts.
- **Web-to-Android packaging:** Trusted Web Activities provide a standards-based path for opening a PWA/web app from an Android app.

## Product consequences for codingVibes

1. The build contract must describe **target + language + framework + artifacts**, not only pages and API routes.
2. Design must be a first-class contract with tokens and interaction intent, not an afterthought in generated CSS.
3. A generated source tree and a verified artifact are different states. Native SDKs/signing/emulators must be explicit prerequisites.
4. Visual quality needs its own browser-level evidence: accessibility basics, responsive metadata, overflow, console errors, failed requests, and screenshots when enabled.
5. Dependency installation should be explicit and auditable because target frameworks naturally bring external packages.
6. The next strategic step is an **isolated target runner** layer for Android/iOS/Flutter/Rust/KMP rather than pretending the Node sandbox can build every ecosystem.
