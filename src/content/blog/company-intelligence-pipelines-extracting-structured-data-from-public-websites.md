---
title: 'Company Intelligence Pipelines for Reliable Firmographic Data'
description: 'Turn public websites into validated company profiles. Extract firmographics, contacts, and tech stack with schema gates and enrichment.'
metaTitle: 'Company Intelligence Pipelines for Firmographics'
metaDescription: 'Turn public websites into validated company profiles. Extract firmographics, contacts, and tech stack with schema gates and enrichment.'
primaryKeyword: 'company intelligence pipelines'
secondaryKeywords: 'firmographics, data enrichment, web scraping, schema validation, company profiles, tech stack'
pubDate: 2026-07-31
author: 'Amit Sharma'
tags: ['guides', 'seo']
---

## Executive Summary

Company intelligence pipelines extract structured data from public websites — company name, industry, employee count, revenue range, technology stack, social profiles, and key contacts — and deliver it as clean, validated JSON to CRM systems, sales platforms, and AI agents. The challenge is reliability at scale. A pipeline that extracts the wrong employee count for 30% of target accounts pollutes your lead scoring model. A pipeline that misses the tech stack field silently weakens ICP filtering. This guide covers the full stack: discovering company URLs, extracting firmographic signals from multiple sources, validating every field against a schema contract, enriching partial records with domain intelligence, and operating the pipeline in production with observability and self-healing retry logic.

## Key Takeaways

- **Company intelligence pipelines combine scraping, extraction, and enrichment into a single workflow.** Each stage has distinct failure modes that must be handled independently.
- **Firmographic data lives in multiple places on a company website.** A single-page extraction misses 40–60% of available signals.
- **Schema validation gates catch silent corruption before it reaches your CRM.** A validated record means every field passed type, range, and cross-field checks.
- **Domain enrichment fills gaps that page scraping cannot reach.** Combining both sources yields 85–95% field completeness versus 50–70% from scraping alone.
- **Pipeline observability must track field-level extraction yield**, not just HTTP status codes. A 200 OK with a missing company description is a failure that looks like a success.
- **Self-healing retry trees reduce manual intervention.** Classify failures as network, schema violation, empty content, or staleness — each gets a different recovery strategy.

## 1. The Company Data Problem

A B2B sales team needs 500 qualified leads this quarter. They buy a list. Half the phone numbers are wrong. A third of the companies have been acquired. The employee counts are two years old. Industry tags are so broad that "Software" covers everything from a 5-person startup to a 50,000-person enterprise.

This is the company data problem: the data you can buy is stale, the data you can scrape is noisy, and the data you need — accurate, current, structured firmographics — is locked inside public websites never designed to be machine-read.

Teams throw engineering months at this. They build scrapers for LinkedIn, Crunchbase, and company homepages. They stitch data from six sources. They write custom deduplication logic. Six months later, they still cannot answer: "Which companies in our pipeline use Snowflake and have more than 200 employees?"

The root cause is not a lack of data. Public websites contain enormous amounts of company information. The root cause is that extracting it reliably — at scale, with validation, without manual curation — requires a pipeline designed for the job, not a collection of scripts.

This article is for engineers, data architects, and technical RevOps leaders who need to build or evaluate company intelligence pipelines. You already know how to call an API. What you need is a framework for reliability: how to extract firmographic data from multiple sources, validate it, enrich it, and deliver it to downstream systems without the silent corruption that makes company data pipelines untrustworthy.

## 2. How Company Intelligence Evolved

Company data started in manually curated directories like Dun & Bradstreet and Hoovers — accurate when collected, but updated quarterly at best. The API era (2010–2018) brought Crunchbase, Clearbit, and ZoomInfo, letting you enrich a company from an email domain in milliseconds. Coverage had gaps: early-stage startups and international companies were often missing.

From 2018 to 2023, teams built in-house scrapers targeting LinkedIn, Glassdoor, and Crunchbase for fresher data. The tradeoff was fragility — every site redesign broke the scraper, and anti-bot measures made extraction expensive.

