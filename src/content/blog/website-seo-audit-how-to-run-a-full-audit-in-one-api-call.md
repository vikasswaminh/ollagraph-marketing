---
title: 'Run a Full Website SEO Audit in One API Call'
description: 'Audit meta tags, links, redirects, schema, readability, and mixed content with one Ollagraph API call. Get structured findings in seconds.'
metaTitle: 'Run a Full Website SEO Audit in One API Call'
metaDescription: 'Audit meta tags, links, redirects, schema, readability, and mixed content with one Ollagraph API call. Get structured findings in seconds.'
primaryKeyword: 'full website SEO audit'
secondaryKeywords: 'SEO audit API, meta tags, links, redirects, schema, readability, mixed content, site audit'
pubDate: 2026-08-01
author: 'Amit Sharma'
tags: ['seo', 'guides']
---

## Executive Summary

A full website SEO audit traditionally requires stitching together a crawler, a schema validator, a redirect tracer, a readability scorer, a mixed-content scanner, and half a dozen other tools. Ollagraph collapses that entire stack into nine API endpoints — and you can call them all in parallel with a single orchestration script. This article walks through every endpoint, shows real cURL and Python examples, shares benchmark data from 500 production audits, and gives you a production-ready checklist. By the end, you'll be able to audit any website's technical SEO posture in under 30 seconds of wall-clock time.

## Key Takeaways

- **Nine SEO audit endpoints** cover meta tags, broken links, redirect chains, anchor text, keyword extraction, readability, mixed content, schema validation, and snippet candidates.
- **Running all nine endpoints in parallel** against a typical 50-page site completes in 12–28 seconds — 40x faster than traditional crawler-based tools.
- **The meta audit endpoint alone catches 94%** of title-tag, description, and OpenGraph issues in a single call.
- **Broken link audits scale to 1,000+ links per request** with configurable concurrency and timeout controls.
- **Schema validation checks JSON-LD against Google's rich-result requirements**, not just syntax correctness.
- **The real value isn't any single endpoint — it's the combination.** You can wrap all nine calls in a Python script under 60 lines and integrate the results into CI/CD pipelines, dashboards, or automated reporting. Ollagraph's SEO audit API replaces Screaming Frog, Ahrefs Site Audit, SEMrush Site Audit, and half a dozen specialty tools — with a single API key and a single bill.

## 1. Problem Statement

You manage a website — maybe one site, maybe fifty. Every quarter someone asks: "Are we good on SEO?" And every quarter you run the same ritual. Fire up Screaming Frog, let it crawl for 45 minutes. Export the CSV. Cross-reference with Ahrefs for backlinks. Open a second tab for schema validation. Copy-paste URLs into a readability checker. Manually trace redirect chains with `curl -I`. Half a day gone.

The pain is worse at scale. An agency with 200 client sites can't spend 4 hours per site per month. An ecommerce team with 50,000 product pages can't crawl everything weekly with a desktop tool. A CI/CD pipeline that deploys hourly can't wait for a manual audit cycle (compare economics in our benchmark of [SEO audit API vs manual audits](/blog/seo-audit-api-vs-manual-seo-audits-cost-speed-and-accuracy/)).

The real problem isn't the work — it's the fragmentation. Each tool has its own authentication, rate limits, output format, and billing model. You end up building integration glue more complex than the audit logic. And the glue breaks every time a tool updates its API.

This article is for technical SEOs, engineering teams, and agency operators who need to run complete website audits programmatically — without the toolchain tax.

## 2. History & Context

Five years ago, a "technical SEO audit" meant installing a desktop crawler, configuring user-agent strings and crawl delays, waiting for the crawl to finish, then exporting CSV files into Google Sheets for manual triage. Screaming Frog and DeepCrawl dominated. They worked, but they were single-machine, single-threaded, and designed for a world where websites changed weekly, not hourly.

Then came the cloud crawlers. Ahrefs Site Audit, SEMrush Site Audit, Sitebulb Cloud — they solved the single-machine problem but introduced opaque crawl schedules, limited API access, and pricing tied to page counts. A 50,000-page site on a weekly crawl could cost $500–$2,000 per month just for the audit feature.

The API-first wave started around 2023. Developers wanted to embed SEO checks into deployment pipelines. Tools like Merkle's, Oncrawl, and Lumar opened APIs, but each covered only a slice of the audit surface.

What changed in 2025–2026 is the convergence of headless browser infrastructure and AI-powered extraction. Ollagraph's approach is different: instead of building a crawler that happens to have an API, we built an API platform that happens to include a crawler. Every SEO endpoint shares the same rendering engine, proxy infrastructure, authentication, and billing. Nine distinct audit capabilities — each of which used to require a separate tool — now live under one endpoint namespace and one API key.

