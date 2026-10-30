# Search, measurement, and sustainable growth

## Search Console setup (owner action)

1. Sign in to [Google Search Console](https://search.google.com/search-console).
2. Add a **URL-prefix** property for `https://heictools.github.io/`. You do not
   control the github.io parent domain's DNS, so use HTML verification rather
   than a DNS-verified Domain property for this default hosting URL.
3. Choose HTML tag verification. Copy only the token from `content="..."` into
   `searchConsoleVerification` in site.config.mjs. Build and deploy, inspect the
   public homepage source, then select Verify in Search Console.
4. Alternatively, download the exact Google verification HTML file and place it
   in `public/`; deploy it unmodified. Keep whichever verification method you use
   in subsequent deployments. [Google ownership verification](https://support.google.com/webmasters/answer/9008080).
5. In **Sitemaps**, submit `https://heictools.github.io/sitemap.xml` and check that
   it can be fetched. Resolve parsing errors if reported.
   [Sitemaps report documentation](https://support.google.com/webmasters/answer/7451001).
6. Inspect the homepage URL and important landing pages. Test the live URL, check
   the detected canonical and crawlability, and request indexing when appropriate.
   Review the Page indexing report to distinguish discovered, crawled, indexed,
   duplicate, and excluded URLs. Indexing may take time and is not guaranteed.

No Google credentials or verification tokens were invented. Registration and
submission require the owner's Google account and are not automatic deployment steps.

## What the site implements

Static, meaningful initial HTML; unique titles/descriptions; one H1 per page;
logical headings and internal links; canonicals; sitemap; robots; Open Graph;
self-hosted assets and system fonts; a lazy decoder and ZIP library. No runtime
analytics, third-party font requests, or conversion-data collection.

The converter uses truthful WebApplication JSON-LD. Google supports this subtype,
but its software rich result requires a genuine review or rating. This project
has neither and must not fabricate one. A Rich Results Test warning about missing
ratings is not permission to add invented data. See
[Google's software-app requirements](https://developers.google.com/search/docs/appearance/structured-data/software-app).
FAQ content is for users, without a FAQ-rich-result claim.

The pages answer distinct tasks: conversion, managing a batch, choosing JPEG
settings, comparing formats, native Mac conversion, and iPhone capture/sharing.
Do not add near-duplicate pages targeting spelling variations alone.

## Performance and accessibility

Use PageSpeed Insights/Lighthouse on the live homepage on mobile and desktop.
Monitor field Core Web Vitals in Search Console once sufficient traffic exists.
Lab tests alone do not establish field performance. Review LCP, INP, and CLS:
keep the initial HTML/styles small, avoid layout shifts, and keep decoding in workers.
Test keyboard navigation, visible focus, screen-reader labels, and narrow layouts.
Large-image processing depends on hardware and is separate from initial page load.

## Monthly measurement loop

In Performance → Search results, compare a consistent period (for example, the
last 28 days against the previous 28). Review queries and pages by impressions,
clicks, CTR, and average position. Filter by country/device when meaningful.
Find high-impression, low-CTR pages: inspect the actual query intent and current
search result, improve the title/description and opening answer honestly, and
compare later periods. Consider seasonality, position changes, and small samples.
Do not treat a title change as proof of causation or promise a ranking increase.

Start with Search Console aggregate search measurement. If site analytics are
later needed, evaluate a privacy-conscious configuration, disclose collection and
retention, avoid recording filenames/image data, and obtain consent where required.
Do not add an analytics service just to claim privacy-friendly tracking.

## Discovery plan

1. Keep the working converter, release tests, clear README, and live repository
   link current. Fix real conversion failures before expanding the feature list.
2. Explain the meaningful benefits: local processing, a controllable batch queue,
   ZIP downloads, no signup, and straightforward quality/memory guidance.
3. Manually submit to relevant directories that accept genuinely free utilities.
   Share an accurate link where people request conversion help and community rules
   permit it. Answer the question first; do not automate community posts.
4. Improve the existing practical tutorials based on real support questions.
   Earn links by making the tool and documentation useful. No paid links,
   fabricated testimonials, keyword-stuffed pages, or mass directory submissions.
5. After sufficient reliable use, evaluate PNG/WebP output, resizing/compression,
   or an embeddable widget based on query evidence and feedback. Do not multiply
   tools or dependencies before the core converter's device testing is strong.

Search indexing does not guarantee traffic. A new site may have no field metrics
or impressions initially. No directory/community submissions are performed by
this project automatically.