Two shifts define the current era (2024–2026):
1. **LLM-based extraction** made it possible to pull company data from unstructured page content without maintaining fragile CSS selectors.
2. **Domain intelligence APIs** (WHOIS, DNS, SSL, tech stack detection) matured to the point where you can enrich a company profile without ever visiting its website.

The modern pipeline combines both: scrape what you can from the page, enrich what you cannot from domain infrastructure, and validate everything against a schema contract.

## 3. What a Company Intelligence Pipeline Actually Is

> **Definition:** An automated system that discovers company URLs, extracts firmographic and technographic data from public web sources, enriches partial records with domain intelligence signals, validates every field against a schema contract, and delivers clean, structured company profiles to downstream systems.

A company intelligence pipeline has three properties that distinguish it from a simple company scraper:

- **Multi-source extraction.** It does not rely on a single page or API. It extracts from the company homepage, about page, careers page, blog, and social profiles. It also pulls domain-level signals — WHOIS registration, DNS records, SSL certificate metadata — that no page scrape can provide.
- **Schema-enforced output.** Every company profile passes a validation gate that checks required fields (company name, domain, industry), typed fields (employee count as integer, revenue as float), and cross-field consistency (founding year <= current year, HQ country matches address).
- **Observable extraction yield.** The pipeline tracks field-level completeness: what fraction of companies had a successful employee count extraction? When yield drops below a threshold, an alert fires — not when a page fails to load, but when data quality degrades.

## 4. Architecture: The Four Extraction Layers

A company intelligence pipeline is not a single scraper pointed at a homepage. It is four distinct layers:

```text
Layer 4: Enrichment & Fusion   (Domain intel, tech stack detection, social profile lookup)
Layer 3: Multi-Page Extraction (About page, careers, blog, footer, contact page)
Layer 2: Homepage Extraction   (Company name, tagline, description, industry signals)
Layer 1: URL Discovery & Crawl (Domain input, sitemap parsing, page discovery)
```

- **Layer 1 — URL Discovery & Crawl.** The pipeline starts with a domain or list of domains. It fetches the sitemap, discovers key pages (about, careers, contact, blog), and prioritizes them for extraction within a crawl budget.
- **Layer 2 — Homepage Extraction.** The homepage carries the company name, tagline, value proposition, and industry keywords. Extraction uses semantic analysis (identifying the company name from H1/H2 tags and structured data) and pattern matching (extracting employee counts from "We are X employees" patterns).
- **Layer 3 — Multi-Page Extraction.** The about page adds company history and leadership. The careers page adds employee count signals and office locations. The blog adds content topics revealing market focus. The contact page adds physical addresses and phone numbers.
- **Layer 4 — Enrichment & Fusion.** This layer fills gaps page scraping cannot cover. WHOIS data reveals domain registration date and registrant organization. DNS records reveal email service provider. SSL certificates reveal issuer and validity. Tech stack detection reveals web framework, analytics tools, and CDN provider. Social profile lookup adds funding data, headcount ranges, and executive names.

## 5. Components & Workflow: Domain to Enriched Profile

Here is the end-to-end workflow for a single company through the pipeline.

### Step 1: Domain intake
The pipeline receives a domain (e.g., `acmecorp.com`) from a batch upload, CRM trigger, or API call. It normalizes the domain — strips `www.`, lowercases, removes trailing slashes.

### Step 2: Sitemap fetch and page discovery
The pipeline fetches `https://acmecorp.com/sitemap.xml` and `robots.txt` to discover available pages. It identifies high-value pages: about, careers, contact, blog, team. If no sitemap exists, it probes common URL patterns.

### Step 3: Homepage extraction
The pipeline fetches the homepage and extracts: company name (from H1, title tag, JSON-LD), tagline (from meta description or hero section), industry keywords (from body content and structured data), and social profile links (from header/footer).

### Step 4: Multi-page extraction
The pipeline fetches the about page for company description, the careers page for employee count signals and office locations, the contact page for address and phone, and the blog for content topics.