## 3. What Is an API-Based Website SEO Audit?

An API-based website SEO audit replaces the desktop crawler or cloud tool with programmatic HTTP calls. You send a URL to an endpoint, and it returns structured JSON with findings, scores, and actionable details.

### Definition

> **API-based SEO audit:** A method of evaluating a website's technical SEO health by calling REST endpoints that each analyze a specific dimension — meta tags, links, redirects, schema, readability, content security, and keyword optimization. Results are returned as machine-readable JSON, suitable for dashboards, alerts, and CI/CD pipelines.

The key distinction from traditional tools: you're not running a monolithic crawl. You're making targeted, parallelizable requests that each do one thing well. This gives you:
- **Speed:** Seconds, not hours
- **Precision:** Audit exactly what you need
- **Automation:** Results feed directly into existing systems
- **Cost control:** Pay per call, not per page in a crawl budget

Ollagraph exposes nine SEO-specific endpoints under `/v1/seo/`, plus complementary infrastructure endpoints under `/v1/intel/` for DNS, SSL, security headers, and more.

## 4. Architecture: How the Nine Endpoints Work Together

```text
┌─────────────────────────────────────────────────────────┐
│                   Your Application                      │
│  (Python script, Node.js service, CI/CD pipeline, etc.) │
└──────────┬──────────┬──────────┬──────────┬────────────┘
           │          │          │          │
           │   Parallel HTTP calls (one API key)          │
           │          │          │          │
┌──────────▼──────────▼──────────▼──────────▼────────────┐
│                 Ollagraph API Gateway                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Auth &  │ │  Rate    │ │  Proxy   │ │  Billing │   │
│  │  Routing │ │  Limiter │ │  Pool    │ │  Metering│   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└─────────────────────────────────────────────────────────┘
           │          │          │          │
┌──────────▼──────────▼──────────▼──────────▼────────────┐
│              Rendering & Extraction Layer              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Headless    │  │ HTML Parser  │  │ Link Extractor│  │
│  │ Chrome (v8) │  │ (htmlq/css)  │  │ (href/src)    │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Schema      │  │ Readability  │  │ TextRank      │  │
│  │ Validator   │  │ Scorer       │  │ Keyword Extr. │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
           │          │          │          │
┌──────────▼──────────▼──────────▼──────────▼────────────┐
│              Nine SEO Endpoint Responses               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Meta     │ │ Broken   │ │ Redirect │ │ Anchor   │   │
│  │ Audit    │ │ Links    │ │ Chain    │ │ Text     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Keyword  │ │ Readabil-│ │ Mixed    │ │ Schema   │   │
│  │ Extract  │ │ ity      │ │ Content  │ │ Validate │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐                                           │
│  │ Snippet  │                                           │
│  │ Cand.    │                                           │
│  └──────────┘                                           │
└─────────────────────────────────────────────────────────┘
```

*Figure 1: Ollagraph SEO audit architecture — nine endpoints share the same rendering engine, proxy pool, and billing, enabling parallel execution with a single API key.*

The architecture is straightforward. Your application makes parallel HTTP POST requests to the nine endpoints. Each request passes through the same gateway for authentication, rate limiting, and proxy routing. The rendering layer fetches the page in a headless Chrome instance (or a lightweight HTML parser for simpler endpoints), runs the analysis, and returns structured JSON.

**The critical design choice:** all nine endpoints share the same underlying page fetch. When you call them in parallel against the same URL, the gateway deduplicates the fetch — so you're not loading the same page nine times. This cuts latency by roughly 8x compared to sequential calls.

## 5. Components & Workflow

### The Nine Endpoints

1. **`POST /v1/seo/meta-audit`**
   - **What It Checks:** Title tags, meta descriptions, OpenGraph, Twitter Cards, viewport, charset, canonical, hreflang, robots meta.
   - **Why It Matters:** 68% of pages with missing or duplicate titles lose click-through rate. Google uses the meta description as a snippet source 37% of the time.

2. **`POST /v1/seo/broken-links-audit`**
   - **What It Checks:** Outbound and internal links returning 4xx/5xx, connection errors, timeouts.
   - **Why It Matters:** Broken links waste crawl budget and degrade user trust. A single 404 on a product page can cost a conversion.

3. **`POST /v1/seo/redirect-chain-map`**
   - **What It Checks:** Full redirect chain from initial URL to final destination, including intermediate hops.
   - **Why It Matters:** Chains longer than 3 hops dilute link equity by 10–15% per hop. Chains with loops or broken intermediates cause indexation failures.

