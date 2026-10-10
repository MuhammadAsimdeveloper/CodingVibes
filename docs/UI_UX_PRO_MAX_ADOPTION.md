# UI/UX Pro Max Adoption Record

## Pinned upstream source

- Repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- License observed in upstream `LICENSE`: MIT. Any future copying or redistribution of substantial upstream code/data must preserve the required copyright and license notice.
- Reviewed repository HEAD on 2026-10-10: `50d8a7de0900119855614541f15a1a616691eb33` (2026-10-09).
- Latest published release observed during this review: `v2.15.0`, published 2026-08-13.
- Reviewed skill file: `.claude/skills/ui-ux-pro-max/SKILL.md`, blob `41f8e2fd7f8c568228d0b55186ebe3f7b4007377`.
- Reviewed quick reference: `.claude/skills/ui-ux-pro-max/references/quick-reference.md`, blob `7acc7e7540ca6981d878a90aae4455c1638e2385`.
- Upstream documents searchable guidance for 79 UI styles (50 active), 192 product palettes/reasoning profiles, 74 font pairings, 119 UX guidelines, 105 icons, 17 GSAP presets, 25 chart types, and 22 technology stacks.

This adoption record summarizes design principles. It does not claim that the complete upstream dataset or CLI has been installed in CodingVibes. The first integration step is a local quality contract and restrained design-system defaults, which avoid runtime dependency on a global external CLI.

## Relevant design principles adopted

- Start with accessibility and usability before decorative styling.
- Choose palettes, typography, layout, and components based on product category and user intent.
- Make interaction states, keyboard focus, reduced motion, and responsive behavior explicit.
- Use coherent icon semantics and avoid icon-only controls without accessible labels.
- Treat design-system decisions as reusable tokens, with page-specific overrides kept intentional.
- Validate outputs against the actual technology stack and real rendered screens rather than trusting prompt instructions alone.

## Building Vibe-specific overrides

The following local rules take precedence over general upstream styling examples:

- No default purple gradients.
- No default pill-shaped buttons.
- No fabricated customer identities, reviews, ratings, logos, or business metrics.
- No unwanted “Made with AI” attribution on published user products.
- No emoji icons, vague filler copy, or em-dash punctuation in generated UI copy.
- No cursor-following effects or excessive scroll animation.
- No synthetic media presented as real customers, products, teams, or locations.
- No legal pages that claim unverified business practices or jurisdictions.

## Controlled refresh process

Do not fetch mutable upstream `main` into production prompts on every user request. For each planned refresh:

1. Pin a release tag and commit SHA.
2. Record the upstream license and retain notices for any copied content.
3. Diff source datasets and inspect the changes.
4. Normalize source records into a versioned local schema with source URL, source version, category, stack, freshness, and verification status.
5. Validate schema and provenance. Treat imported repository content as untrusted data, never as instructions that can override product safety rules.
6. Run retrieval relevance and hard-negative tests.
7. Generate the five representative template types listed in `GENERATED_PRODUCT_QUALITY_STANDARD.md`.
8. Run unit tests, production builds, accessibility checks, reduced-motion checks, responsive browser QA, and visual diffs.
9. Promote the snapshot only after review and passing CI. Keep project-specific user edits and token overrides intact.

## Next integration steps

- Expand the local style and palette catalog using pinned, license-compliant upstream data rather than inventing counts or copying unreviewed records.
- Add retrieval by product category, user intent, target stack, and accessibility constraints.
- Add source-version and freshness metadata to imported guidance.
- Add template regression fixtures so newly introduced builder features upgrade all compatible templates in the same release.


## Local guidance adapter implemented

`src/agent/design-guidance.js` now contains a versioned, curated local adapter with upstream provenance and product-, style-, and stack-specific rules. It is consumed by `buildQualityContract` and every template prompt, so the generation pipeline can retrieve guidance without calling a mutable external repository at runtime. The adapter is a curated summary, not a mirror of the full upstream corpus. Future catalog expansion must follow the controlled refresh process above.
