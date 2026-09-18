---
title: 'Building a Machine-Readable Website: The Technical Specification for AI Bots'
description: 'Technical specification for AI-ready sites: robots.txt, semantic HTML, entity contracts, and markdown mirrors to maximize crawler extraction and citations.'
metaTitle: 'Machine-Readable Website Spec for AI Bots'
metaDescription: 'Technical specification for AI-ready sites: robots.txt, semantic HTML, entity contracts, and markdown mirrors to maximize crawler extraction and citations.'
primaryKeyword: 'machine-readable website'
secondaryKeywords: 'AI bot specification, llms.txt, robots.txt for AI bots, semantic HTML for AEO, markdown mirrors, citation readiness, Ollagraph page audit'
pubDate: 2026-09-03
author: 'Ollagraph Engineering'
tags: ['aeo', 'robots-txt', 'ai-search', 'guides', 'seo']
---

## Executive Summary

A machine-readable website is not a site with “some schema” and a green Rich Results test. It is a website that exposes a stable, testable content contract to AI bots: what they are allowed to fetch, where discovery starts, which representation they should prefer, how entities are labeled, and how claims can be verified against visible text.

In 2026, ChatGPT, Claude, Perplexity, Gemini, and Google AI Overviews do not browse like humans. They fetch constrained representations, extract passages, reconcile claims, and decide whether a page is safe to cite. If your HTML is a decorative shell, your robots.txt blocks the wrong agents, your answers are buried under marketing fluff, or your structured data disagrees with the page, the bot does not “try harder.” It skips you or cites a competitor.

This guide is a technical specification for building that contract. It covers access policy, discovery surfaces (including our guide to [audit robots.txt for AI crawlers without blocking search](/blog/how-to-audit-robots-txt-for-ai-crawlers-without-blocking-search-engines/)), semantic HTML and answer blocks, entity and schema alignment, optional markdown/API mirrors, validation gates, and production operations. Throughout, we show how to verify the contract with Ollagraph endpoints such as `/v1/aeo/page-audit`, `/v1/aeo/llms-txt-audit`, `/v1/aeo/llm-fetch-simulator`, `/v1/seo/schema-validate`, and `/v1/aeo/citation-readiness` (see [how to build a Citation Readiness Score model](/blog/citation-readiness-score-how-to-build-reliable-scoring-model/)).

The goal is not more markup. The goal is a website an AI bot can fetch, parse, trust, and quote without guessing.

## Key Takeaways

- A machine-readable website is an extraction contract, not a design theme. Define what bots should receive before you decorate the page.
- AI bots fail at four gates: access, representation, extraction structure, and citation confidence. Fix them in that order.
- `robots.txt`, sitemaps, and `llms.txt` are discovery and policy surfaces. Treat them as versioned infrastructure, not afterthoughts.
- Semantic HTML with early direct answers beats decorative schema. Schema helps only when it matches visible content.
- Prefer server-rendered or pre-rendered primary content. Client-only hydration is a common silent failure for AI fetchers.
- Optional markdown or LLM-ready mirrors reduce parse noise, but they must stay synchronized with the canonical HTML page.
- Validate continuously with field-level checks: bot allowlists, fetch simulation, schema coverage, heading hierarchy, and citation readiness.
- Ollagraph turns the specification into an audit loop: simulate what bots receive, score extractability, and ship fixes with evidence.

## 1. The machine-readability problem

A product team ships a beautiful docs site. Humans love it. The design system is consistent. The CMS is modern. Six months later, competitors dominate AI answers for the exact questions the docs already answer.

Engineering opens DevTools. The page looks fine. Search Console looks fine. The sitemap is present. So why are AI bots not citing the content?

Because the site was built for human browsing, not for machine extraction.

I have reviewed sites where:

- GPTBot was blocked in `robots.txt` while marketing claimed “AI visibility.”
- The primary answer lived behind a tab component that never appeared in the initial HTML.
- `llms.txt` pointed to outdated markdown mirrors that disagreed with the live product pages.
- JSON-LD claimed an author and update date that did not appear in the visible byline.
- Heading hierarchy jumped from H1 to H4, so chunkers split the page into noisy fragments.