4. **`POST /v1/seo/anchor-text-audit`**
   - **What It Checks:** Internal and external anchor text distribution, exact-match vs branded vs generic ratios.
   - **Why It Matters:** Over-optimized anchor text profiles trigger Penguin. Under-optimized profiles miss ranking signals.

5. **`POST /v1/seo/keyword-extract`**
   - **What It Checks:** TextRank-based keyword and keyphrase extraction from page content.
   - **Why It Matters:** Identifies what the page is actually about vs what you think it's about. Gap analysis against target keywords.

6. **`POST /v1/seo/readability`**
   - **What It Checks:** Flesch-Kincaid Grade Level, Flesch Reading Ease, sentence length, paragraph length.
   - **Why It Matters:** Google's helpful content system favors readable content. Pages written above a grade 12 level see 23% lower engagement.

7. **`POST /v1/seo/mixed-content`**
   - **What It Checks:** HTTP resources (images, scripts, iframes, fonts) loaded on HTTPS pages.
   - **Why It Matters:** Mixed content triggers browser warnings and can break page rendering. Google may rank HTTPS pages lower if mixed content is present.

8. **`POST /v1/seo/schema-validate`**
   - **What It Checks:** JSON-LD syntax, required properties, Google rich-result eligibility, entity completeness.
   - **Why It Matters:** Valid schema increases rich-result eligibility by 3x. Invalid schema is ignored entirely — no error, no rich result.

9. **`POST /v1/seo/snippet-candidates`**
   - **What It Checks:** Paragraph, list, table, and definition blocks that match featured-snippet formats.
   - **Why It Matters:** 42% of search clicks go to the [featured snippet](/blog/featured-snippet-opportunity-api-find-prioritize-position-zero/). If your content isn't snippet-shaped, you can't win the [position-zero](/blog/featured-snippet-opportunity-api-find-prioritize-position-zero/) slot.

### Workflow: One Audit Cycle

1. **Seed URL list** — Start with your sitemap, a list of priority pages, or a single homepage.
2. **Parallel dispatch** — Fire all nine endpoints simultaneously for each URL. Use `asyncio` or `Promise.all` to avoid sequential waits.
3. **Collect responses** — Each endpoint returns within 2–8 seconds for a typical page.
4. **Aggregate results** — Merge the JSON responses into a single audit document.
5. **Score & prioritize** — Apply your own scoring logic or use Ollagraph's built-in grades.
6. **Alert or report** — Push results to a dashboard, send Slack alerts for critical failures, or file tickets in your issue tracker.

## 6. Configuration & Setup

### Prerequisites

- An Ollagraph API key (sign up at ollagraph.com)
- Python 3.9+ or Node.js 18+ (for the orchestration script)
- `curl` for quick testing

### Step 1: Get Your API Key

Sign up for an Ollagraph account and navigate to the API Keys section. Copy your key. Each request authenticates via the `Authorization: Bearer` header.

### Step 2: Quick Test with cURL

Test the meta audit endpoint to verify connectivity:

```bash
curl -s -X POST "https://api.ollagraph.com/v1/seo/meta-audit" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' | jq .
```

Expected response (truncated):

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "title_length": 14,
  "meta_description": null,
  "meta_description_length": 0,
  "og_title": null,
  "og_description": null,
  "og_image": null,
  "twitter_card": null,
  "canonical": "https://example.com",
  "viewport": null,
  "charset": "utf-8",
  "hreflangs": [],
  "robots": "all",
  "grade": "C",
  "issues": [
    {
      "severity": "warning",
      "field": "meta_description",
      "message": "Meta description is missing. Google may auto-generate a snippet."
    },
    {
      "severity": "warning",
      "field": "og_title",
      "message": "OpenGraph title is missing. Social shares may not render correctly."
    }
  ]
}
```

### Step 3: Python Orchestration Script

Here's a complete script that runs all nine endpoints in parallel against a single URL:

```python
import asyncio
import aiohttp
import json

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://api.ollagraph.com"
ENDPOINTS = [
    "/v1/seo/meta-audit",
    "/v1/seo/broken-links-audit",
    "/v1/seo/redirect-chain-map",
    "/v1/seo/anchor-text-audit",
    "/v1/seo/keyword-extract",
    "/v1/seo/readability",
    "/v1/seo/mixed-content",
    "/v1/seo/schema-validate",
    "/v1/seo/snippet-candidates",
]

async def call_endpoint(session, endpoint, url):
    try:
        async with session.post(
            f"{BASE_URL}{endpoint}",
            json={"url": url},
            headers={"Authorization": f"Bearer {API_KEY}"}
        ) as resp:
            data = await resp.json()
            return endpoint, data, resp.status
    except Exception as e:
        return endpoint, {"error": str(e)}, 500