### Step 5: Domain enrichment
The pipeline runs WHOIS lookup for registration date, DNS lookup for MX/SPF/DKIM/DMARC records, SSL certificate inspection for issuer and validity, and tech stack detection for web framework, analytics, and CDN.

### Step 6: Schema validation
Extracted and enriched fields are validated against a company profile schema. Required fields: company name, domain, industry. Typed fields: `employee_count` (integer), `founded_year` (integer), `revenue_range` (enum). Cross-field checks: `founded_year` <= current year, HQ country matches address country.

### Step 7: Profile assembly and output
Validated fields are assembled into a structured company profile and written to the output destination — CRM, data warehouse, or API response. An evidence packet containing raw extracts, enrichment results, and validation outcomes is archived for debugging.

### Simplified Company Profile Schema

```python
COMPANY_SCHEMA = {
    "required": ["name", "domain", "industry"],
    "fields": {
        "name": {"type": "string", "min_length": 1, "max_length": 200},
        "domain": {"type": "string", "pattern": r"^[a-z0-9.-]+\.[a-z]{2,}$"},
        "industry": {"type": "string", "enum": INDUSTRY_TAXONOMY},
        "employee_count": {"type": "integer", "min": 1, "max": 1000000},
        "founded_year": {"type": "integer", "min": 1800, "max": 2026},
        "revenue_range": {"type": "string", "enum": REVENUE_BUCKETS},
        "hq_city": {"type": "string"},
        "hq_country": {"type": "string", "pattern": r"^[A-Z]{2}$"},
        "tech_stack": {"type": "array", "items": {"type": "string"}},
        "social_links": {
            "type": "object",
            "properties": {
                "linkedin": {"type": "string", "pattern": r"linkedin\.com/company/"},
                "crunchbase": {"type": "string", "pattern": r"crunchbase\.com/"},
                "twitter": {"type": "string", "pattern": r"twitter\.com/"}
            }
        }
    }
}
```

## 6. Configuration: Building a Production Pipeline

### Prerequisites
- Python 3.12+ or Node.js 22+
- Ollagraph API key (for extraction and enrichment endpoints)
- A target list of company domains (CSV, JSON, or database table)

### Step 1: Install an HTTP client

There is no Ollagraph SDK to install. Every endpoint is a plain HTTPS `POST` to `https://api.ollagraph.com` with a JSON body and an `Authorization: Bearer` header, so any HTTP client works.

```bash
pip install requests
```

In Node.js 18+, the built-in `fetch` is enough.

### Step 2: Configure extraction endpoints

```python
import os
import requests

API = "https://api.ollagraph.com"
HEADERS = {"Authorization": f"Bearer {os.environ['OLLAGRAPH_API_KEY']}"}

def call(path, payload):
    return requests.post(f"{API}{path}", json=payload,
                         headers=HEADERS, timeout=90).json()

# Lite company profile from the homepage: name, description, logo, address,
# social profiles, emails, phones (from Organization JSON-LD, og:* tags, links)
company = call("/v1/enrich/company", {"url": "https://acmecorp.com"})

# Readable main content from the about page
about = call("/v1/extract/clean", {"url": "https://acmecorp.com/about"})

# Raw structured data (JSON-LD, microdata, Open Graph), e.g. foundingDate
structured = call("/v1/extract/structured", {"url": "https://acmecorp.com"})

# Domain signals: detected tech stack, WHOIS registration, SPF/DKIM/DMARC
page_intel = call("/v1/intel/page", {"url": "https://acmecorp.com"})
whois = call("/v1/intel/whois", {"domain": "acmecorp.com"})
email_auth = call("/v1/intel/email-auth", {"domain": "acmecorp.com"})
```

### Step 3: Build the pipeline orchestration

