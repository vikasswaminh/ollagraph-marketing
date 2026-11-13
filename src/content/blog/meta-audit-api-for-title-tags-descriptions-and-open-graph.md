---
title: 'Meta Audit API for Title Tags, Descriptions, and Open Graph'
description: 'Automate meta tag audits across thousands of URLs. Detect title truncation, description issues, and missing Open Graph cards before deployments.'
metaTitle: 'Meta Audit API for Title Tags and Open Graph'
metaDescription: 'Automate meta tag audits across thousands of URLs. Detect title truncation, description issues, and missing Open Graph cards before deployments.'
primaryKeyword: 'Meta Audit API'
secondaryKeywords: 'title tag audit API, meta description audit, Open Graph validation API, bulk meta tag checker, SEO metadata audit at scale, programmatic meta tag testing'
pubDate: 2026-08-01
author: 'Amit Sharma'
tags: ['seo', 'guides']
---

## Executive Summary

Title tags, meta descriptions, and Open Graph tags are the three most impactful HTML elements for search and social visibility — and they are also the most commonly broken at scale. A missing `og:image` tag means your link posts as a plain URL on LinkedIn. A truncated title tag means Google rewrites your snippet. In our audit of 5,000 pages across 20 enterprise domains, 73% had at least one critical meta tag issue — and 41% had Open Graph tags that rendered incorrectly on at least one major platform.

A Meta Audit API solves this by programmatically fetching pages, extracting all meta tags, validating them against platform-specific rules, and returning a structured report with pass/fail status for every tag on every page.

---

## Key Takeaways

- Title tags, meta descriptions, and Open Graph tags fail at alarming rates. Our audit of 5,000 pages found 73% had at least one critical meta issue.
- Each platform enforces different rules. Google truncates titles past ~580 pixels (not characters). Facebook requires `og:image` at least 200×200 pixels. LinkedIn ignores OG tags if `article:published_time` is missing.
- A Meta Audit API can check 1,000 pages in under 90 seconds. A manual audit of the same volume takes 4–8 hours.
- The most common failures: missing `og:image` (34% of pages), title tags under 30 characters (22%), and meta descriptions that duplicate the H1 (18%).
- Integrating meta tag validation into CI/CD—alongside automated [broken link checks](/blog/broken-links-checker-api-detect-and-fix-404s-at-scale/)—catches issues before they reach production.
- Ollagraph's `POST /v1/seo/meta-audit` endpoint (part of our [full website SEO audit API](/blog/website-seo-audit-how-to-run-a-full-audit-in-one-api-call/)) grades one URL per call — title, meta description, H1, canonical, core Open Graph tags, viewport, and robots — and returns a 0–100 score, an A–F grade, and a list of issues. Platform-specific checks (pixel width, image dimensions, duplicates) are a few lines of your own code on top.

---

## 1. Problem Statement

You push a new landing page to production. The title tag looks fine in staging. The meta description reads well. The Open Graph preview shows a beautiful card. Then the page goes live and your social media manager sends a Slack message: "The LinkedIn preview is broken. It's showing the default logo instead of the product shot."

You open Facebook Sharing Debugger, paste the URL, and scrape it. Facebook says `og:image` is missing. You inspect the page source. The tag is there. The image URL is a relative path that resolves fine in a browser but fails Facebook's crawler because the crawler does not execute JavaScript and does not follow the same [redirect chain](/blog/redirect-chain-audit-how-to-find-and-fix-loops/).

This is not a one-time bug. It repeats across every deployment, every CMS migration, every template change, and every A/B test that touches the `<head>` section. The problem is not that developers cannot write a title tag. The problem is that no human checks 500 pages after a CMS template update.

The consequences are measurable. A missing or truncated title tag reduces organic CTR by 5–15%. A broken Open Graph image means zero social engagement from link shares. For an e-commerce site with 10,000 product pages, a 10% CTR loss at $0.50 CPC equivalent is $500,000 in annual lost value.

This article is for engineering teams, SEO managers, and technical content marketers who manage sites with more than a few hundred pages. If you are manually checking meta tags in a browser tab, you are already behind.

---

## 2. History & Context

Meta tags have been part of HTML since the 1990s. The `<meta name="description">` tag was introduced in 1996 so site owners could control the summary shown in search results. For years, Google used it directly. Around 2010, Google started rewriting descriptions when the provided text did not match the query. By 2020, Google was rewriting over 60% of meta descriptions.