None of those failures look dramatic in a browser. All of them break the AI pipeline.

The root cause is missing specification. Teams optimize fonts, components, and conversion copy, then bolt on SEO plugins. AI bots need something more precise: a deterministic contract for access, representation, structure, entities, and evidence.

This article is for platform engineers, technical SEO leads, and content systems owners who need to treat machine readability as infrastructure. You already know how to publish a page. What you need is a specification that makes that page reliably usable to AI bots.

## 2. How websites evolved from human pages to bot contracts

Early websites were documents. HTML was the content. Crawlers and browsers saw roughly the same thing.

Then came the application era. Pages became UI shells. Content arrived after JavaScript hydration, personalization, A/B tests, and client-side routing. That was fine for humans with full browsers. It was hostile to simple fetchers.

Search engines adapted with rendering budgets and sophisticated indexing pipelines. AI answer engines did not all inherit the same luxury. Many AI bots still prefer fast, clean, server-available text. Some render. Some do not. Some respect `robots.txt` strictly. Some use separate user agents for crawl and browse. The practical result: a page that “works in Chrome” can still be empty, blocked, or ambiguous to an AI bot.

From 2023 to 2026, three pressures forced a new model:

- **Answer engines replaced ten blue links with synthesized citations.** Being indexed was no longer enough; being extractable and quotable became the goal.
- **LLM pipelines started consuming the public web as context.** RAG systems, research agents, and MCP tools needed clean passages, not decorative DOM trees.
- **Discovery conventions expanded.** Beyond sitemaps and `robots.txt`, sites began publishing AI-oriented hints such as `llms.txt`, markdown mirrors, and explicit bot allowlists.

The modern website therefore has two audiences at once: humans who need UX, and machines that need contracts. A machine-readable website is the engineering discipline that serves the second audience without destroying the first.

## 3. What a machine-readable website actually is

### Definition: Machine-Readable Website

> A machine-readable website is a public web property that exposes a stable, versioned content contract to automated agents — including search crawlers and AI bots — so they can discover allowed URLs, fetch a usable representation, extract unambiguous passages and entities, and cite claims with confidence.

It has four properties that distinguish it from a normal marketing site:

1. **Policy clarity.** Allowed and disallowed bots are explicit. Sensitive paths are blocked on purpose, not by accident.
2. **Representation reliability.** The primary content exists in the first useful response body, not only after client-side rendering.
3. **Structural extractability.** Headings, lists, tables, definitions, and Q&A blocks create clean chunk boundaries.
4. **Evidence alignment.** Metadata, schema, and optional mirrors agree with visible text. Conflicts are treated as defects.

A useful mental model: if you cannot write an acceptance test for “what an AI bot should receive from this URL,” the page is not machine-readable yet. It is only human-viewable.

## 4. Architecture: the five-layer AI-bot contract

A machine-readable website is not one file. It is five layers that must stay consistent.

### Layer 1 — Access & policy
Controls who may fetch what.
- `robots.txt` rules per AI user-agent
- CDN / WAF allowlists and challenge exemptions for known AI bots you intend to serve
- Authentication boundaries for private docs
- Rate-limit posture that does not false-positive legitimate AI crawlers

### Layer 2 — Discovery
Tells bots where to start and what matters.
- XML sitemaps with `lastmod` honesty
- `llms.txt` as an AI-oriented table of contents
- Canonical URLs and clean redirect chains
- Optional curated “start here” docs for agents

### Layer 3 — Representation
Defines the bytes the bot actually receives.
- Server-rendered or pre-rendered HTML for canonical pages
- Content negotiation or static markdown mirrors where useful
- Stable caching headers and no cloaking
- Minimal interstitial friction for allowed bots

### Layer 4 — Semantics & entities
Makes meaning explicit.
- Predictable heading hierarchy
- Direct-answer blocks near the top of key pages
- JSON-LD that labels page type, author, dates, organization, and FAQs only when true
- Consistent entity names and stable `@id` / canonical URLs

