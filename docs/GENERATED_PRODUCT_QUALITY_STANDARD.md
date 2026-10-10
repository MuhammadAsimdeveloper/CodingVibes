# Generated Product Quality Standard

This standard applies to every website, app, 3D product page, and animated experience generated or edited by Building Vibe. It is enforced by the existing `buildQualityContract` and `auditProductExperience` pipeline. It is a release gate, not optional styling advice.

## Required defaults

- Never generate purple gradients as a default. Choose a product-specific palette and semantic color roles.
- Never make pill-shaped buttons the default. Use compact, intentional control shapes with clear hierarchy and states.
- Never fabricate reviews, testimonials, customer identities, company logos, ratings, customer counts, growth claims, or performance metrics. Customer proof is allowed only when the user supplies verifiable evidence. Otherwise omit it.
- Never include unwanted “Made with AI” attribution or Build Vibe builder branding in a published user product.
- Never use emoji as interface icons. Use a consistent icon set or accessible inline SVG.
- Avoid em dashes and generic marketing filler. Describe real capabilities and user benefits in specific language.
- Never ship cursor-following animations, pointer trails, or decorative cursor glow.
- Avoid excessive scroll-linked animation, looping decorative motion, magnetic buttons, and long staggered entrance choreography.
- Respect `prefers-reduced-motion`. Keep essential content visible and usable without animation.
- Use authentic user-provided, licensed, or clearly identified illustrative media. Never use random placeholder-photo endpoints or fake-avatar services, and never portray synthetic imagery as a real customer, team, product, place, or event. Static checks can flag known placeholder providers but cannot prove whether an arbitrary image was AI-generated.
- Do not invent legal claims or present boilerplate as a reviewed policy.

## Social proof evidence contract

A numeric claim or customer quote must be backed by user-supplied evidence. For the current static quality audit, exact approved claim strings may be supplied as `spec.verifiedSocialProof`. This is an explicit allowlist, not automatic fact verification. The release owner remains responsible for checking the source and permissions. Without evidence, omit the claim instead of inventing data.

## Motion contract

- Default transitions target approximately 120–360 ms, with reveal movement around 8–12 px.
- Default scroll motion is a small fade/reveal. Avoid scroll-controlled camera choreography unless a user specifically asks for a 3D interaction, and keep camera control user-initiated.
- Do not use pointer position to move or distort buttons.
- Do not use infinite decorative float, glow, rail, or spring animations as the default.
- Reduced-motion mode must make all essential content immediately visible and remove decorative movement.

## Quality gate behavior

The audit flags recognizable source patterns for unwanted AI attribution, purple gradients, unsupported social proof, emoji icons, em dashes, pill-button styles, cursor-following effects, excessive scroll motion, and vague marketing copy. These checks are heuristics. They cannot prove that a claim is true, a photograph is licensed, or a legal policy matches the actual deployment. Use provenance, browser QA, and human review as well.

## Template parity requirement

Every new feature or upstream design-system refresh must be applied consistently to representative outputs:

1. Simple informational website.
2. Professional business or SaaS site.
3. Animated site.
4. 3D product or property showcase.
5. Mobile or web application interface.

The change is not complete until those outputs preserve user edits, pass quality checks, and have regression coverage.


## Launch essentials enforced by the audit

Generated web products must link a real favicon asset, include a Privacy Policy describing default form storage, retention, cookies, third-party analytics and deletion requests, and include Terms covering acceptable use, user content, liability and applicable law. Placeholder legal copy is a release blocker. The generated text documents default starter behavior; owner-configured integrations and local legal requirements require review before publication.