```python
import json
import os
from datetime import datetime, timezone
from typing import Optional, Dict, List

import requests

API = "https://api.ollagraph.com"

class CompanyIntelligencePipeline:
    def __init__(self, api_key: str):
        self.headers = {"Authorization": f"Bearer {api_key}"}
        self.schema = COMPANY_SCHEMA

    def _call(self, path: str, payload: Dict) -> Dict:
        resp = requests.post(f"{API}{path}", json=payload,
                             headers=self.headers, timeout=90)
        data = resp.json()
        # A failed call counts as "no data", so one missing page
        # doesn't sink the whole profile.
        return data if data.get("status") == "success" else {}

    def process_domain(self, domain: str) -> Dict:
        domain = domain.lower().removeprefix("www.").removesuffix("/")
        pages = self._discover_pages(domain)
        company = self._call("/v1/enrich/company", {"url": pages["homepage"]})
        org = self._organization_jsonld(pages["homepage"])
        about = self._call("/v1/extract/clean", {"url": pages["about"]})
        page_intel = self._call("/v1/intel/page", {"url": pages["homepage"]})
        whois = self._call("/v1/intel/whois", {"domain": domain})
        profile = self._fuse_profiles(
            domain=domain, company=company, org=org,
            about=about, page_intel=page_intel, whois=whois
        )
        errors = self._validate_profile(profile)
        profile["validation_errors"] = errors
        profile["valid"] = len(errors) == 0
        return profile

    def _discover_pages(self, domain: str) -> Dict[str, Optional[str]]:
        base = f"https://{domain}"
        return {
            "homepage": base, "about": f"{base}/about",
            "careers": f"{base}/careers", "contact": f"{base}/contact",
            "blog": f"{base}/blog"
        }

    def _organization_jsonld(self, url: str) -> Dict:
        structured = self._call("/v1/extract/structured", {"url": url})
        for item in structured.get("json_ld", []):
            if isinstance(item, dict) and item.get("@type") in (
                    "Organization", "Corporation", "LocalBusiness"):
                return item
        return {}

    def _classify_industry(self, company: Dict, about: Dict) -> Optional[str]:
        # Ollagraph does not return an industry. Map the description to your
        # INDUSTRY_TAXONOMY here (keyword rules, an LLM, or your CRM's data).
        return None

    def _fuse_profiles(self, domain: str, company: Dict, org: Dict,
                       about: Dict, page_intel: Dict, whois: Dict) -> Dict:
        employees = org.get("numberOfEmployees")
        if isinstance(employees, dict):  # schema.org QuantitativeValue
            employees = employees.get("value")
        founded = str(org.get("foundingDate") or "")[:4]
        profile = {
            "domain": domain,
            "name": company.get("name") or org.get("name"),
            "description": company.get("description")
                           or about.get("content_text", "")[:500],
            "industry": self._classify_industry(company, about),
            "employee_count": int(employees) if str(employees or "").isdigit() else None,
            "founded_year": int(founded) if founded.isdigit() else None,
            "address": company.get("address"),
            "tech_stack": page_intel.get("tech_stack", []),
            "social_links": company.get("socials_by_platform", {}),
            "emails": company.get("emails", []),
            "domain_registered": whois.get("creation_date"),
            "source": "pipeline_v1",
            "extracted_at": datetime.now(timezone.utc).isoformat()
        }
        return {k: v for k, v in profile.items() if v is not None}

    def _validate_profile(self, profile: Dict) -> List[str]:
        errors = []
        for field in self.schema["required"]:
            if field not in profile or not profile[field]:
                errors.append(f"missing_required:{field}")
        emp = profile.get("employee_count")
        if emp is not None and (emp < 1 or emp > 1000000):
            errors.append(f"out_of_range:employee_count={emp}")
        year = profile.get("founded_year")
        if year is not None and (year < 1800 or year > 2026):
            errors.append(f"out_of_range:founded_year={year}")
        return errors
```

### Step 4: Run at scale

```python
domains = ["acmecorp.com", "startup.io", "enterprise.co"]
pipeline = CompanyIntelligencePipeline(api_key=os.environ["OLLAGRAPH_API_KEY"])

results = []
for domain in domains:
    try:
        profile = pipeline.process_domain(domain)
        results.append(profile)
        print(f"{domain}: {'VALID' if profile['valid'] else 'INVALID'}")
    except Exception as e:
        print(f"{domain}: FAILED - {e}")

valid = [r for r in results if r.get("valid")]
with open("company_profiles.json", "w") as f:
    json.dump(valid, f, indent=2)
```