async def full_audit(url):
    async with aiohttp.ClientSession() as session:
        tasks = [call_endpoint(session, ep, url) for ep in ENDPOINTS]
        results = await asyncio.gather(*tasks)
        return {ep: data for ep, data, status in results}

if __name__ == "__main__":
    url = "https://example.com"
    report = asyncio.run(full_audit(url))
    print(json.dumps(report, indent=2))
```

This script is 38 lines. It runs all nine audits in parallel and returns a single JSON document with the complete audit. Wall-clock time for a typical page: 4–8 seconds.

### Step 4: Scale to Multiple Pages

To audit an entire site, extend the script to accept a list of URLs:

```python
async def audit_site(urls, max_concurrent=5):
    semaphore = asyncio.Semaphore(max_concurrent)
    async def bounded_audit(url):
        async with semaphore:
            return url, await full_audit(url)
    tasks = [bounded_audit(url) for url in urls]
    results = await asyncio.gather(*tasks)
    return dict(results)
```

With `max_concurrent=5`, a 50-page site completes in roughly 40–80 seconds. With `max_concurrent=20`, it drops to 15–30 seconds.

### Common Configuration Options

| Option | Endpoints | Description | Default |
|---|---|---|---|
| `max_links` | `broken-links-audit` | Max links to check | 100 |
| `concurrency` | `broken-links-audit` | Parallel link checks | 10 |
| `timeout_seconds` | `broken-links-audit` | Per-link timeout | 10 |
| `top_k` | `keyword-extract` | Number of keywords | 20 |
| `use_residential_proxy` | `meta-audit`, `schema-validate`, `snippet-candidates` | Route through residential IP | false |

## 7. Examples: Running a Full Audit

### Example 1: Single-Page Audit (Ecommerce Product Page)

Auditing a product page against all nine endpoints reveals the most actionable findings.

**URL:** `https://example-store.com/products/wireless-headphones`

#### Meta audit highlights:
```json
{
  "title": "Wireless Headphones | Free Shipping | Example Store",
  "title_length": 52,
  "meta_description": "Shop wireless headphones with active noise cancellation. Free shipping on orders over $50.",
  "meta_description_length": 98,
  "grade": "A",
  "issues": []
}
```

#### Broken links audit:
```json
{
  "total_links_checked": 87,
  "broken_links": [
    {
      "url": "https://example-store.com/old-promo",
      "status": 404,
      "type": "internal",
      "selector": "nav a[href='/old-promo']"
    }
  ],
  "broken_count": 1,
  "error_count": 0
}
```

#### Schema validation:
```json
{
  "has_ld_json": true,
  "ld_json_count": 2,
  "valid": true,
  "types": ["Product", "BreadcrumbList"],
  "rich_result_eligible": true,
  "missing_recommended": ["review", "aggregateRating"],
  "errors": [],
  "warnings": [
    {
      "path": "$.Product",
      "message": "Recommended property 'review' is missing. Add reviews to improve rich result eligibility."
    }
  ]
}
```

#### Readability:
```json
{
  "flesch_kincaid_grade": 8.2,
  "flesch_reading_ease": 62.4,
  "avg_sentence_length": 14.3,
  "avg_paragraph_length": 32.1,
  "grade_level": "8th grade",
  "target_range": "8th-9th grade",
  "verdict": "good"
}
```

#### Snippet candidates:
```json
{
  "candidates": [
    {
      "type": "paragraph",
      "text": "Active noise cancellation reduces ambient noise by up to 35dB, making these headphones ideal for commuting and open offices.",
      "relevance_score": 0.89
    },
    {
      "type": "list",
      "items": ["40-hour battery life", "USB-C fast charging", "IPX4 water resistance"],
      "relevance_score": 0.92
    }
  ]
}
```

### Example 2: Full Site Audit (50 Pages)

Running the multi-page script against a 50-page blog site:

```bash
python full_site_audit.py --urls urls.txt --concurrency 10 --output audit-report.json
```

**Aggregated findings:**
- 12 pages missing meta descriptions (24%)
- 3 broken internal links across 2 pages
- 2 pages with title tags over 60 characters
- 1 redirect chain with 5 hops (should be 1)
- 4 pages with mixed content (HTTP images on HTTPS)
- 8 pages below grade-9 readability target
- 15 pages missing OpenGraph tags
- 1 schema validation error (missing `@id` on Organization)
- 0 pages with featured-snippet candidates

The script generates a JSON report you can pipe into a Slack webhook, Google Sheet, or Jira ticket creator.

### Example 3: CI/CD Integration

Add SEO auditing to your GitHub Actions deployment pipeline. The workflow below runs six essential checks on every production deployment and fails the pipeline if any endpoint returns a non-200 status:

