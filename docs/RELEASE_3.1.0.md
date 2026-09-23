# Coding Vibes v3.1.0 — Workspace UX

## What changed

v3.1 makes the existing verified build engine easier to operate as an AI software workspace.

### Intent-first prompting
The composer now exposes four explicit intents:

- **Build** — create from a product description.
- **Modify** — change the existing project while preserving working behavior.
- **Debug** — investigate and repair the current project, then verify.
- **Review** — inspect quality/security/UX and make only verified improvements.

Intent prefixes are added before the request reaches the existing agent pipeline, so the existing planning, context selection, controlled file operations, verification, repair, review and commit gates remain in force.

### Command palette
`Ctrl/Cmd+K` opens a searchable command palette for common actions:

- switch AI intent
- re-verify current files
- save the current file
- commit the verified changeset

### Faster workspace editing

- one-click prompt starters for common tasks
- `Ctrl/Cmd+Enter` submits the build request
- editor header shows the selected file and unsaved marker
- file selection is tracked with `aria-current`
- responsive workspace controls for smaller screens

## Validation

The release adds static browser-workspace tests and keeps the existing server/agent test suite unchanged.