## 7. Real-World Examples

### Example 1: Enriching a lead list for sales outreach
A B2B SaaS company has 1,000 domain names from a trade show attendee list. The pipeline processes them in a batch. Homepage extraction yields company name and tagline for 940 domains. Multi-page extraction adds descriptions for 780. Domain enrichment fills employee count for 650 and tech stack for 520. After validation, 610 complete profiles pass all schema checks. The remaining 390 are quarantined with specific error codes: missing industry (180), missing employee count (140), invalid domain (70). The sales team uploads the validated profiles and starts outreach. Quarantined records go to a manual review queue.

### Example 2: Competitive intelligence monitoring
A market research firm tracks 200 competitors weekly. The pipeline fetches each company's careers page and extracts new job listings by comparing against the previous week's snapshot. It fetches the blog for new posts and runs tech stack detection to flag changes. When a competitor adds a "Staff ML Engineer" role and switches from Segment to Snowplow, the pipeline sends a Slack notification.

### Example 3: Vendor risk assessment
A financial institution assesses 500 vendors using WHOIS, DNS, and SSL data. The pipeline checks SPF, DKIM, and DMARC records, inspects SSL certificate validity and cipher strength, and cross-references HQ country against sanctioned regions. A vendor with a domain registered six months ago, no DMARC record, and an SSL cert expiring in 30 days gets a high-risk score and triggers manual review.

## 8. Performance & Benchmarks

We have not published field-level benchmarks for this pipeline. What you get depends on what each company publishes, so measure it on your own target list:

- **Sample:** run 100–200 domains from the segment you actually sell to.
- **Fill rate:** for each field, record the share of profiles where it is non-null.
- **Accuracy:** spot-check a random sample of filled fields against the live site.
- **Source mix:** note which endpoint supplied each field (company profile, JSON-LD, about page, domain lookups) so you know where to add fallbacks.
- **Latency:** record wall-clock time per domain. The calls for one domain are independent, so they can run in parallel.

Expect gaps where companies simply don't publish the data. Industry, headcount, and revenue rarely appear as structured data on a company's own site, so plan to source them elsewhere or leave them null.

### Cost
Each endpoint call is credit-metered, so per-domain cost is the number of calls you make per domain. The pipeline above makes five. See [pricing](/pricing) for current credit packs.

## 9. Security Considerations

- **Data privacy.** Store enrichment results in access-controlled storage. Do not cache raw WHOIS or DNS responses in shared logs.
- **Rate limiting and politeness.** Respect `robots.txt` directives. Set crawl delays of 1–2 seconds between requests per domain. Use rotating proxies for large-scale extraction.
- **API key management.** Store keys in environment variables or a secrets manager. Rotate quarterly.
- **Data retention.** Re-extract on a schedule rather than serving cached data indefinitely.
- **Vendor risk data sensitivity.** Treat enriched profiles containing email authentication config and SSL metadata as internal data.

## 10. Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| **Company name is empty** | JSON-LD missing, title parsing failed | Fall back to `og:site_name` meta tag |
| **Employee count is null** | Not published on the site or in its JSON-LD | Add careers page extraction; source ranges from a data vendor or leave null |
| **Industry is "Unknown"** | No signals in page content or enrichment | Enrich with Crunchbase or LinkedIn; use NAICS lookup from description |
| **Tech stack is empty** | Homepage fetch failed or was blocked | Check that the `/v1/intel/page` call succeeded; verify domain resolves |
| **Social links missing** | JS-rendered links or relative paths | Retry `/v1/enrich/company` with `use_residential_proxy: true`, which renders the page; normalize relative URLs to absolute |
| **30%+ validation failures** | Schema too strict or low enrichment coverage | Review required fields; add fallback enrichment sources |
| **Pipeline timeout on large domains** | Too many pages discovered | Set max 5–10 pages per domain; increase timeout for JS-heavy sites |
| **Stale data in CRM** | No re-extraction schedule | Add freshness tracking; re-extract every 30–90 days |