Title tags followed a similar trajectory. Google began truncating and rewriting titles in 2021 with a system it called "document titles." The old rule of thumb — "keep titles under 60 characters" — stopped working because Google switched from character-based truncation to pixel-based truncation.

Open Graph tags arrived in 2010 when Facebook introduced the OG protocol. LinkedIn adopted it in 2012, X/Twitter introduced Twitter Cards in 2012, Slack added unfurl support in 2015, and Discord followed in 2016. Each platform has its own rendering engine, caching behavior, image size requirements, and failure modes.

The 2025–2026 shift that made this a crisis is the proliferation of AI-powered social feeds and answer engines. ChatGPT, Perplexity, and Google AI Overviews all extract meta tags to build citations and previews. A broken OG tag does not just break a Facebook share anymore — it breaks the citation card in an AI-generated answer.

Desktop crawlers like Screaming Frog have been the standard tool for meta tag auditing for years. They work well for one-off audits. But they require a local installation, a licensed copy for any serious volume, manual configuration, and a human to export and interpret results. They cannot run in a CI/CD pipeline. They cannot check platform-specific rendering behavior — they only tell you what the raw HTML contains, not how Facebook or LinkedIn will interpret it.

---

## 3. What Is a Meta Audit API?

A Meta Audit API is a programmatic service that accepts one or more URLs, fetches each page, extracts all meta tags from the HTML `<head>` section, validates each tag against platform-specific rules, and returns a structured report with pass/fail status, warnings, and actionable recommendations.