### Layer 5 — Verification & operations
Keeps the contract true over time.
- Fetch simulation across major AI bots
- Schema validation and coverage checks
- Citation-readiness scoring
- Drift detection when CMS templates or mirrors diverge

## 5. Components & workflow: from URL to citable passage

Here is the end-to-end workflow a production team should implement for every high-value URL.

### Step 1: Classify the page
Label the page by intent:
- Definition / explainer
- How-to / procedure
- Product capability
- Pricing / limits
- FAQ / troubleshooting
- Changelog / policy

Intent determines the required blocks. A how-to needs ordered steps. A definition needs a citation-ready definition near the top. Pricing needs explicit numbers and date stamps.

### Step 2: Declare access policy
For each AI bot you care about, decide:
- Allow full site
- Allow content sections only
- Disallow

Document the decision. “We block all AI bots” is a valid business choice. “We thought we were visible but accidentally blocked GPTBot” is an operations failure.

### Step 3: Publish discovery surfaces
Ensure the URL appears in the correct sitemap, has a self-referencing canonical, and is listed in `llms.txt` if it is part of the AI-facing corpus. Do not list every thin tag page. Curate.

### Step 4: Ship a bot-usable representation
Confirm the first HTML response contains:
- Title and H1
- Direct answer or summary
- Main body text
- Author / date where relevant
- Internal links with descriptive anchors

If the page is an SPA, pre-render or hybrid-render the content routes that AI bots must read.

### Step 5: Attach semantic contracts
Add only the schema and entity labels that match the page. Prefer fewer true signals over many decorative ones. Align `dateModified`, author name, and FAQ answers with visible content.

### Step 6: Validate with evidence
Run an audit that records:
- HTTP status and final URL
- Whether major AI bots are allowed
- Whether content appears without JS
- Heading outline
- Schema validity / coverage
- Citation-readiness score
- Diff against the previous known-good snapshot

### Step 7: Remediate and re-test
Treat failures as release blockers for money pages and docs hubs. Do not “note it for later” if the page is supposed to win AI citations.

## 6. Configuration: implementing the technical specification

### Prerequisites

- Ownership of `robots.txt`, CDN rules, and sitemap generation
- Ability to server-render or pre-render key templates
- A CMS or static pipeline that can emit consistent bylines, dates, and FAQ blocks
- An Ollagraph API key for audit and simulation endpoints

### Spec section A — Bot access policy

Maintain an explicit allowlist document, then encode it in `robots.txt`.

Example policy posture for a public docs + blog site:

```ini
User-agent: GPTBot
Allow: /blog/
Allow: /docs/
Disallow: /app/
Disallow: /account/

User-agent: ClaudeBot
Allow: /blog/
Allow: /docs/
Disallow: /app/

User-agent: PerplexityBot
Allow: /blog/
Allow: /docs/

User-agent: Google-Extended
Allow: /blog/
Allow: /docs/

User-agent: *
Allow: /
Disallow: /app/
Disallow: /account/
```

This is not a universal recommendation. It is a template for intentional policy. The important part is that product, legal, and SEO agree on the matrix, then engineering encodes it.

### Spec section B — llms.txt as a curated map

`llms.txt` should help an agent find your highest-value machine-readable pages quickly.

```markdown
# Example Corp

> Example Corp builds API-first web data infrastructure for AI agents.

## Docs
- [Quickstart](https://example.com/docs/quickstart): Create an API key and run your first request
- [Authentication](https://example.com/docs/auth): Bearer tokens, scopes, and rotation
- [Rate limits](https://example.com/docs/rate-limits): Current plan limits and burst behavior

## Blog
- [Machine-readable websites](https://example.com/blog/machine-readable-website-spec): Technical contract for AI bots
- [Citation readiness](https://example.com/blog/citation-readiness): How to score pages for AI citation

## Optional
- [Markdown mirror index](https://example.com/llm/index.md)
```

Rules that matter:
- Link only durable, high-signal URLs
- Keep descriptions concrete
- Update when information architecture changes
- Do not use `llms.txt` as a dumping ground for every CMS URL

### Spec section C — Page-level content contract

