# SEO and AEO implementation

Build Vibe treats search discovery as a product-quality system, not a keyword list.

## Current technical layer

The public Build Vibe site has descriptive titles and meta descriptions, absolute-at-runtime canonical and social URLs, crawl controls, an XML sitemap, Open Graph/Twitter previews, WebSite/Organization/SoftwareApplication structured data, and crawlable internal links into dedicated intent pages.

The public content layer includes focused pages for AI website builder, AI app builder, mobile app builder, ecommerce website builder, SaaS app builder, 3D website builder, features, templates, pricing, how it works, and FAQ.

These pages are intentionally finite and useful. Build Vibe does not mass-generate location or keyword permutations.

## Generated customer sites

Generated public pages receive page-specific titles and descriptions, canonical URLs, Open Graph/Twitter metadata, image previews, WebSite/WebPage structured data, BreadcrumbList markup, visible internal navigation, and crawlable robots/sitemap endpoints.

Owner-edited content SEO fields for title, description, image and canonical URL are applied at render time with bounded length and HTML escaping.

Every generated site keeps /admin private with noindex. /login is also noindex when generated. API surfaces are excluded from robots and sitemaps.

## Content quality

The ranking system is deliberately people-first:

- Use unique, accurate product/service information.
- Keep important information in crawlable HTML, not only in scripts or interactions.
- Prefer useful category, service, product, case-study and documentation pages over keyword permutations.
- Keep titles and descriptions specific to the page.
- Keep exactly one primary H1 and a logical heading hierarchy.
- Use descriptive alt text for meaningful images; decorative assets should use empty alt text.
- Keep internal links understandable and connected to the information architecture.

There is no meta-keywords tag because modern search engines do not need it for ranking.

## Structured data

Build Vibe emits schema.org JSON-LD where it accurately describes the page: WebSite, WebPage, Organization, SoftwareApplication and BreadcrumbList. FAQ pages also expose visible question/answer content and FAQPage markup.

Structured data improves machine understanding and eligibility for supported search features; it is not a guarantee of a rich result or a higher ranking.

## Crawl and freshness

robots.txt exposes the canonical sitemap and blocks authenticated/API paths. sitemap.xml lists only public URLs and uses absolute URLs.

Published generated sites can optionally use IndexNow by setting CODINGVIBES_INDEXNOW_KEY. When the search engine requires the key file at a custom URL, set CODINGVIBES_INDEXNOW_KEY_LOCATION and make that public key file available on the deployed host. IndexNow is a freshness notification channel for participating search engines; it does not guarantee indexing or ranking.

## Measurement

For real search performance, connect the deployed domain to Google Search Console and Bing Webmaster Tools. Submit the XML sitemap, inspect indexed URLs, review crawl/indexing errors, monitor queries/clicks/impressions, and validate structured data with the relevant search-engine tooling.

## AEO / AI-search readiness

The platform exposes a discoverability audit and AEO summary. It checks metadata, canonicals, robots, sitemap coverage, JSON-LD, H1 structure, internal linking, image alt text, semantic HTML and duplicate page metadata.

public/llms.txt is provided only as supplemental machine-readable orientation. It is not treated as a special Google ranking signal or a replacement for normal SEO.

## Verification

The SEO and discoverability contracts run in npm test, and npm run launch:check probes every public Build Vibe SEO route plus robots/sitemap responses.

SEO implementation never claims a ranking guarantee. Search visibility also depends on actual content quality, relevance, authority, crawlability, external references, page experience and search-engine evaluation.