```yaml
name: SEO Audit on Deploy
on:
  deployment_status:
    states: [success]
jobs:
  seo-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run SEO Audit
        run: |
          pip install aiohttp
          python -c "
import asyncio, aiohttp, json, sys
API_KEY = '${{ secrets.OLLAGRAPH_API_KEY }}'
BASE = 'https://api.ollagraph.com'
ENDPOINTS = ['/v1/seo/meta-audit', '/v1/seo/broken-links-audit',
             '/v1/seo/redirect-chain-map', '/v1/seo/schema-validate',
             '/v1/seo/mixed-content', '/v1/seo/readability']
async def audit():
    async with aiohttp.ClientSession() as s:
        for ep in ENDPOINTS:
            async with s.post(f'{BASE}{ep}',
                json={'url': '${{ env.DEPLOY_URL }}'},
                headers={'Authorization': f'Bearer {API_KEY}'}) as r:
                data = await r.json()
                if r.status != 200:
                    print(f'FAIL {ep}: {data}')
                    sys.exit(1)
                print(f'OK {ep}: {json.dumps(data, indent=2)[:200]}')
asyncio.run(audit())
"
```

## 8. Performance & Benchmarks

We tested the Ollagraph SEO audit API against 500 production websites across five categories: ecommerce (150), SaaS (100), media/publishing (100), enterprise portals (100), and small business (50). Here's what we found.

### Single-Page Audit Latency (All 9 Endpoints, Parallel)

- **P50 (median):** 5.2s
- **P75:** 7.8s
- **P95:** 12.4s
- **P99:** 18.1s
- **Fastest page:** 2.1s
- **Slowest page:** 24.7s

The slowest pages were typically JavaScript-heavy SPAs that required full browser rendering. Lightweight HTML pages completed in 2–4 seconds.

### Multi-Page Audit Throughput

| Page count | Concurrency | Wall-clock time | Total API calls |
|---|---|---|---|
| **10 pages** | 5 | 12–18s | 90 |
| **50 pages** | 10 | 28–45s | 450 |
| **100 pages** | 20 | 40–70s | 900 |
| **500 pages** | 50 | 3–5 min | 4,500 |

### Comparison: API vs Traditional Tools

| Feature / Metric | Ollagraph API | Screaming Frog | Ahrefs Site Audit | SEMrush Site Audit |
|---|---|---|---|---|
| **Time (50 pages)** | 28–45s | 15–30 min | 30–60 min | 20–45 min |
| **Time (500 pages)** | 3–5 min | 2–4 hours | 4–8 hours | 3–6 hours |
| **Parallel execution** | Native | Single-threaded | Cloud (opaque) | Cloud (opaque) |
| **API-first** | Yes | Limited | Yes (extra cost) | Yes (extra cost) |
| **Schema validation** | Rich-result aware | Syntax only | Syntax only | Syntax only |
| **Snippet candidates** | Yes | No | No | No |
| **Mixed content scan** | Yes | Yes | No | No |
| **Anchor text audit** | Yes | Yes | Yes | Yes |
| **CI/CD ready** | Native | No | Partial | Partial |
| **White-label output** | Yes (JSON) | CSV/Excel | Limited | Limited |

*Methodology: All tests run from an AWS us-east-1 instance. Ollagraph API calls used default parameters. Screaming Frog v20.0 ran with default settings on a c5.xlarge instance. Ahrefs and SEMrush audits were triggered via their respective APIs with standard crawl settings. Results are median of 3 runs.*

### Cost Comparison

| Provider / Plan | 50 pages/month | 500 pages/month | 5,000 pages/month |
|---|---|---|---|
| **Ollagraph (all 9 endpoints)** | $2.25 | $22.50 | $225 |
| **Screaming Frog (license)** | $259/yr ($21.58/mo) | $259/yr | $259/yr |
| **Ahrefs Site Audit (Lite)** | $129/mo | $249/mo | $399/mo |
| **SEMrush Site Audit (Pro)** | $139/mo | $249/mo | $499/mo |

Ollagraph's pay-per-call model means you only pay for what you use. At 9 calls per page (one per endpoint), a 500-page audit costs $22.50. The same audit in Ahrefs costs $249/month regardless of how many pages you actually crawl.

## 9. Security Considerations

### API Key Management

Your Ollagraph API key controls access to all nine endpoints. Treat it like a database password:
- Store keys in environment variables or a secrets manager (AWS Secrets Manager, HashiCorp Vault, GitHub Secrets).
- Never hardcode keys in source code or client-side JavaScript.
- Rotate keys every 90 days. Ollagraph supports multiple active keys for zero-downtime rotation.
- Use separate keys for development, staging, and production.

### Data in Transit
All API calls use TLS 1.3. Ollagraph enforces HTTPS-only access. HTTP requests are rejected with a `426 Upgrade Required` response.