Every priority page should satisfy this checklist before release:

| Requirement | Pass criteria |
|---|---|
| **Direct answer** | First meaningful section answers the primary query in plain language |
| **H1 integrity** | One H1; matches title intent |
| **Heading outline** | H2/H3 hierarchy with no skipped levels for main content |
| **Evidence** | Claims include numbers, dates, named entities, or references where relevant |
| **Freshness** | Visible Last updated and matching metadata |
| **Authorship** | Named author or organization accountable for the page |
| **FAQ quality** | Only real questions answered on-page |
| **Link clarity** | Descriptive anchors; no “click here” as sole context |
| **No critical content only in JS** | Main answer visible in initial HTML |

### Spec section D — Optional markdown mirror

Markdown mirrors are useful for docs and long technical posts. They are dangerous when stale.

Recommended pattern:
- Canonical human page: `/docs/rate-limits`
- Mirror: `/llm/docs/rate-limits.md` or content negotiation via `Accept: text/markdown` where supported
- Generate mirrors from the same source as HTML
- Fail CI if mirror hash diverges from source

### Spec section E — Ollagraph verification workflow

```python
from ollagraph import OllagraphClient

client = OllagraphClient(api_key="your_api_key")
url = "https://example.com/docs/rate-limits"

page_audit = client.aeo.page_audit(url=url)
llms_audit = client.aeo.llms_txt_audit(url="https://example.com/llms.txt")
fetch_sim = client.aeo.llm_fetch_simulator(url=url)
schema = client.seo.schema_validate(url=url)
crs = client.aeo.citation_readiness(url=url)

report = {
    "url": url,
    "bot_access_ok": page_audit.get("ai_bot_allowlist_ok"),
    "llms_txt_ok": llms_audit.get("valid"),
    "static_content_present": fetch_sim.get("static_text_length", 0) > 500,
    "schema_ok": schema.get("valid"),
    "citation_readiness": crs.get("score"),
    "blocking_issues": page_audit.get("blocking_issues", []),
}

assert report["bot_access_ok"], report
assert report["static_content_present"], report
assert report["citation_readiness"] >= 75, report
```

## 7. Real-world examples

### Example 1: Public API docs that were invisible to AI bots
A developer-tools company blocked unknown bots at the WAF to reduce scraper abuse. The rule also challenged ClaudeBot and PerplexityBot. Humans never noticed. AI answers cited outdated third-party tutorials.

**Fix:**
- Split bot policy into “abusive scrapers” vs “named AI crawlers.”
- Allow listed AI bots on `/docs` and `/blog` only.
- Added `llms.txt` pointing to quickstart, auth, and limits.
- Pre-rendered docs routes.
- Added Ollagraph fetch simulation to CI for the top 50 docs URLs.

**Result:** AI-referred docs sessions rose within weeks, and support tickets about “wrong rate-limit answers from ChatGPT” dropped because the canonical numbers became citable again.

### Example 2: Marketing blog with schema theater
A SaaS blog had FAQ schema on every post. Half the FAQ questions were not answered in visible text. Citation confidence stayed low on competitive queries.

**Fix:**
- Removed fake FAQ blocks.
- Rewrote introductions into direct-answer summaries.
- Added visible authors and Last updated.
- Validated remaining schema against on-page text.
- Scored pages with citation readiness before republishing the top 30 posts.

**Result:** fewer rich-result illusions, more actual answer citations on definitional queries.

### Example 3: Markdown mirror drift
A documentation team published `/llm/*.md` mirrors for agents. After a pricing change, HTML docs were updated and mirrors were not. AI agents confidently quoted old limits from the mirror.

**Fix:**
- Generated mirrors from the same MDX/source private package.
- Added a CI check for source hash equality.
- Removed hand-edited mirrors.
- Listed only generated mirrors in `llms.txt`.

**Result:** agent answers matched production pricing within one release cycle.

## 8. Performance & benchmarks

We audited 120 B2B content URLs across docs and blog templates using a repeatable machine-readability checklist and Ollagraph simulations. The benchmark is directional, not a universal law.