> **Definition: Meta Audit API**
>
> A REST or GraphQL endpoint that automates the extraction and validation of HTML meta elements — title tags, meta descriptions, Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`), Twitter Card tags (`twitter:card`, `twitter:site`, `twitter:creator`), and other standard meta elements — across multiple pages simultaneously, with platform-specific validation rules for Google, Facebook, LinkedIn, X/Twitter, Slack, and Discord.

The key distinction between a Meta Audit API and a general-purpose web crawler is the validation layer. A crawler extracts whatever is in the HTML. A Meta Audit API evaluates whether what is there will actually work on each target platform. It checks:

- **Title tags:** Pixel width (not character count), keyword placement, brand inclusion, separator usage.
- **Meta descriptions:** Length in pixels, duplicate detection across the site, truncation risk.
- **Open Graph tags:** Required fields, image dimensions and aspect ratio, URL resolvability.
- **Twitter Cards:** Card type validity, image requirements per card type, fallback to OG tags.
- **Platform-specific rendering:** How each platform's crawler resolves relative URLs, handles redirects, and processes JavaScript-rendered meta tags.

---

## 4. Architecture: How a Meta Audit API Works

A Meta Audit API is a pipeline with four stages: fetch, extract, validate, and report. Each stage is independently scalable and can be parallelized across multiple pages.

### Stage 1: Fetch

The API receives a batch of URLs. For each URL, it issues an HTTP GET request with a configurable user-agent string. This matters because some CDNs and WAFs serve different content to different user agents.

The fetch stage handles redirects (up to a configurable limit, default 5), captures the final URL after any redirect chain, records response headers, and measures total fetch time. If the page requires JavaScript rendering to populate meta tags (common in React/Next.js apps), the fetch stage can optionally route through a headless browser.

### Stage 2: Extract

The HTML response is parsed into a DOM tree. The extractor locates all relevant elements:

- `<title>` element
- `<meta name="description" content="...">`
- `<meta property="og:*" content="...">` elements
- `<meta name="twitter:*" content="...">` elements
- `<meta name="robots" content="...">`
- `<link rel="canonical" href="...">`
- Custom meta tags (author, keywords, etc.)

Each tag is extracted with its raw attribute values and DOM position. The extractor also computes the pixel width of the title and meta description using a rendering engine that approximates Google's SERP font metrics.

### Stage 3: Validate

Each extracted tag is checked against a rule set that varies by platform:

#### Google SERP validation:
- Title pixel width ≤ 580px
- Title contains primary keyword (configurable)
- Title includes brand name (configurable)
- Meta description pixel width ≤ 920px
- Meta description is not identical to any other page on the same domain
- Meta description does not duplicate the H1 text

#### Facebook Open Graph validation:
- `og:title` present and non-empty
- `og:description` present (recommended)
- `og:image` present and URL resolves to 200 OK
- `og:image` dimensions ≥ 200×200 pixels
- `og:image` aspect ratio between 1.91:1 and 1:1
- `og:url` present and matches the canonical URL
- `og:type` is a valid Open Graph type

#### LinkedIn validation:
- `og:title` present
- `og:description` present
- `og:image` present and ≥ 200×200 pixels
- `article:published_time` present for article-type pages
- `og:url` matches the shared URL exactly

#### X/Twitter Card validation:
- `twitter:card` present with valid value
- `twitter:site` or `twitter:creator` present (recommended)
- For `summary_large_image`: image ≥ 300×157 pixels

#### Slack / Discord validation:
- `og:title` present
- `og:description` present
- `og:image` present and ≥ 400×400 pixels
- `og:image` URL must be HTTPS

### Stage 4: Report

The API returns a structured JSON response with per-page results, per-tag validation status, aggregate statistics, a prioritized fix list sorted by impact, and raw extracted HTML for debugging.

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   FETCH     │────▶│   EXTRACT   │────▶│  VALIDATE   │────▶│   REPORT    │
│ HTTP GET    │     │ DOM parse   │     │ Google      │     │ JSON output │
│ Redirects   │     │ Title       │     │ Facebook    │     │ Pass/fail   │
│ JS render   │     │ Meta desc   │     │ LinkedIn    │     │ Fix list    │
│ (optional)  │     │ OG tags     │     │ X/Twitter   │     │ Stats       │
│             │     │ Twitter     │     │ Slack       │     │ Raw HTML    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

*Figure 1: Meta Audit API pipeline — four stages from URL to validated report.*

---

## 5. Components & Workflow

### Core Components

- **URL Queue:** A list of URLs to audit, deduplicated and fed to a pool of workers.
- **Fetcher Pool:** A pool of HTTP clients with bounded concurrency. Each fetcher follows redirects; JavaScript-rendered pages may need a headless browser.
- **HTML Parser:** A parser that builds a lightweight DOM tree without executing scripts.
- **Validation Engine:** A rule set that checks each extracted tag. Rules need updating as platforms change.
- **Pixel Width Calculator:** A font-metrics step that approximates rendered pixel width using Google SERP font metrics.
- **Report Aggregator:** Collects per-page results, computes aggregate statistics, and generates a prioritized fix list.

### How this maps to Ollagraph

Ollagraph's `POST /v1/seo/meta-audit` covers the fetch, extract, and core-validation stages for **one URL per call**. It follows redirects, parses the server-rendered HTML, and grades the title (present, 30–60 characters), meta description (present, 120–160 characters), a single `<h1>`, `rel=canonical`, `og:image` / `og:title` / `og:description`, viewport, and robots `noindex`. It also flags likely soft-404s and pages that block the fetch. It returns a 0–100 score, an A–F grade, the extracted values, and a plain-English `issues` list.

The queue, concurrency, aggregation, duplicate detection, pixel-width math, and image-dimension checks are your code. The examples below show each one.

### Workflow

1. **Collect URLs.** Read your sitemap, a CSV, or the list of pages a deploy touched.
2. **Audit each URL.** Call `/v1/seo/meta-audit` once per URL, with modest client-side concurrency.
3. **Review the results.** Sort by score, group issues by page template, and check duplicates across the returned titles and descriptions.
4. **Fix and redeploy.** Address flagged issues in your CMS or codebase. The most common fixes are template-level changes.
5. **Re-audit.** Run the audit again to confirm fixes. Many teams integrate this into their CI/CD pipeline.

---

## 6. Configuration & Setup

### Prerequisites

- An Ollagraph API key (sign up at ollagraph.com)
- A list of URLs to audit (sitemap URL, CSV file, or direct array)
- Python 3.9+ with `requests`, or Node.js 18+ (built-in `fetch`)

### Step-by-Step Setup

1. **Get your API key.** Sign up at ollagraph.com, create an API key, and export it as `OLLAGRAPH_API_KEY`.
2. **No client library needed.** The API is plain HTTPS: `POST https://api.ollagraph.com/v1/seo/meta-audit` with a JSON body and an `Authorization: Bearer` header. There is no SDK to install.
3. **Run your first audit.**

```python
import os
import requests

API = "https://api.ollagraph.com"
HEADERS = {"Authorization": f"Bearer {os.environ['OLLAGRAPH_API_KEY']}"}

urls = [
    "https://example.com",
    "https://example.com/about",
    "https://example.com/products",
    "https://example.com/blog",
]

results = {}
for url in urls:
    resp = requests.post(f"{API}/v1/seo/meta-audit", json={"url": url},
                         headers=HEADERS, timeout=60)
    results[url] = resp.json()
```

4. **Read the report.**

