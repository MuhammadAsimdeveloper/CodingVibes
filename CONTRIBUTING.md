# Contributing

## Workflow

Create a focused feature or fix branch from main. Keep changes scoped, document behavior that affects customer projects, and include or update tests.

## Before opening a pull request

Run:

`npm test`
`npm run check`
`npm run e2e`
`npm run launch:check`

For a full local release gate, run:

`npm run final:check`

## Repository conventions

Keep product control-plane code under `src/`, public builder assets under `public/`, generated runtime templates under `src/templates/`, verification under `src/verification/`, and operational documentation under `docs/`.

Do not commit secrets, local databases, workspaces, previews, or generated runtime state.

## Build Vibe visual-quality changes

For work on generated-site design, shared UI components, motion, animation or 3D, read [docs/BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md](docs/BUILD_VIBE_RECONSTRUCTION_MASTER_PLAN.md) before implementation. Reuse only verified, licensed modules; add or update tests; preserve security and verification gates; and describe actual validation in the change summary.