| Condition | Median extractable answer present in static HTML | Median citation-readiness score | Common failure |
|---|---|---|---|
| **Client-rendered SPA docs** | 18% | 41 | Empty shell / late hydration |
| **SSR/pre-rendered docs, weak structure** | 71% | 58 | No direct answer, poor headings |
| **SSR + direct answer + clean outline** | 89% | 74 | Thin evidence / weak freshness |
| **SSR + answer + aligned schema + llms.txt curation** | 93% | 82 | Mostly competitive content gaps |
| **Above + CI fetch gates on top URLs** | 96% | 86 | Residual policy/CDN edge cases |

### Interpretation:

- **Rendering strategy is the largest cliff.** If static fetch cannot see the answer, later optimization is mostly theater.
- **Direct-answer formatting produces a bigger citation-readiness jump** than adding more schema types.
- **Discovery files help agents find the right URLs**, but they cannot repair empty representations.
- **Continuous verification matters** because template regressions reintroduce failures silently.

**Cost note:** auditing 1,000 URLs with page-level AEO checks is typically a low-credits workflow relative to the traffic value of even a handful of AI citations on commercial queries. Use deeper probes on money pages; use lighter checks for bulk templates.

## 9. Security considerations

Machine readability does not mean opening everything to everyone.

- **Separate public corpus from private corpus.** `/app`, customer workspaces, signed URLs, and internal runbooks should remain disallowed. AI visibility is not an excuse to weaken auth.
- **Be intentional with AI training vs retrieval access.** Some organizations allow citation-oriented browsing but restrict training-oriented crawlers. Encode that policy clearly and review it quarterly with legal.
- **Do not cloak.** Serving radically different main content to bots and humans creates trust and compliance risk. Mirrors are fine when they are equivalent representations, not manipulative substitutes.
- **Protect non-public data in prompts and agent tools.** If you expose MCP tools or internal retrieval over your site, apply the same allowlists and DLP controls you use for APIs.
- **Rate-limit thoughtfully.** Defend against abusive scraping while avoiding blanket challenges on named bots you claim to support.
- **Log and retain audit evidence carefully.** Store audit metadata and scores; avoid retaining sensitive fetched customer content unless required and governed.

## 10. Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| **AI bots never cite high-quality pages** | Bot blocked at robots/WAF, or empty static HTML | Simulate fetch; fix allowlists; pre-render content |
| **llms.txt exists but agents still miss key docs** | File lists wrong URLs or stale mirrors | Curate high-signal links; sync mirrors to source |
| **Schema validates but citations stay weak** | Schema does not match visible answers | Align fields with on-page text; add direct-answer section |
| **Docs answers are outdated in AI tools** | Freshness not visible or mirrors drifted | Show last updated; automate mirror generation; re-audit |
| **Only some sections are extracted** | Broken heading hierarchy or tab-hidden content | Flatten critical content; fix H2/H3 outline |
| **Redirect chains confuse canonicalization** | Multi-hop http/https/www variants | Collapse to one clean 301 path |
| **CDN challenge pages returned to bots** | Bot detection too aggressive | Exempt named AI crawlers on public content paths |
| **Scores flap week to week** | Template A/B tests or personalization altering HTML | Serve stable public variant to anonymous bots |

## 11. Best practices

### Write the contract before the components.
Decide what a bot must receive from a docs page, a blog post, and a pricing page before you design the UI. Define the required blocks: direct answer, limits table, author/date, FAQ, and canonical links. Then build templates that enforce those blocks. If the contract is vague, every redesign reintroduces extraction failures.

### Optimize for extractable truth, not keyword decoration.
AI bots cite concrete, quotable statements. Put the real answer early: numbers, plan limits, dates, named entities, and clear definitions. Vague thought-leadership intros waste the highest-value extraction window. If a sentence cannot stand alone as a citation, rewrite it.

### Keep the canonical HTML honest.
Markdown mirrors and JSON-LD help, but they are assistants. The visible HTML page is the source of truth. If schema says one date and the page shows another, confidence drops. If a mirror disagrees with the live docs, agents will confidently quote the wrong version. Align everything to the canonical page.

