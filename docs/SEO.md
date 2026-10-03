# SEO implementation

Build Vibe treats SEO as part of the generated product contract rather than a keyword-stuffing layer.

## Public Build Vibe site

The marketing page includes a descriptive title and meta description, index/follow directives, canonical URL, Open Graph/Twitter metadata, favicon and web manifest references, and JSON-LD for the site and organization.

## Generated customer sites

Generated public pages include page-specific titles and descriptions, canonical URLs, Open Graph/Twitter previews, a social preview asset, favicon, JSON-LD WebSite/WebPage markup, and breadcrumbs-ready page structure.

Authenticated admin/login surfaces are noindex. Generated robots.txt and sitemap.xml are served with an absolute site origin at runtime using `CV_PUBLIC_URL` when set or the forwarded request host/protocol.

## Content quality

Template prompts and generated copy should describe the real product, audience, services, products, locations, authors, policies and workflows. Do not add hidden text or a meta-keywords list for ranking.

## Release checks

The final SEO test lives in `test/seo-template-final.test.js` and is part of the normal `npm test` suite.