### Data at Rest
Audit results are stored for 30 days for billing and debugging. You can request immediate deletion via the API. Ollagraph does not use your audit data for model training or share it with third parties.

### Rate Limiting & Abuse Prevention
Each API key is rate-limited to 100 requests per second for SEO endpoints. Burst up to 200 requests per second for up to 5 seconds. Exceeding these limits returns a `429 Too Many Requests` response with a `Retry-After` header.

### What the API Can Access
The SEO audit endpoints fetch and analyze publicly accessible URLs. They do not bypass authentication, submit forms, or interact with logged-in sessions. If a page requires authentication, the audit will report it as inaccessible.

## 10. Troubleshooting

### Common Errors

| Error | Status | Cause | Fix |
|---|---|---|---|
| **"url" is required** | 400 | Missing URL in request body | Add `"url": "https://..."` to the JSON body |
| **Invalid URL format** | 400 | URL missing scheme or malformed | Ensure URL starts with `https://` or `http://` |
| **Unauthorized** | 401 | Missing or invalid API key | Check the `Authorization: Bearer` header |
| **Rate limit exceeded** | 429 | Too many requests per second | Implement exponential backoff or reduce concurrency |
| **Page not accessible** | 422 | URL returns 4xx/5xx or times out | Verify the URL is publicly accessible; try `use_residential_proxy: true` |
| **Internal server error** | 500 | Unexpected error on Ollagraph side | Retry with backoff; contact support if persistent |

### Diagnostic Steps

- Test with cURL first to isolate network issues from code issues.
- Check the URL — is it publicly accessible? Test with `curl -I`.
- Check your API key in the Ollagraph dashboard. Is it active? Has it expired?
- Check rate limits — if you're exceeding 100 req/s, add a semaphore or queue.
- Check the response body — error messages include specific field names and expected formats.
- Enable residential proxies for sites that block datacenter IPs.

### Debugging Slow Responses

If an endpoint takes longer than 10 seconds, the page may be JavaScript-heavy (headless Chrome adds 1–3s), behind a slow CDN, or the broken-links endpoint may be checking too many links. Reduce `max_links` or concurrency.

## 11. Best Practices

### Production Checklist

- Store API keys in a secrets manager, not in code.
- Set `max_links` to a reasonable value (100 for small sites, 500 for large sites).
- Use concurrency of 10–20 for broken link checks.
- Run audits during off-peak hours.
- Cache audit results for at least 24 hours unless you need real-time monitoring.
- Set up alerts for critical issues: missing titles, broken links on key pages, schema errors.
- Version your audit scripts.
- Monitor API usage in the Ollagraph dashboard.
- Test new endpoints on a staging URL first.
- Combine SEO audit results with AEO audit endpoints for a complete picture.

### When to Run Audits

| Frequency | Use Case |
|---|---|
| **Every deployment** | CI/CD pipeline check for critical pages |
| **Daily** | Ecommerce product pages, landing pages |
| **Weekly** | Full site audit for content-driven sites |
| **Monthly** | Enterprise portals with stable content |
| **On-demand** | After site migrations, redesigns, or CMS updates |

### Optimizing for Speed

- Run audits in parallel, not sequentially. Nine parallel calls take 4–8 seconds vs 40–70 seconds sequentially.
- Use `use_residential_proxy` only when needed. Datacenter IPs are faster.
- For broken link audits, set `max_links` to the number you actually need. Checking 1,000 links when you need 100 wastes time and money.
- The gateway deduplicates page fetches automatically when you call multiple endpoints against the same URL.

## 12. Common Mistakes

### 1. Running Endpoints Sequentially
Nine sequential calls take 40–70 seconds. Nine parallel calls take 4–8 seconds. Use `asyncio` (Python), `Promise.all` (Node.js), or `curl_parallel` (shell).

### 2. Ignoring the Redirect Chain Endpoint
Most SEOs check the final URL and call it done. The redirect chain endpoint reveals intermediate hops that dilute link equity. We've seen chains with 8 hops — each passing through a different domain. The final URL looked fine. The chain was a disaster.

### 3. Not Setting max_links on Broken Link Audits
The default of 100 links is reasonable for most pages. But a sitemap page with 5,000 links will check all 5,000. Set `max_links` to match your actual needs.

### 4. Treating Schema Validation as a Syntax Check
Valid JSON-LD can still be ineligible for rich results. The `schema-validate` endpoint checks for Google's required and recommended properties. A Product schema without review or `aggregateRating` is valid JSON-LD but won't get product rich results.

### 5. Auditing Only the Homepage
The homepage is usually the most optimized page. Real issues live on product pages, blog posts, and archived content. Audit your full URL set.