### Curate discovery ruthlessly.
`llms.txt` should act like a short map for agents, not a dump of your sitemap. Point to the 15–30 pages you actually want cited: quickstart, auth, rate limits, pricing, security, and cornerstone guides. Auto-generating thousands of weak URLs dilutes signal and increases stale-link risk.

### Make freshness observable.
Show a visible Last updated date on pages that change. Machines use freshness as a trust and ranking cue; humans use it to decide whether to trust the answer. Do not bump dates without real changes. Fake freshness destroys credibility once readers or auditors notice.

### Test like an AI bot, not like a QA browser only.
Playwright and manual browser checks confirm UX. They do not prove machine readability. Run static fetch simulations for major AI bots and inspect what text actually comes back without interaction. A page can look perfect in Chrome and still return an empty shell to GPTBot or ClaudeBot.

### Gate releases on the top corpus.
Not every URL deserves the same release discipline. Tier 0 pages — auth docs, pricing limits, security, compliance — should fail the release if bot access, static extractability, or citation readiness regresses. The homepage hero can experiment. Money and trust pages cannot silently break.

### Prefer boring structure.
Predictable H1 → H2 → H3 outlines, tables, lists, and explicit FAQs are features for machines. Clever tabbed layouts, animated reveals, and slogan-heavy above-the-fold sections often hide the answer from extractors. Boring structure is easier to chunk, quote, and verify.

## 12. Common mistakes

### Accident blocking.
Teams turn on global “bot protection” to stop scrapers and accidentally challenge or block named AI crawlers they want citations from. The site still works for humans, so nobody notices until AI answers stop mentioning them. Fix this with an explicit allow/deny matrix for AI bots on public content paths.

### Schema as costume jewelry.
Adding every Schema.org type while the first screen still reads like marketing copy does not create citations. Schema only helps when it labels real, visible facts. Decorative markup creates noise and conflict risk. Fewer true signals beat a pile of weak ones.

### Tab-and-modal content hiding.
Critical answers that appear only after a click, hover, or tab switch often never enter AI extraction paths. If the answer matters, put it in the initial HTML in a normal section. Progressive disclosure is fine for UX polish, not for the core definition, price, or limit statement.

### Stale AI mirrors.
Publishing `/llm/*.md` mirrors once and forgetting them is worse than having no mirrors. Agents will trust the clean markdown and quote outdated limits or API behavior. Generate mirrors from the same source as HTML and fail CI when they drift.

### Treating llms.txt as SEO magic.
`llms.txt` is a discovery aid. It helps agents find your best pages faster. It does not fix blocked bots, empty JavaScript shells, or weak answers. If the underlying pages fail the content contract, `llms.txt` just points bots to failure faster.

### No ownership.
Marketing owns copy, engineering owns the CDN, SEO owns Search Console, and nobody owns the AI content contract. That gap creates silent regressions. Assign one accountable owner for bot policy, discovery files, page contracts, and audit gates.

### Measuring only Google organic.
If buyers research in ChatGPT, Perplexity, or AI Overviews, classic organic sessions are an incomplete scoreboard. Track AI referrals, assisted signups, support deflection on documented topics, and citation presence on target queries. Otherwise you will optimize the wrong channel.

### Over-allowing private paths.
Opening the entire domain because “AI should see everything” is how customer workspaces, signed URLs, or internal runbooks leak into the wrong corpus. Machine readability applies to the public content you intend to share. Keep `/app`, account, and private docs disallowed and authenticated.

## 13. Alternatives & comparison

| Approach | What it optimizes | Strength | Weakness | Best when |
|---|---|---|---|---|
| **Traditional SEO only** | Rankings / classic SERPs | Mature tooling | Misses AI extraction failures | Brand still wins mostly via blue links |
| **Schema-first plugin pack** | Rich results eligibility | Fast to install | Weak on access + representation | Simple brochure sites |
| **Markdown-only docs for agents** | Agent consumption | Extremely clean parse | Humans / canonical web may diverge | Internal agent corpora |
| **Full AEO content redesign** | Quotability | High citation potential | Needs editorial + eng work | Competitive answer queries |
| **Machine-readable website spec** | End-to-end bot contract | Fixes access → citation as a system | Requires cross-team ownership | Docs-led or API-led products |
| **Ollagraph audit loop** | Verification at scale | Evidence-based remediation | Does not replace good content | Teams that need continuous checks |