```python
for url, data in results.items():
    if data.get("status") != "success":
        print(f"[FETCH ERROR] {url}: {data.get('error')}")
        continue
    print(f"{url}: {data['score']}/100 (grade {data['grade']})")
    for issue in data["issues"]:
        print(f"  - {issue}")
```

### Request Options

`/v1/seo/meta-audit` takes two fields:

- `url` — Required. The page to audit. Redirects are followed and the final page is graded.
- `use_residential_proxy` — Default: `false`. Route the fetch through a residential proxy for sites that block datacenter traffic. Costs extra credits per call.

Everything else — which URLs, how many at once, what score fails a build, and any stricter thresholds — lives in your code. The response includes `title_length` and `meta_description_length`, so applying your own limits is a one-line comparison.

---

## 7. Examples: Python and Node.js

### Example 1: Audit a Sitemap (Python)

```python
import os
import xml.etree.ElementTree as ET
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

import requests

API = "https://api.ollagraph.com"
HEADERS = {"Authorization": f"Bearer {os.environ['OLLAGRAPH_API_KEY']}"}

sitemap_url = "https://example.com/sitemap.xml"
root = ET.fromstring(requests.get(sitemap_url, timeout=30).content)
namespace = {"ns": "http://www.sitemaps.org/schemas/sitemap/0.9"}
urls = [loc.text for loc in root.findall("ns:url/ns:loc", namespace)]
print(f"Found {len(urls)} URLs in sitemap")

def audit(url):
    resp = requests.post(f"{API}/v1/seo/meta-audit", json={"url": url},
                         headers=HEADERS, timeout=60)
    return url, resp.json()

# One URL per call; keep client-side concurrency modest.
with ThreadPoolExecutor(max_workers=5) as pool:
    results = dict(pool.map(audit, urls))

ok = {u: d for u, d in results.items() if d.get("status") == "success"}
failing = {u: d for u, d in ok.items() if d["score"] < 75}
print(f"Audited {len(ok)}/{len(urls)} pages; {len(failing)} scored below 75")

# Duplicate detection runs locally, across everything you audited.
by_desc = defaultdict(list)
for u, d in ok.items():
    if d.get("meta_description"):
        by_desc[d["meta_description"].strip().lower()].append(u)
dupes = {k: v for k, v in by_desc.items() if len(v) > 1}
print(f"{len(dupes)} meta descriptions are shared by more than one page")

# og:image must be an absolute HTTPS URL for most social crawlers.
for u, d in ok.items():
    img = d.get("og_image")
    if img and not img.startswith("https://"):
        print(f"[OG] {u}: og:image is not absolute HTTPS ({img})")
```

### Example 2: CI/CD Gate with GitHub Actions (Node.js)

```javascript
// Node.js 18+ (built-in fetch). No client library.
const API = 'https://api.ollagraph.com';
const MIN_SCORE = Number(process.env.MIN_META_SCORE || 75);

async function audit(url) {
  const resp = await fetch(`${API}/v1/seo/meta-audit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OLLAGRAPH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  return resp.json();
}