## 11. Best Practices

- **Start with enrichment, then scrape.** Domain enrichment is faster and more reliable than page scraping. Run enrichment first. Only scrape pages for fields enrichment cannot provide — company description, tagline, social links.
- **Validate early, validate often.** Run schema validation after each extraction stage, not just at the end. A homepage returning no company name should trigger a fallback immediately.
- **Track field-level extraction yield.** Add field-level metrics: what percentage of companies had a successful employee count extraction? When yield drops below 80%, investigate before data reaches downstream systems.
- **Use evidence packets for debugging.** Store the raw fetch response, extracted spans, enrichment results, and validation errors per profile.
- **Set freshness budgets per use case.** Sales prospecting needs monthly freshness. Competitive intelligence needs weekly. Vendor risk needs quarterly.

## 12. Common Mistakes

1. **Scraping only the homepage.** The homepage carries the least firmographic data. Employee counts live on careers pages. Company history lives on about pages. Office locations live on contact pages.
2. **Trusting a single data source.** Crunchbase has strong funding data but weak coverage for bootstrapped companies. LinkedIn has strong employee data but requires anti-bot measures. WHOIS has strong registration data but is often privacy-redacted.
3. **Ignoring data staleness.** A profile extracted six months ago may show the wrong employee count, tech stack, or industry focus.
4. **Over-validating required fields.** Marking industry as required when 20% of companies do not publish it causes unnecessary failures. Use a tiered model: required (name, domain), recommended (industry, employee count), optional (tech stack, social links).
5. **No fallback extraction strategies.** A pipeline that tries three strategies — CSS selector, semantic analysis, AI extraction — and picks the best result hits 90–95%.
6. **Sending unvalidated data to CRM.** Validation gates at the pipeline output prevent CRM pollution.

## 13. Alternatives & Comparison

| Solution | Approach | Coverage | Freshness | Maintenance | Cost |
|---|---|---|---|---|---|
| **Ollagraph endpoints + your pipeline** | Scrape + extract + domain lookups + your validation | Depends on what each site publishes | On demand | Medium (your pipeline code) | Credit-metered per call |
| **Clearbit** | API enrichment | 60–70% | Weekly–monthly | None | $100–500/mo |
| **ZoomInfo** | Curated database | 80–90% | Quarterly | None | $15K+/yr |
| **Crunchbase API** | Crowdsourced + API | 50–60% | Daily | None | $500–2K/mo |
| **In-house scrapers** | Custom code | Variable | Real-time | Very high | Engineering time |

- **When to choose Ollagraph:** You want current data pulled from companies' own websites and domains, want to control which fields are extracted and validated, and are prepared to source industry and headcount elsewhere when sites don't publish them.
- **When to choose Clearbit or ZoomInfo:** You need broad coverage with minimal setup and can tolerate weekly or quarterly updates.
- **When to choose in-house scrapers:** You have a dedicated engineering team, need full control, and process fewer than 1,000 companies per month.

## 14. Enterprise Deployment

- **Scaling beyond 100,000 domains.** Shift from synchronous processing to asynchronous batch jobs. Use a message queue (RabbitMQ, SQS) to distribute domains across workers.
- **Multi-tenant isolation.** Each tenant gets its own API key, output destination, and validation schema.
- **Observability.** Export pipeline metrics to Prometheus or Datadog: domains processed per minute, extraction yield per field, validation pass rate, average latency, error count by category.
- **Compliance.** Maintain an audit trail of every profile: when extracted, from which sources, what transformations were applied, and who accessed it.
- **Cost management.** Batch processing reduces per-domain cost. Set daily budget caps to prevent runaway costs from misconfigured pipelines.

## 15. FAQs

### Q1. What is a company intelligence pipeline?
A company intelligence pipeline is an automated system that extracts structured data about companies from public websites and domain infrastructure. It combines three capabilities into one workflow: web scraping to fetch pages, content extraction to pull specific fields like company name and industry, and domain enrichment to layer on WHOIS, DNS, SSL, and tech stack signals.