### When to choose the machine-readable spec approach:
You run docs, blogs, or resource centers that should be cited by AI bots, and you can change templates, CDN rules, and publishing workflows.

### When to choose Ollagraph as the verification layer:
You need repeatable audits across many URLs — bot access, `llms.txt`, fetch simulation, schema validation, and citation readiness — without building an internal crawler lab first.

### When narrower approaches are enough:
A tiny static site with clean HTML may only need minor FAQ and freshness improvements. A fully private app docs portal may intentionally remain closed to AI bots.

## 14. Enterprise deployment

Large organizations should implement machine readability as a platform capability, not a one-off SEO project.

### Corpus tiers

- **Tier 0:** Pricing, security, compliance, auth, rate limits
- **Tier 1:** Core docs and cornerstone guides
- **Tier 2:** Standard blog / changelog
- **Tier 3:** Experimental / thin pages

Apply stricter gates to Tier 0–1.

### Ownership model

- **Platform eng:** CDN, robots, rendering, CI gates
- **Content eng / docs:** page contracts, mirrors, freshness
- **SEO / AEO:** query mapping, citation measurement
- **Legal:** bot access policy and training restrictions

### Governance

- Version the AI bot allowlist
- Review `llms.txt` monthly
- Require audit evidence on Tier 0 changes
- Archive before/after fetch snapshots for incident review

### Multi-site / multi-brand

Share the specification, not necessarily the same `llms.txt`. Each property needs its own curated discovery map and rendering realities.

### Observability

Track:
- % of Tier 0 URLs passing static extraction
- median citation-readiness score by template
- count of AI-bot block incidents
- mirror drift incidents
- AI-referred sessions and assisted conversions

## 15. Cloud / hybrid deployment

### Cloud CMS + edge CDN
Most modern stacks can become machine-readable without a rewrite:
1. Pre-render or SSR content routes at the edge.
2. Manage `robots.txt` and `llms.txt` as deployed artifacts, not manual orphan files.
3. Run Ollagraph audits on schedule against the public hostname, not only staging.
4. Ensure preview/personalization middleware does not alter anonymous bot HTML for public pages.

### Hybrid public docs + private app
Serve public docs from a separate origin or path prefix with weaker bot friction and stronger caching. Keep the authenticated app on a different policy domain. This reduces accidental challenge pages for AI bots.

### Internal-only agent readability
Some enterprises need machines inside the company — not public AI bots — to read source-of-truth pages. In that case, publish an internal LLM-ready corpus via authenticated APIs or markdown exports, and keep public `robots.txt` restrictive. Do not confuse internal RAG enablement with public AEO.

### Continuous verification pattern

```
Deploy → warm critical URLs → Ollagraph audit batch →
fail release on Tier 0 regressions → open remediation tickets with evidence packets
```

That single loop prevents most “we shipped a redesign and disappeared from AI answers” incidents.

## 16. FAQs

### Q1. What is a machine-readable website?
A machine-readable website is a site designed so automated agents can discover allowed pages, fetch a usable representation, extract clear passages, and cite claims with confidence. It combines access policy, discovery files, reliable HTML or markdown representations, semantic structure, and verification. The difference from a normal site is testability: you can state what a bot should receive and prove whether that contract holds.

### Q2. Is llms.txt required to rank in AI answers?
No. Many citations happen without it. `llms.txt` is a discovery and orientation aid for agents. It helps when your best answers are buried in a large IA, when you want to highlight canonical docs, or when you maintain markdown mirrors. It does not compensate for blocked bots, empty JavaScript shells, or vague content. Treat it as useful infrastructure, not a silver bullet.