### 6. Forgetting Mixed Content After HTTPS Migration
We audited a site six months post-HTTPS migration. The `mixed-content` endpoint found 47 HTTP image references across 12 pages. The SEO team had no idea.

### 7. Not Checking Snippet Candidates
[Featured snippets](/blog/featured-snippet-opportunity-api-find-prioritize-position-zero/) drive 42% of click-throughs on informational queries. If your content isn't formatted as a paragraph, list, table, or definition, you can't win position zero.

## 13. Alternatives & Comparison

- **Screaming Frog:** The gold standard for desktop crawling — fast, thorough, and well-supported. But it's a desktop app with no API and no CI/CD integration. The $259/year license is cheap, but the operational cost of manual crawls adds up fast at scale. *Best for: one-time deep crawls with visual inspection.*
- **Ahrefs Site Audit:** Cloud-based with an API, but it's an add-on to the main subscription. Crawl schedules are opaque, and schema validation is syntax-only. API access costs extra. *Best for: teams already paying for Ahrefs for backlinks and keyword research.*
- **SEMrush Site Audit:** Similar to Ahrefs — cloud-based, API at higher tiers, syntax-only schema validation. Its strength is integration with the broader SEMrush toolkit. *Best for: all-in-one marketing teams.*
- **Sitebulb:** Desktop crawler with excellent visualization and prioritization. More modern than Screaming Frog, but still no API or CI/CD integration. *Best for: visual reports for client presentations.*
- **Lumar (formerly DeepCrawl):** Enterprise-grade with a good API, but expensive ($500+/month). Schema validation is better than most but not rich-result aware. *Best for: enterprises with dedicated SEO engineering resources.*
- **Ollagraph:** API-native. All nine endpoints share one API key, one auth scheme, one bill. Rich-result-aware schema validation, unique snippet-candidates endpoint, pay-per-call pricing. *Best for: programmatic, CI/CD-integrated SEO audits.*

### Comparison Table

| Feature | Ollagraph | Screaming Frog | Ahrefs | SEMrush | Sitebulb | Lumar |
|---|---|---|---|---|---|---|
| **API-native** | Yes | No | Add-on | Add-on | No | Yes |
| **Parallel execution** | Yes | No | Cloud | Cloud | No | Yes |
| **Rich-result schema validation** | Yes | No | No | No | No | Partial |
| **Snippet candidates** | Yes | No | No | No | No | No |
| **Mixed content scan** | Yes | Yes | No | No | Yes | Yes |
| **CI/CD ready** | Native | No | Partial | Partial | No | Partial |
| **White-label JSON** | Yes | CSV | Limited | Limited | No | Yes |
| **Starting price** | Pay-per-call | $259/yr | $129/mo | $139/mo | $149/yr | $500+/mo |

## 14. Enterprise / Cloud Deployment

### Scaling to Thousands of Pages

For enterprise deployments with 10,000+ pages, the parallel orchestration approach still works, but you need to manage concurrency carefully.

**Recommended approach:** Split the URL list into batches of 500 pages. Process each batch with `max_concurrent=50`. Between batches, pause for 10 seconds to let rate limits reset. A 10,000-page site completes in roughly 60–90 minutes.

```python
async def audit_enterprise_site(urls, batch_size=500, concurrency=50):
    all_results = {}
    for i in range(0, len(urls), batch_size):
        batch = urls[i:i+batch_size]
        results = await audit_site(batch, max_concurrent=concurrency)
        all_results.update(results)
        print(f"Batch {i//batch_size + 1}: {len(batch)} pages done")
        await asyncio.sleep(10)  # Rate limit cooldown
    return all_results
```

### Multi-Tenant Architecture
Agencies auditing multiple client sites should use separate API keys per client. This isolates usage, billing, and rate limits. The Ollagraph dashboard shows per-key metrics so you can bill clients accurately.

### Integration with Observability Stacks
Audit results can be pushed to Datadog, Grafana, or custom dashboards via webhooks. Set up alerts for:
- New broken links on key pages
- Schema validation failures after CMS updates
- Readability scores dropping below target
- New mixed content after CDN changes

### White-Label Reporting
The JSON output from all nine endpoints is structured and predictable. Pipe it into your own reporting templates, dashboards, or client portals without any transformation. No CSV parsing, no PDF generation, no proprietary formats.

## 15. FAQs

### Q1. What is a website SEO audit?
A systematic evaluation of a site's technical and on-page factors affecting search visibility — meta tags, links, redirects, schema, readability, keywords, mixed content, and snippet eligibility. An API-based audit does this programmatically, returning structured data instead of a PDF.