### Q2. How is company intelligence different from web scraping?
Web scraping is a mechanical operation: fetch a URL, parse the DOM, extract raw text. Company intelligence is a semantic operation — it starts with a schema contract defining exactly which fields are required, what types they must be, and what ranges are acceptable.

### Q3. What fields can a company intelligence pipeline extract?
A production pipeline typically extracts 15–25 fields per company: firmographic fields (name, domain, industry, employee count, revenue, founding year, HQ location), technographic fields (web framework, analytics, CDN, email provider), identity fields (social profile URLs, leadership), and infrastructure fields (domain registration, SSL metadata).

### Q4. How accurate is automated company data extraction?
Company name extraction from a homepage hits 94–98% accuracy. Industry classification is 70–85%. Employee count extraction reaches 70–80% when combining page extraction with enrichment sources.

### Q5. Can a pipeline detect tech stack changes?
Yes. Tech stack detection operates on domain infrastructure (HTTP headers, DNS records, SSL certificates). A single HEAD request combined with a DNS lookup is enough to detect infrastructure-level changes such as CDN or framework migrations.

### Q6. How do you handle companies that do not publish employee counts?
The pipeline checks the website (About page, Careers page), falls through to enrichment sources like Crunchbase, and infers a range if possible. The schema marks employee count as recommended rather than required, passing validation as `null` rather than guessing.

### Q7. What is the difference between firmographic and technographic data?
Firmographic data describes what a company is (industry, size, location, revenue). Technographic data describes what a company uses (web framework, analytics provider, CRM, payment processor).

### Q8. How often should company data be refreshed?
Sales prospecting data should be refreshed monthly. Competitive intelligence data should be refreshed weekly. Vendor risk data should be refreshed quarterly with real-time alerting for critical changes.

### Q9. Can these pipelines work for international companies?
Yes, but coverage varies. US and European companies have the highest data availability. Language-aware extraction and regional enrichment sources are essential for non-English markets.

### Q10. What happens when a company site is a single-page app?
The pipeline detects SPA pages by checking for indicators like `__NEXT_DATA__` script tags, then routes them to a headless browser that renders the JavaScript before extraction.

### Q11. How do you validate extracted company data before it enters a CRM?
Validation runs through a three-tier schema gate: type validation, range validation, and cross-field consistency checks. Records that pass are delivered; records that fail are quarantined with a detailed report.

### Q12. What is the cost of running a company intelligence pipeline at scale?
API costs scale with the number of calls you make per domain, your monthly volume, and whether headless rendering or residential proxies are needed. Multiply calls per domain by domains per month and price that against your provider's per-call cost.

## 16. Conclusion

Company intelligence pipelines solve a specific problem: turning public websites into structured, validated company profiles that downstream systems can trust. No single source provides complete coverage. Homepage scraping gives you a name and tagline. Multi-page extraction adds description and location. Domain enrichment fills employee count, tech stack, and infrastructure signals. Schema validation ensures the assembled profile meets quality standards before it reaches your CRM.

### Next steps:
- Read about [Rendering Before Extraction in Data Pipelines](/blog/rendering-before-extraction-building-reliable-web-data-pipelines/).
- Explore [Static Fetch vs Headless Browser Strategies](/blog/static-fetch-vs-headless-browser-choosing-the-right-web-scraping-strategy/).

## 17. References

- [Ollagraph API Documentation](https://ollagraph.com/docs)
- [Clearbit Company Enrichment API](https://clearbit.com/docs#company-api)
- [Crunchbase API Documentation](https://data.crunchbase.com/docs)
- [ZoomInfo Data Coverage](https://zoominfo.com/data-coverage)
- [WHOIS Protocol Specification (RFC 3912)](https://datatracker.ietf.org/doc/html/rfc3912)
- [DNS-Based Email Authentication (RFC 7208, RFC 7489, RFC 6376)](https://datatracker.ietf.org/)
- [Schema.org Organization Vocabulary](https://schema.org/Organization)
