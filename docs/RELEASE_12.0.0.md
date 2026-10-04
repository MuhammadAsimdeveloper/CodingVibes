# Build Vibe 12.0.0 — repository cleanup and production scale-out

Build Vibe 12.0.0 is the current active repository release.

## Repository identity

The product is branded Build Vibe. The GitHub repository remains MuhammadAsimdeveloper/CodingVibes to preserve existing clone/remote compatibility. Technical environment names such as CODINGVIBES_* remain stable compatibility identifiers and are not product-facing branding.

## What is active

The active release tree contains the visual product studio, AI generation/orchestration, mandatory generated owner admin portals, optional public Google login, verified publishing, deployment adapters, native target contracts and production scale-out infrastructure.

## What was removed from the active tree

Superseded release-note files from 2.x and 3.x and version-labelled test filenames v5 through v8 were removed. Their current regression coverage remains under descriptive names:

- test/video-billing.test.js
- test/content-commerce.test.js
- test/assets-visual.test.js
- test/admin-deployment.test.js

The old versioned release-note files were historical artifacts, not runtime dependencies. Engineering history remains available through Git history.

## Release validation

Run npm run final:check.

This validates tests, syntax, end-to-end behavior, security, scale-out configuration and launch readiness.