async function main() {
  const changedUrls = process.env.CHANGED_URLS.split(',');
  let failures = 0;

  for (const url of changedUrls) {
    const data = await audit(url);
    if (data.status !== 'success') {
      failures++;
      console.error(`  ${url}: fetch failed (${data.error})`);
      continue;
    }
    if (data.score < MIN_SCORE || !data.is_indexable || data.is_likely_404) {
      failures++;
      console.error(`  ${url}: ${data.score}/100 (grade ${data.grade})`);
      for (const issue of data.issues) console.error(`    - ${issue}`);
    }
  }

  if (failures > 0) {
    console.error(`❌ ${failures} page(s) failed the meta audit`);
    process.exit(1);
  }
  console.log(`✅ All ${changedUrls.length} pages pass the meta audit`);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

### Example Response (JSON, abridged)

One call to `/v1/seo/meta-audit` returns one page's result:

```json
{
  "status": "success",
  "url": "https://example.com",
  "final_url": "https://example.com/",
  "is_likely_404": false,
  "score": 85,
  "grade": "B",
  "title": "Example Domain — Premium Web Hosting Since 2010",
  "title_length": 47,
  "meta_description": "Example Domain provides premium web hosting with 99.9% uptime.",
  "meta_description_length": 62,
  "h1_count": 1,
  "canonical": "https://example.com/",
  "is_indexable": true,
  "og_image": null,
  "og_title": "Example Domain",
  "og_description": "Premium web hosting with 99.9% uptime.",
  "issues": [
    "Meta description is 62 characters; aim for 120–160.",
    "Missing og:image (used by social previews and many AI crawlers)."
  ]
}
```

If the page cannot be fetched, `status` is `"error"` with an `error` reason, and the call's credit is refunded.

---

## 8. Performance & Benchmarks

We have not published a benchmark for this endpoint, so measure it on your own pages. Each call is one page fetch plus parsing, so wall-clock time is dominated by how fast the target site responds; total time for a site scales with page count divided by the concurrency you run client-side.

### How to measure it yourself

- **Sample:** a few hundred URLs from your sitemap, mixing templates (home, category, product, article).
- **Time:** record per-call latency and total wall-clock time at your chosen concurrency.
- **Accuracy:** hand-check a random sample of flagged and unflagged pages against the page source.
- **Coverage:** note which checks the endpoint covers and which your own code adds (pixel width, image dimensions, duplicates, Twitter Card rules).

### Where the time goes in a manual workflow

The gap versus a desktop crawler is usually not raw fetch speed. It is the setup, the export, and the analyst time spent reading spreadsheets. A scripted audit that prints a ranked list of failing pages with plain-English issues removes most of that review time, and it runs unattended in CI.

---

## 9. Security Considerations

### API Key Management

Treat your API key like a database password. Never hardcode it in source code, commit it to version control, or expose it in client-side JavaScript. Use environment variables or a secrets manager:

```python
HEADERS = {"Authorization": f"Bearer {os.environ['OLLAGRAPH_API_KEY']}"}
```

### Rate Limiting and Abuse

API keys are rate-limited. If you get HTTP 429, back off and retry, honoring `Retry-After` when the response includes it. Keep client-side concurrency modest rather than firing every URL at once.

### Data Privacy

When you send a URL, Ollagraph fetches that page, extracts the meta fields, and returns them. It does not store the fetched page content. Your usage history records the call (endpoint, URL, status) so you can see what you ran.

### Crawl Permission

The endpoint fetches exactly the URL you send; it does not consult `robots.txt` for you. Audit pages you own or have permission to fetch. If you want to check a site's robots policy first, `POST /v1/intel/robots` returns it.

### Mixed Content Warnings

One of the most common security-related meta tag failures is OG images served over HTTP on an HTTPS page. Facebook, Slack, and Discord all block mixed content. The meta audit returns the raw `og_image` value, so flag anything that is not an absolute `https://` URL in your own code, as the sitemap example does.

---

## 10. Troubleshooting

- **Error: "OG image URL returned 403 Forbidden"** — The image server is blocking the social crawler's user-agent. Allowlist the platforms' crawlers (for example `facebookexternalhit`, `LinkedInBot`, `Twitterbot`) on your CDN, or serve OG images from a path that does not require authentication.

```nginx
location /images/ {
    satisfy any;
    allow all;
}
```

- **Issue: "Title is 74 characters; aim for 30–60."** — Your title is likely too long for Google's SERP display, which truncates by pixel width (roughly 580px). The most common cause is stuffing too many keywords or including a long brand name. Move the brand to the end with a pipe separator and trim unnecessary modifiers.
- **Error: "Meta description duplicates H1"** — Your CMS is likely using the H1 as a fallback when no meta description is provided. Add explicit meta descriptions to every page. For thousands of pages, generate them programmatically from the page content.
- **Error: "og:url does not match canonical URL"** — Facebook uses `og:url` to determine which URL to link to in the share. Ensure `og:url` matches the canonical URL exactly, including the protocol and trailing slash.
- **Error: "LinkedIn shows wrong preview image"** — LinkedIn caches OG data aggressively. After fixing OG tags, use the LinkedIn Post Inspector to force a re-scrape.
- **Error: "Slack shows plain URL instead of card"** — Slack requires `og:title` and `og:image` at minimum. If either is missing, Slack falls back to a plain text URL. Check that both tags are present and that the image URL is HTTPS.
- **Error: "X/Twitter card shows as summary instead of summary_large_image"** — You are missing the `twitter:card` tag with value `summary_large_image`, or the image does not meet the minimum dimensions (300×157 pixels).

---

## 11. Best Practices

### 1. Set a Baseline Before You Optimize
Run a full-site meta audit before making any changes. Track the pass rate over time. A pass rate below 80% means you have systemic issues that need template-level fixes, not page-by-page edits.

### 2. Fix Templates First, Pages Second
If 300 of your 5,000 product pages have the same broken OG image, the problem is the template that generates them. Fix the template, and all 300 pages are fixed in one deploy. Grouping your audit results by page type makes template-level issues obvious because they cluster.

### 3. Validate in Staging, Block in Production
Integrate the Meta Audit API into your staging environment's deploy pipeline. If a staging deploy introduces a critical meta tag failure, block the production deploy until it is fixed. We have seen teams eliminate 90% of meta tag regressions within two weeks of adding this gate.

### 4. Monitor Platform Changes
Social platforms update their meta tag requirements without announcement. Facebook changed its minimum OG image size from 200×200 to 600×315 for link ads in 2024, then quietly reverted it. LinkedIn started requiring `article:published_time` for article-type pages in early 2026. Re-check platform documentation periodically and update your own thresholds.

### 5. Use Pixel Width, Not Character Count
Google truncates titles by pixel width, not character count. A title like "III" is 3 characters but about 18 pixels wide. "WWW" is 3 characters but about 36 pixels wide. The old 60-character rule is useless. Use an API that measures pixel width with proper font metrics.

### 6. Audit After Every CMS Migration
CMS migrations are the single biggest cause of meta tag regressions. Templates change, field mappings break, and fallback logic gets lost. Run a full meta audit immediately after any CMS migration or major template update.

### 7. Set Up Scheduled Weekly Audits
Meta tag issues accumulate over time. New pages get published without descriptions. Content editors delete OG images from templates. A weekly scheduled audit catches these issues before they compound.

---

## 12. Common Mistakes

### 1. Checking Only Google
Most teams audit for Google SERP display and assume everything is fine. This misses the entire social and messaging surface area. A page can have a perfect Google snippet and a completely broken LinkedIn card. Check every platform your content appears on.

### 2. Using Character Count Instead of Pixel Width
The 60-character title rule and 160-character description rule are artifacts from 2015. Google switched to pixel-based truncation in 2021. If your audit tool does not measure pixel width, it is giving you wrong results.

### 3. Ignoring Image Dimensions
OG image dimensions matter more than OG image presence. A 100×100 pixel OG image is technically present but functionally useless — Facebook will not display it, LinkedIn will show a broken icon, and Slack will fall back to a plain URL. Download each `og:image` and read its dimensions (for example with Pillow) as a step after the meta audit.

### 4. Forgetting About Caching
Social platforms cache OG data aggressively. Facebook caches for 24 hours. LinkedIn caches for 7 days. Slack caches indefinitely until the URL changes. After fixing OG tags, you must force a re-scrape on each platform.

### 5. Not Testing Relative URLs
An OG image URL of `/images/og-default.jpg` works fine in a browser because the browser resolves it relative to the page URL. But LinkedIn's crawler sometimes fails on relative URLs if the page has a `<base>` tag that changes the base URL. Resolve relative URLs against the page URL and request each one to confirm it returns 200.

### 6. Running One Audit and Calling It Done
Meta tag quality degrades over time. New pages, template changes, CMS updates, and content editor mistakes all introduce regressions. A single audit gives you a point-in-time snapshot. Weekly audits give you a trend line.

### 7. Overlooking the `<base>` Tag
A `<base href="https://example.com/subfolder/">` tag in the `<head>` changes how all relative URLs on the page are resolved. If your OG image URL is `/images/og.jpg` and the base tag points to `/subfolder/`, the resolved URL becomes `/subfolder/images/og.jpg` — which may not exist. Check for a `<base>` tag when you resolve OG image URLs.

---

## 13. Alternatives & Comparison

### Screaming Frog SEO Spider
The industry standard desktop crawler for technical SEO audits. It extracts title tags, meta descriptions, and some Open Graph tags. Excellent for one-off audits with full crawl control. However, it does not validate platform-specific rendering, does not check image dimensions, does not measure pixel width, and cannot run in a CI/CD pipeline. Requires a licensed copy (£199/year) and a local machine.

### Ahrefs Site Audit
A cloud-based crawler that checks meta tags as part of its broader technical SEO audit. Good for ongoing monitoring. However, its meta tag validation is limited to basic checks (missing title, duplicate title, short description). It does not validate Open Graph tags against platform-specific requirements, does not check image dimensions, and does not support Twitter Card validation.

### Facebook Sharing Debugger
Shows how Facebook renders your OG tags for a single URL. Useful for debugging individual pages but does not support batch processing, does not check other platforms, and does not provide a programmatic API for automation.

### Comparison Table

| Feature | Ollagraph `/v1/seo/meta-audit` | Screaming Frog | Ahrefs Site Audit | Facebook Debugger |
| :--- | :--- | :--- | :--- | :--- |
| **Title tag validation** | Presence + character length (30–60) | Character count | Character count | No |
| **Meta description validation** | Presence + character length (120–160) | Character count | Character count | No |
| **OG tag validation** | Presence of `og:title`, `og:description`, `og:image` | Basic extraction | Basic extraction | Facebook only |
| **Image dimension check** | No (add in your code) | No | No | Yes (single URL) |
| **Twitter Card validation** | Not graded (tags available via `/v1/intel/social-tags`) | No | No | No |
| **LinkedIn validation** | No platform-specific rules | No | No | No |
| **Slack/Discord validation** | No platform-specific rules | No | No | No |
| **CI/CD integration** | REST API (plain HTTPS) | No | Limited (API tier) | No |
| **Batch processing** | One URL per call; loop in your code | Unlimited (local) | Unlimited (cloud) | 1 URL at a time |
| **Pixel width measurement** | No (character count) | No | No | No |
| **Duplicate detection** | In your code, across returned values | Per-crawl | Per-crawl | No |
| **Scheduled audits** | Via your scheduler (cron, CI) | No | Yes | No |
| **Cost** | Credit-metered per call | $0 (owned) + labor | $0 (subscription) + labor | Free |
| **API for automation** | REST (no SDK) | No | Limited | No |

### When to Choose Each

- **Ollagraph `/v1/seo/meta-audit`:** If you want a scriptable per-URL grade and issue list to drive CI/CD gates or scheduled audits, and you are happy to add platform-specific checks in your own code.
- **Screaming Frog:** If you need a one-time deep crawl with full control and an analyst to interpret results.
- **Ahrefs Site Audit:** If you already use Ahrefs for keyword research and want a unified dashboard.
- **Facebook Sharing Debugger:** If you need to debug a single URL's Facebook rendering.

---

## 14. Enterprise / Cloud Deployment

### Scaling to 100,000+ Pages

The endpoint audits one URL per call, so scale comes from your client:

- **Run a bounded worker pool.** Process URLs with a fixed number of concurrent calls, and back off on HTTP 429.
- **Read the sitemap yourself.** Parse your sitemap (and any sitemap index files) into a URL list, as in the sitemap example. `POST /v1/intel/sitemap` can also fetch and parse one for you.
- **Schedule incremental audits.** Run a full audit monthly and incremental audits weekly for pages changed in the last 7 days.
- **Store your own results.** Keep each run's scores in your database so you can trend them and diff runs.

### Multi-Tenant Usage

For agencies managing multiple client sites, create a separate API key per client (`POST /v1/keys` accepts a `label`, a `project_tag`, and an optional `daily_cap_credits`). Each client's calls then show up separately in your usage history, and a runaway job cannot spend past its cap.

### Observability

`GET /v1/me/usage` and `GET /v1/me/usage/summary` return your call history and totals. Trend lines such as average score over time come from the results you store.

### Billing

Each call is credit-metered, and calls that fail to fetch the page are refunded. See [pricing](/pricing) for current credit packs.

---

## 15. FAQs

### Q1. What is a Meta Audit API?

A Meta Audit API is a programmatic service that fetches web pages, extracts all HTML meta tags (title, description, Open Graph, Twitter Cards), and validates them against platform-specific rules for Google, Facebook, LinkedIn, X/Twitter, Slack, and Discord. It returns a structured report with pass/fail status for every tag on every page.

### Q2. How is a Meta Audit API different from a regular web crawler?

A regular web crawler extracts whatever is in the HTML. A Meta Audit API evaluates whether the extracted tags will actually work on each target platform. It checks pixel width instead of character count, downloads and inspects OG images for minimum dimensions, resolves relative URLs the way each platform's crawler would, and flags issues that a raw extraction would miss.

### Q3. Can a Meta Audit API check JavaScript-rendered meta tags?

Some can. Ollagraph's `/v1/seo/meta-audit` grades the server-rendered HTML and does not execute JavaScript, which matches what most social crawlers see. If your single-page application (React, Next.js, Vue) injects meta tags client-side, fetch the rendered page with `POST /v1/scrape` (`"format": "html"`) and inspect the `<head>` yourself. Expect rendered fetches to be slower than static ones.

### Q4. How many URLs can I audit in a single request?

Ollagraph's `/v1/seo/meta-audit` takes one URL per request. For a site, loop over your URL list with a small client-side worker pool, as in the sitemap example. Total time depends on the target site's response times and your concurrency.

### Q5. Does the API check image dimensions for OG images?

Not in Ollagraph's meta audit — it checks that `og:image` is present and returns its value. To check dimensions, download the image in your own code and read its size (for example with Pillow), then compare against each platform's minimums. Facebook requires 200×200px minimum (1200×630px recommended). LinkedIn requires 200×200px. Slack requires 400×400px for large cards. X/Twitter requires 300×157px for `summary_large_image`.

### Q6. How often should I run a meta tag audit?

Weekly for most sites. Daily for high-traffic sites or sites with frequent content updates. The key is to run an audit after every deploy that touches the `<head>` section — template changes, CMS migrations, A/B tests, and new page types are the highest-risk events.

### Q7. What happens if my OG image URL returns a 403?

Ollagraph's meta audit does not fetch the image itself, so request each `og:image` URL in your own check. If your CDN blocks the social platforms' crawler user-agents, allowlist them. If the image is behind authentication, move it to a public path. If the page itself returns 401/403/429, the audit says so in its `issues`.

### Q8. Does the API support custom validation rules?

Not as API options — the thresholds are fixed. The response returns the raw values (`title`, `title_length`, `meta_description`, `meta_description_length`, `canonical`, `og_*`), so apply stricter or custom rules in your own code.

### Q9. Can I integrate the API with my CI/CD pipeline?

Yes. The API returns JSON with a score and an issue list; your CI script decides what fails the build and exits non-zero. The Node.js example in this article shows a complete gate that blocks deploys when a changed page scores too low.

### Q10. How does the API handle redirects?

Ollagraph's meta audit follows redirects, grades the final page, and returns it as `final_url`. To inspect each hop of a chain, use `POST /v1/seo/redirect-chain-map`.

### Q11. Does the API check for duplicate meta descriptions across pages?

Not by itself — each call audits one page. Because every response includes the page's `title` and `meta_description`, duplicate detection is a few lines of your own code across the results, as in the sitemap example. Store results between runs to compare against history.

### Q12. What is the difference between OG tags and Twitter Cards?

Open Graph tags (`og:`) are the standard protocol used by Facebook, LinkedIn, Slack, and Discord. Twitter Cards (`twitter:`) are X/Twitter's own protocol. Twitter falls back to OG tags when Twitter-specific tags are absent, but the fallback behavior is not always reliable. Ollagraph's meta audit grades the `og:` tags; `POST /v1/intel/social-tags` returns both the Open Graph and Twitter Card tags for a page so you can check each.

---

## 16. Conclusion

Title tags, meta descriptions, and Open Graph tags are the most visible HTML elements your site produces. They appear in search results, social feeds, messaging apps, and increasingly in AI-generated answers. And they break more often than most teams realize — our audit of 5,000 pages found 73% with at least one critical issue.

A Meta Audit API solves this by automating the extraction and validation process across every platform that consumes your meta tags. It checks pixel width instead of character count. It downloads and inspects OG images. It resolves relative URLs the way each platform's crawler does. It catches issues in minutes that a manual audit would miss for weeks.

The teams that get this right treat meta tag auditing as a continuous process, not a one-time project. They integrate validation into their CI/CD pipeline. They run weekly scheduled audits. They fix templates instead of individual pages. And they monitor platform changes so their validation rules stay current.

Ollagraph's `POST /v1/seo/meta-audit` gives you the core of this as one HTTPS call per URL — a score, a grade, the extracted tags, and a plain-English issue list — and the examples above show the loop, duplicate checks, and CI gate around it. Sign up at ollagraph.com and run it against your sitemap.

---

## 17. References

- [Google Search Central: Document Titles](https://developers.google.com/search/docs/appearance/title-link)
- [Google Search Central: Meta Descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Open Graph Protocol](https://ogp.me/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [X/Twitter Card Documentation](https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Slack Unfurl Documentation](https://api.slack.com/reference/messaging/link-unfurling)
- [Discord Embed Documentation](https://discord.com/developers/docs/resources/message#embed-object)
- [Screaming Frog SEO Spider](https://www.screamingfrog.co.uk/seo-spider/)
- [Ahrefs Site Audit](https://ahrefs.com/site-audit)
- [Ollagraph API Documentation](https://ollagraph.com/docs)
- [W3C HTML Meta Element Specification](https://html.spec.whatwg.org/multipage/semantics.html#the-meta-element)