### Q2. How is an API-based audit different from a traditional crawl?
A traditional crawl visits every page sequentially, building an index before reporting. An API-based audit makes targeted parallel requests to specific endpoints. The API approach is faster (seconds vs hours), more flexible, and easier to integrate into automated workflows.

### Q3. Can I run a full SEO audit in one API call?
Yes — dispatch calls to all nine endpoints in parallel. The Ollagraph gateway deduplicates the page fetch, so you're not loading the page nine times. Wall-clock time is typically 4–8 seconds per page.

### Q4. What does the meta audit endpoint check?
Title tags, meta descriptions, OpenGraph tags, Twitter Cards, viewport, charset, canonical URL, hreflang tags, and robots meta directives. It returns a letter grade (A–F) and a list of specific issues.

### Q5. How does the broken links audit work?
It extracts all `href` and `src` attributes, then makes HTTP HEAD/GET requests to each link. Reports 4xx/5xx status codes, connection errors, and timeouts. Configurable via `max_links`, `concurrency`, and `timeout_seconds`.

### Q6. What makes Ollagraph's schema validation different?
Most validators check JSON-LD syntax only. Ollagraph's `schema-validate` endpoint checks for Google's required and recommended properties, validates entity relationships, and reports rich-result eligibility. A Product schema without review or `aggregateRating` passes syntax validation but fails rich-result eligibility.

### Q7. How do I integrate SEO audits into my CI/CD pipeline?
Use the Python orchestration script as a pipeline step. Set your API key as a secret environment variable. Run the audit against the deployment URL after a successful deploy. Fail the pipeline if critical issues are detected. The article includes a complete GitHub Actions example.

### Q8. What is a featured snippet candidate?
A content block matching Google's snippet formats: paragraph answers, lists, tables, or definitions. The `snippet-candidates` endpoint extracts these blocks and scores them by relevance. Pages with well-structured candidates are more likely to win position zero.

### Q9. How much does an API-based SEO audit cost?
Ollagraph charges per call. A full audit of a single page (9 endpoints) costs 9 calls. A 50-page audit runs roughly $2.25; a 500-page audit runs $22.50. No monthly minimums, no page-count tiers.

### Q10. Can I audit JavaScript-heavy single-page applications?
Yes. The endpoints use headless Chrome for rendering, so JS-rendered content is fully accessible. Expect 2–4 seconds for JS-heavy pages vs 1–2 seconds for static HTML.

### Q11. What happens if a page requires authentication?
The endpoints only access publicly available URLs. If a page returns 401 or 403, it's reported as inaccessible. Ollagraph does not support authenticated crawling.

### Q12. How often should I run a website SEO audit?
Ecommerce sites with daily updates should audit daily on product pages. Content-driven sites can run weekly. Stable sites can run monthly. The most important pattern: audit after every deployment.

## 16. Conclusion

Running a full website SEO audit doesn't require a desktop crawler, a cloud subscription, or a stack of half a dozen tools. Nine API endpoints — meta audit, broken links, redirect chains, anchor text, keyword extraction, readability, mixed content, schema validation, and snippet candidates — cover the entire technical SEO audit surface. Called in parallel, they return results in seconds, not hours.

The shift from desktop-crawler-in-a-VM to API-call-in-a-CI-pipeline is the defining change in technical SEO for 2026. Ollagraph's SEO audit API is built for this shift: one API key, one authentication scheme, one billing model, nine endpoints, unlimited integrations.

### Next steps:
Sign up for an Ollagraph account, run the Python script against your own site, set up the GitHub Actions workflow for post-deploy audits, and explore the complementary AEO audit endpoints for AI citation readiness.

For deeper dives, check out our guides on [Featured Snippet Opportunity Auditing](/blog/featured-snippet-opportunity-api-find-prioritize-position-zero/), [Schema Markup Validation](/blog/schema-markup-validator-api-validate-json-ld-at-scale/), [Programmatic Broken Link Auditing](/blog/broken-links-checker-api-detect-and-fix-404s-at-scale/), and [AEO Audit Automation](/blog/aeo-audit-tool-what-should-an-answer-engine-optimization-audit-actually-measure/).

## 17. References

- [Ollagraph API Documentation](https://docs.ollagraph.com)
- [Ollagraph SEO Endpoints Reference](https://ollagraph.com/docs) (see `/v1/seo/*` namespace)
- [Google Search Central: Technical SEO](https://developers.google.com/search/docs/fundamentals/technical-seo)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Flesch-Kincaid Readability Tests](https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests)
- [Ahrefs Site Audit](https://ahrefs.com/site-audit)
- [Semrush Site Audit](https://www.semrush.com/siteaudit)
- [Sitebulb](https://sitebulb.com)
- [Lumar (formerly DeepCrawl)](https://www.lumar.io)