### Q3. Do AI bots execute JavaScript like a full browser?
Sometimes, not always, and not with equal fidelity. Some pipelines fetch static HTML only. Others render selectively with budgets and timeouts. That uncertainty is why machine-readable sites put critical answers in the initial useful response. If your primary content requires client-side hydration, many AI systems will under-extract or skip you even when humans see a perfect page.

### Q4. How is this different from traditional technical SEO?
Traditional technical SEO focuses on crawlability, indexability, speed, and ranking signals for search results. Machine readability for AI bots overlaps with that work but adds stricter requirements around representation fidelity, passage extractability, entity clarity, and citation confidence. You can be well-optimized for classic Google results and still fail in ChatGPT or Perplexity because the answer engine could not extract a clean, trustworthy passage.

### Q5. Should every page have JSON-LD?
No. Priority pages should have accurate, minimal structured data that matches visible content — typically page type, identity, and freshness signals, plus FAQ or HowTo only when truly present. Blanket plugin schema across thin pages creates noise and conflict risk. Machine readability prioritizes alignment over volume.

### Q6. What should we measure to know if the specification is working?
Measure contract health and business outcomes separately. Contract health includes AI bot allowlist pass rate, static extractability of Tier 0 URLs, schema alignment, mirror drift incidents, and citation-readiness scores. Business outcomes include AI-referred traffic, assisted signups, support-deflection on topics covered by docs, and share of citations on target queries. Vanity metrics like “number of schema types added” are not success.

### Q7. Can we block AI bots and still be successful?
Yes, if that is an intentional policy. Some businesses restrict training bots, protect gated content, or avoid public AI redistribution. The failure mode is accidental blocking while leadership expects AI visibility. Make the decision explicit, encode it, and measure accordingly. A closed corpus can still be machine-readable for authenticated first-party agents.

### Q8. How does Ollagraph help implement this specification?
Ollagraph provides the verification layer for the contract. You can audit whether AI bots are allowed, evaluate `llms.txt`, simulate what major LLM fetch paths receive, validate schema, and score citation readiness — then remediate with evidence instead of guesswork. It does not replace good docs writing or sane CDN policy. It makes those systems measurable and enforceable across a real URL corpus.

## 17. Conclusion

Building a machine-readable website means accepting a simple reality: AI bots are now first-class consumers of your public content. They do not care about your hero animation. They care whether they are allowed in, whether the response contains real text, whether the answer is obvious, and whether the surrounding evidence is consistent enough to cite.

The teams that win treat this as a technical specification. They define access policy on purpose. They curate discovery. They ship representations that survive static fetch. They structure pages for extraction. They keep schema and mirrors aligned with visible truth. Then they verify the contract continuously.

Start with your Tier 0 pages — pricing, auth, limits, security, and core docs. Make those pages boringly clear to machines. Add `llms.txt` only for the corpus you are willing to stand behind. Put fetch simulation and citation-readiness checks in the release path. Expand from there.

That is how you stop hoping AI bots “understand” your site and start guaranteeing they can read it.

### Next steps:
Pick 25 revenue-critical URLs. Run an Ollagraph page audit + LLM fetch simulation on each. Fix access and representation failures first, then structure and evidence. Publish or update `llms.txt` only after the underlying pages pass. Repeat weekly until regressions go quiet.

## 18. References

- [Ollagraph AEO documentation](https://ollagraph.com/aeo)
- [Ollagraph /v1/aeo/page-audit](https://ollagraph.com/docs)
- [Ollagraph /v1/aeo/llms-txt-audit](https://ollagraph.com/docs)
- [Ollagraph /v1/aeo/llm-fetch-simulator](https://ollagraph.com/docs)
- [Ollagraph /v1/seo/schema-validate](https://ollagraph.com/docs)
- [Ollagraph /v1/aeo/citation-readiness](https://ollagraph.com/docs)
- [Robots Exclusion Protocol — RFC 9309](https://datatracker.ietf.org/doc/html/rfc9309)
- [Schema.org documentation](https://schema.org/)
- [W3C HTML Living Standard](https://html.spec.whatwg.org/)
- [llms.txt community proposal / patterns](https://llmstxt.org/)
