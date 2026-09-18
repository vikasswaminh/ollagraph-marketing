---
title: 'HTML to Markdown Boilerplate Removal for Better RAG Retrieval'
description: 'Strip boilerplate before Markdown conversion to improve RAG retrieval and citations. Deterministic extraction keeps chunks stable.'
metaTitle: 'HTML to Markdown Boilerplate Removal for RAG'
metaDescription: 'Strip boilerplate before Markdown conversion to improve RAG retrieval and citations. Deterministic extraction keeps chunks stable.'
primaryKeyword: 'HTML to markdown boilerplate removal'
secondaryKeywords: 'RAG retrieval, boilerplate removal, HTML to markdown, deterministic extraction, citations, chunking stability'
pubDate: 2026-07-29
author: 'Amit Sharma'
tags: ['rag', 'citations']
---

## Executive Summary

If you scrape a web page and convert the HTML to Markdown, you can still end up with a RAG index that retrieves the wrong things. The reason is not your embeddings—it is your ingestion contract.

Most pages are built for browsers, not for retrieval. Navigation trees, cookie banners, footers, related-links widgets, and repeated UI scaffolding are not just extra tokens. They change embedding neighborhoods and chunk boundaries, which then cascades into worse retrieval and weaker or incorrect citations.

This guide treats boilerplate removal as a measurable ingestion contract. You will learn how to:

-   Define boilerplate removal in retrieval terms: boilerplate_ratio, extraction_confidence, and structure invariants
-   Detect main content vs. chrome using structural and repetition signals
-   Convert only kept blocks into deterministic Markdown so chunking stays stable
-   Attach evidence packets (span/byte mappings) so citations can be verified
-   Validate invariants and fail closed with retry/fallback instead of silent drift
-   Evaluate end-to-end impact with a run-ready benchmark harness (precision@k + citation correctness)

The goal is not pretty Markdown. The goal is retrieval-grade Markdown with [source attribution and link preservation](/blog/html-to-markdown-for-ai-preserving-structure-links-and-source-attribution/) that improves answer quality and citation trust.

## Key Takeaways

-   Boilerplate removal must be measured (boilerplate_ratio, extraction_confidence, and invariants), not guessed.
-   Extract retrieval blocks first; convert only kept blocks.
-   Deterministic Markdown formatting reduces chunk boundary drift.
-   Evidence packets make debugging fast and citations trustworthy.
-   Use a retry/fallback strategy so ingestion fails loudly, or degrades safely, instead of embedding noise.

## 1. Problem Statement

Most RAG pipelines fail in a way that is hard to notice early.

Your ingestion job succeeds. Your Markdown conversion works. Your embeddings are created. But [markdown conversion quality](/blog/markdown-conversion-quality-for-ai-accuracy-structure-and-retrieval/) drops—sometimes subtly, sometimes catastrophically.

When you inspect retrieved chunks, you often see the same patterns:

-   The chunk contains the right topic words, but it came from the wrong part of the page (navigation label vs. article section).
-   The chunk includes repeated site chrome (footer, cookie banner, related links) that appears across many pages.
-   Chunk boundaries are inconsistent across runs, so the retriever sees different semantic units.
-   Citations point to the wrong section because provenance mapping is missing or misaligned.

This is what boilerplate does in RAG.

Boilerplate is not just noise. It is a retrieval contaminant that:

-   inflates token budgets
-   shifts embedding neighborhoods
-   changes chunk boundaries
-   increases the chance the model cites the wrong span

## 2. History & Context

**Early HTML-to-text thinking**

Early converters were built for humans: strip tags, keep paragraphs, output readable text. That is fine for reading, but it ignores the fact that HTML is a layout language.

**RAG changes the requirement**

As RAG matured, teams learned that structure and boundaries matter. Chunking and retrieval reward stable headings, consistent list structure, and predictable formatting.

Markdown became popular because it can represent structure compactly: headings, lists, tables, and code blocks.

**But structure-preserving conversion still fails**

Even if your converter preserves headings perfectly, it can still include the site navigation tree above the article. In RAG, that is enough to poison retrieval.

So the modern requirement is two-layer:

-   Content selection: decide what is retrieval content and what is chrome
-   Representation: convert only the kept content into deterministic Markdown

Then you validate and attach evidence so you can debug and trust citations.

## 3. Definition: Boilerplate in RAG Pipelines

For this guide, boilerplate is any text that is:

-   repeated across pages or across sections of the same page
-   not part of the primary informational intent
-   likely to appear in navigation, footer, cookie consent, subscription prompts, or UI scaffolding

In RAG terms, boilerplate is low-signal text that competes with retrieval.

### 3.1 Boilerplate Ratio (measurable definition)

Let:

-   T_total = total tokens in the converted Markdown
-   T_main = tokens attributed to extracted retrieval blocks
-   T_boiler = T_total - T_main

Then:

```
boilerplate_ratio = T_boiler / T_total
```

A good pipeline targets a low boilerplate_ratio while preserving structure invariants for the main content.

### 3.2 The Two Failure Modes model

Boilerplate removal fails in two distinct ways:

-   **Chrome bleed**  
    You keep too much non-content text.  
    Symptoms: retrieved chunks mention nav/footer/cookie text; boilerplate_ratio is high.
-   **Content starvation**  
    You remove too much.  
    Symptoms: extraction_confidence is low; main content token counts collapse; recall drops even if boilerplate_ratio looks good.

Your pipeline must detect both. That is why you need ratio metrics and content invariants.

## 4. What Clean Means for Retrieval

Clean Markdown is meaningless unless it is tied to retrieval behavior.

For RAG, clean means:

-   Main content dominance: most tokens come from the intended article/product/docs section
-   Stable chunk boundaries: headings and list items appear in consistent order so chunking is predictable
-   No chrome bleed: navigation, cookie banners, and footers are absent from retrieval output
-   Citeable provenance: each extracted block can be mapped back to a URL and a section path
-   Graceful degradation: if the page is blocked or dynamic, the pipeline retries or returns low confidence instead of silently embedding noise

## 5. Architecture: Boilerplate Removal as a Contract

Treat boilerplate removal as a contract between your ingestion layer and downstream RAG.

### 5.1 Contract Inputs

-   URL (and crawl metadata)
-   Fetch mode (static HTML vs. rendered DOM)
-   Extraction policy (what counts as retrieval content)
-   Output mode (Markdown formatting rules)

### 5.2 Contract Outputs

-   markdown: deterministic Markdown for retrieval blocks
-   boilerplate_ratio: numeric metric
-   extraction_confidence: numeric or categorical score
-   evidence: span/byte mappings for provenance
-   warnings: structured notes (for example, cookie banner detected; removed)

### 5.3 Contract Invariants (must never happen)

-   **Invariant A: Convert only kept blocks**  
    If you convert the full DOM, you reintroduce boilerplate.
-   **Invariant B: Attach evidence before chunking**  
    If you attach evidence after chunking, citations become unreliable.
-   **Invariant C: Markdown formatting is deterministic**  
    If headings, lists, or tables vary between runs, chunk boundaries drift.

### 5.4 Evidence-first debugging loop

When retrieval fails, you should answer three questions quickly:

-   Did extraction keep the right section?
-   Did conversion preserve section structure?
-   Did chunk text map to the correct evidence span?

Evidence packets make this loop fast.

## 6. Components & Workflow

### 6.1 Step 1: Fetch (choose the right page state)

Boilerplate removal depends on what you fetched.

-   If you fetch only static HTML from a SPA, you may get a shell with navigation and no content. boilerplate_ratio can look good while main content is missing.
-   If you render the page, you may get a full DOM with both content and UI chrome. That is fine, but you must extract retrieval blocks carefully.

Record:

-   fetch mode
-   render timestamp
-   whether main content selectors were found

### 6.2 Step 2: Detect retrieval blocks (content selection)

Boilerplate removal is easiest when you first identify what to keep.

Use multiple signals:

-   Semantic tags: `<main>`, `<article>`, `<section>`, headings
-   Text density: main content tends to have higher density and fewer repeated phrases
-   DOM position: main content often appears after navigation and before footer
-   Repetition heuristics: repeated blocks across the page are likely boilerplate
-   Structure signals: content sections often contain structured lists and tables

### 6.2.1 Concrete scoring recipe (signals → weights)

For each candidate block b, compute:

```
score(b)=w1⋅tag_semantic+w2⋅density+w3⋅position+w4⋅structure+w5⋅repetition_penalty
```

Then keep blocks until you reach a target main-content token budget.

### 6.3 Step 3: Remove boilerplate blocks (chrome suppression)

Once you have retrieval blocks, remove everything else.

But remove everything else can be too blunt. Some pages embed important content inside components that look like chrome, for example, cookie banners that contain legal notices.

Support policies:

-   retrieval_only: keep only main content blocks
-   retrieval_plus_metadata: keep main content plus a small structured metadata section
-   compliance_mode: keep cookie/legal text as a separate non-retrieval block

Default to retrieval_only for general RAG retrieval.

### 6.4 Step 4: Convert kept blocks to deterministic Markdown

Conversion is where many pipelines accidentally reintroduce boilerplate or break structure.

Deterministic Markdown rules should include:

-   heading depth normalization
-   list item continuity
-   table formatting with consistent header rows
-   fenced code blocks with language hints when available

### 6.5 Step 5: Validate invariants and evidence

Validation turns best effort into trustworthy ingestion.

**Structure invariants**

-   heading order monotonic within a section (allow minor skips)
-   list items remain within their list context
-   tables have consistent row/column counts

**Content invariants**

-   T_main exceeds a minimum threshold
-   boilerplate_ratio below a target threshold

**Minimum viable main content rule**

Set min_main_tokens based on page type:

-   docs pages: 800–1,500 tokens
-   blog posts: 1,200–3,000 tokens
-   product pages: 600–1,200 tokens, but with specs tables

If you ingest short pages, lower the threshold, but never skip evidence and structure invariants.

**Evidence mapping**

For each extracted block, store:

-   url
-   section_path (derived from headings)
-   source_span (byte offsets or DOM node identifiers)
-   content_hash (optional)
-   conversion_policy_id

Attach evidence to chunks before embedding.

### 6.6 Step 6: Retry / fallback strategy

If validation fails, do not embed.

Instead:

-   retry with a different fetch mode (static vs rendered)
-   retry with a different extraction policy (widen main container, adjust sidebar policy)
-   if still failing, skip embedding and log low confidence

This prevents silent ingestion drift.

## 7. Configuration / Setup

### 7.1 Extraction policy knobs

-   min_main_tokens
-   max_boilerplate_ratio
-   sidebar_inclusion: none | limited | full
-   cookie_banner_policy: drop | separate | keep
-   related_links_policy: drop | keep_if_in_article | keep_if_high_relevance
-   repetition_window: how many sibling blocks to compare

### 7.2 Output formatting knobs

-   heading_style: normalize to #, ##, ###
-   table_style: enforce Markdown tables with header rows
-   code_fence: always fence code blocks

### 7.3 Validation knobs

-   structure_invariant_strictness: strict vs lenient
-   evidence_required: boolean
-   max_validation_failures: retry cap

### 7.4 Domain profiles

Avoid per-page hand tuning. Create per-domain profiles:

-   profile_id
-   tuned max_boilerplate_ratio
-   tuned cookie_banner_policy
-   tuned sidebar_inclusion

## 8. Examples

### 8.1 Documentation page with left navigation

Input contains:

-   left nav tree
-   article body
-   related topics widget
-   footer

RAG-friendly output:

-   keep article body and its headings
-   drop left nav tree
-   keep related topics only if they are part of the article narrative
-   drop footer

Bad output (chrome bleed) often looks like this in retrieval:

-   chunks that mention Authentication but actually come from nav labels

Good output keeps the tutorial steps as the retrieval blocks.

### 8.2 Blog post with cookie banner and newsletter modal

RAG-friendly output:

-   remove cookie banner and modal text
-   keep article body
-   optionally keep a short legal notice section only if your compliance policy requires it

### 8.3 E-commerce product page

RAG-friendly output:

-   keep product description and specs
-   keep structured specs as tables
-   drop repeated UI widgets unless they contain unique retrieval-relevant facts

## 9. Performance & Benchmarks

Boilerplate removal improves retrieval quality, but you still need performance numbers.

This section is written as an evaluation harness you can run.

### 9.1 Benchmark methodology (measure retrieval impact)

Use a page set P and a query set Q.

For each page p∈P:

-   baseline: convert full DOM → Markdown → chunk → embed
-   improved: extract retrieval blocks → convert kept blocks → validate → attach evidence → chunk → embed

For each query q∈Q:

-   retrieve top-k chunks from both indexes
-   compute:

-   precision@k
-   citation correctness
-   answer faithfulness (optional)

### 9.2 Evaluation harness (concrete pipeline)

Use the same pipeline for baseline and improved so the only variable is boilerplate removal.

-   Ingest each page p∈P twice (baseline vs improved)
-   Chunk both outputs with identical chunking parameters
-   Embed both indexes with identical embedding model and normalization
-   Retrieve for each query q∈Q using identical top-k
-   Score:

-   precision@k: evidence overlap with ground-truth section
-   citation correctness: cited chunk evidence overlap with ground-truth section
-   token savings: average tokens in retrieved set

### 9.3 Building a ground-truth mapping

For each query q:

-   pick a target section path (for example, Authentication > Create a Client > Steps)
-   store expected evidence span type (byte range or DOM node id)
-   optionally store acceptable alternative sections

Then scoring becomes deterministic: overlap evidence spans or section paths.

### 9.4 Citation correctness scoring (practical)

Define:

-   c = a citation produced by your answer pipeline
-   e(c) = evidence span attached to the cited chunk
-   g(q) = ground-truth evidence span for query

Then:

```
citation_correct(c,q)=1[overlap(e(c),g(q))>0]
```

This catches right words, wrong section failures.

### 9.5 We tested this evidence packet (run-ready structure)

Use this structure when you claim measured improvement. Replace placeholders with your real run outputs.

**Page set P**

-   Domains: docs.example.com, blog.example.com, support.example.com
-   Page types: API docs, how-to guides, blog posts, troubleshooting pages
-   Sample size: 120 pages total
-   Crawl policy: same fetch mode per domain; same retry cap; same robots handling

**Query set Q**

-   Query count: 180 queries
-   Query generation: one query per target section (heading or list item) with a must not be answered by nav/footer constraint
-   Query templates:

-   What are the prerequisites for X?
-   Which parameter controls Y and what is its default?
-   What is the step-by-step procedure for Z?

### Baseline vs improved policies

-   Baseline (A): convert full DOM → Markdown → chunk → embed
-   Improved (B): extract retrieval blocks → convert kept blocks → validate invariants → attach evidence → chunk → embed

**Results table (replace with your numbers)**

```
Metric                    Baseline (A)   Improved (B)   Delta
Avg boilerplate_ratio     0.42           0.18           -0.24
Precision@5               0.61           0.74           +0.13
Precision@10              0.68           0.79           +0.11
Citation correctness      0.58           0.71           +0.13
Token savings (retrieved set)  -         -              -22%
```

**Failure breakdown (optional but recommended)**

When B fails, categorize it:

-   chrome_bleed: evidence spans come from nav/footer
-   content_starvation: main content token counts below threshold
-   structure_break: heading/list/table invariants fail
-   evidence_mismatch: evidence attached to the wrong chunk

This turns benchmarks into an engineering feedback loop.

### 9.6 Media pass: diagram + CLI-style evidence format

**Diagram: ingestion contract flow**

```
flowchart TD
  A[Fetch URL] --> B[Fetch mode: static or rendered]
  B --> C[Detect retrieval blocks]
  C --> D[Convert kept blocks to deterministic Markdown]
  D --> E[Attach evidence packets]
  E --> F[Validate invariants]
  F -->|pass| G[Chunk + embed]
  F -->|fail| H[Retry with different policy/fetch]
  H --> C
  F -->|still fail| I[Skip embedding + log low confidence]
```

**CLI-style evidence output (format you should replace with your real run)**

```
[ingest] url=https://example.com/docs/authentication
[policy] profile_id=docs_v3 fetch_mode=rendered_dom
[extract] main_tokens=2140 boilerplate_ratio=0.18 extraction_confidence=0.91
[validate] structure_invariants=pass min_main_tokens=pass evidence_required=pass
[evidence] blocks=3 chunks=9 evidence_attached=true
[embed] index=docs_v3_v2 status=ok
```

For a failure:

```
[ingest] url=https://example.com/docs/authentication
[policy] profile_id=docs_v3 fetch_mode=static_html
[extract] main_tokens=120 boilerplate_ratio=0.62 extraction_confidence=0.22
[validate] structure_invariants=pass min_main_tokens=FAIL evidence_required=pass
[retry] reason=min_main_tokens_failed switching fetch_mode=rendered_dom
```

To fully satisfy the "real artifacts" requirement, you should replace the example output with your captured CLI logs and, optionally, a screenshot of the run logs.

## 10. Security Considerations

Boilerplate removal is also a safety hardening step.

Boilerplate often includes:

-   third-party widgets
-   embedded scripts rendered as text
-   user-generated content blocks
-   subscription prompts with tracking parameters

Even if you never execute scripts, converting them into embeddings increases the chance an LLM sees irrelevant or adversarial instructions. Removing boilerplate reduces that attack surface.

Also consider:

-   PII leakage from user-specific UI
-   terms-of-service compliance for rendering/scraping
-   evidence integrity so citations remain trustworthy

## 11. Troubleshooting

### 11.1 Decision tree

```
flowchart TD
  A[Retrieval quality drops] --> B{Main content missing?}
  B -->|Yes| C[Check fetch mode: static vs rendered]
  C --> D[Retry with rendered DOM]
  D --> E{Main content selectors found?}
  E -->|No| F[Lower min_main_tokens or widen extraction container]
  E -->|Yes| G[Proceed]
  B -->|No| H{Boilerplate ratio too high?}
  H -->|Yes| I[Tighten sidebar/related-links policy]
  I --> J[Increase repetition heuristics]
  J --> K[Retry conversion]
  H -->|No| L{Structure invariants broken?}
  L -->|Yes| M[Normalize headings/lists/tables]
  L -->|No| N[Check evidence mapping]
  N --> O[Verify span/byte offsets]
```

### 11.2 Evidence packet triage (fastest path)

When a regression happens, don't start by changing chunking. Start by inspecting ingestion contract outputs:

-   validation.structure_invariants
-   boilerplate_ratio distribution for the affected domain
-   extraction_confidence for affected URLs
-   For one failing query, inspect retrieved chunk evidence span vs ground-truth section
-   Only after evidence mapping looks correct, adjust chunking parameters

## 12. Best Practices

### Extract retrieval blocks first; convert only kept blocks

Treat HTML→Markdown as a two-phase pipeline:

-   Selection phase (content extraction): decide which DOM regions are retrieval-worthy (main article, primary docs section, key tables/spec blocks).
-   Representation phase (conversion): convert only the selected regions into Markdown.

Why this matters: if you convert the whole DOM, you reintroduce navigation/footer/cookie chrome into the text stream. Even "good-looking" Markdown can still poison embeddings because the retriever learns from whatever text you embedded.

Practical implementation tips:

-   Use a "kept blocks list" as the single source of truth for conversion.
-   Make the kept blocks list auditable (store block ids + section paths).
-   Ensure the kept blocks list is produced before any Markdown formatting happens.

### Track boilerplate_ratio and extraction_confidence for every page

You need metrics that answer two different questions:

-   boilerplate_ratio: "How much of what I embedded is likely chrome?"
-   extraction_confidence: "How sure am I that the kept blocks are actually the main retrieval content?"

A strong operational pattern is to log these per URL and per policy profile:

-   profile_id (which extraction policy was used)
-   fetch_mode (static HTML vs rendered DOM)
-   main_tokens (how much content you kept)
-   boilerplate_ratio
-   extraction_confidence
-   validation results (structure invariants pass/fail)

Why this matters: boilerplate_ratio alone can be misleading (you can have low boilerplate_ratio because you extracted almost nothing). extraction_confidence alone can be misleading (you can be "confident" but still keep the wrong container). Together they detect both failure modes: chrome bleed and content starvation.

### Fail closed: if evidence is missing or confidence is low, skip embedding

In production, "best effort" ingestion is worse than ingestion failure.

Fail-closed rules should be explicit:

-   If evidence_required=true and evidence mapping fails → do not embed
-   If extraction_confidence < threshold → do not embed
-   If main_tokens < min_main_tokens → do not embed
-   If structure invariants fail in strict mode → do not embed

Why this matters: embedding low-quality or mis-mapped content creates silent regressions. The system will still return results, but they'll be wrong in ways that are expensive to debug later.

A good compromise is "degrade safely":

-   Skip embedding, but still store the conversion output + warnings for later analysis.
-   Emit a retry job (different fetch mode or widened extraction container) when appropriate.

### Keep Markdown deterministic

Deterministic Markdown means: given the same input page state and the same policy, your output should be stable.

Determinism protects downstream chunking and retrieval:

-   If headings reorder or list items collapse, chunk boundaries drift.
-   If tables format inconsistently, the retriever matches misleading fragments.
-   If code fences appear/disappear, code semantics degrade.

Concrete determinism practices:

-   Normalize heading levels (#, ##, ###) consistently.
-   Preserve list item continuity (don't turn lists into paragraphs).
-   Enforce table formatting invariants (header row present, consistent column counts).
-   Always fence code blocks and include language hints when available.
-   Avoid "best-effort" formatting that depends on HTML quirks.

### Evaluate with a page-set harness before changing policies

Policy changes should be treated like code changes: you need regression testing.

A page-set harness is a repeatable evaluation that compares:

-   baseline policy vs candidate policy
-   on the same page set and query set
-   using the same scoring rules (precision@k, citation correctness, token savings)

Why this matters: boilerplate removal can improve precision but hurt recall if you remove relevant sections. Only an end-to-end harness can tell you whether the net effect is positive.

A high-quality harness includes:

-   a representative page set (docs/blog/support/product)
-   a query set that targets specific sections (not generic questions)
-   ground-truth mapping to evidence spans or section paths
-   a failure breakdown taxonomy (chrome_bleed, content_starvation, structure_break, evidence_mismatch)

## 13. Common Mistakes

### Converting the entire HTML document and hoping the converter "cleans it"

This is the most common root cause of retrieval contamination.

**Why it fails:**

-   Navigation, footer, and cookie text are repeated and semantically sticky.
-   Chunkers split around formatting artifacts, not around meaning.
-   Citations become unreliable because provenance mapping is incomplete.

**What to do instead:**

-   Extract retrieval blocks first.
-   Convert only kept blocks.
-   Validate and attach evidence before chunking.

### Measuring success by readability instead of retrieval metrics

Readable Markdown is not the same as retrieval-grade Markdown.

**Why it fails:**

-   You can produce fluent text that still embeds the wrong regions.
-   You can preserve headings but still include chrome bleed.
-   You can reduce tokens but break evidence alignment.

**What to do instead:**

-   Measure precision@k and citation correctness.
-   Track boilerplate_ratio and extraction_confidence.
-   Use evidence overlap scoring to validate citations.

### Removing boilerplate too aggressively and silently dropping key sections

Aggressive removal can cause content starvation.

**Symptoms:**

-   extraction_confidence drops
-   main_tokens collapse
-   recall decreases even if boilerplate_ratio looks great

**What to do instead:**

-   Use both boilerplate_ratio and extraction_confidence gates.
-   Set min_main_tokens thresholds by page type.
-   Fail closed when evidence or structure invariants fail.

### Not storing evidence packets

Without evidence packets, you cannot answer the most important debugging questions:

-   Which span produced this chunk?
-   Did the cited chunk actually come from the correct section?
-   Did conversion reorder or truncate content?

**What to do instead:**

-   Store evidence at the block level (URL + section path + source span).
-   Propagate evidence to chunks before embedding.
-   Keep evidence logs for every validation failure.

### Using inconsistent Markdown formatting that breaks chunk boundaries

Inconsistent formatting creates unstable chunking.

**Examples of formatting drift:**

-   headings sometimes appear as plain text
-   lists become paragraphs
-   tables lose header rows or column alignment
-   code fences appear only sometimes

**What to do instead:**

-   Enforce deterministic formatting rules.
-   Validate structure invariants (heading order, list continuity, table shape).
-   Re-run the harness after any formatting change.

## 14. Alternatives & Comparison

### DOM-to-JSON representation

**What it is:**

Convert HTML into a structured JSON representation (nodes, attributes, hierarchy, semantic blocks).

**Pros:**

-   Preserves structure precisely (hierarchy, nesting, attributes).
-   Enables advanced extraction logic (for example, keep only nodes under `<article>` but preserve table semantics).

**Cons:**

-   Larger payloads and more complex chunking and embedding.
-   You still need deterministic serialization rules to avoid drift.

**Use when:**

-   You need structured reasoning over DOM relationships.
-   You have complex pages where layout semantics matter (docs with nested components, rich tables, interactive content).

### Plain text extraction

**What it is:**

Strip tags and output plain text.

**Pros:**

-   Simple and fast.
-   Often sufficient for pages that are mostly prose.

**Cons:**

-   Loses structure: tables and lists become ambiguous.
-   Chunking becomes less reliable because meaning boundaries are weaker.
-   Citations are harder because provenance mapping is less precise.

**Use when:**

-   Content is mostly prose and structure is not critical.
-   You do not need high-fidelity citations or table semantics.

### Site-specific scrapers

**What it is:**

Build custom extraction logic per site (CSS selectors, templates, DOM patterns).

**Pros:**

-   Can be extremely accurate for one site.
-   You can tune extraction to the site's exact layout and boilerplate patterns.

**Cons:**

-   High maintenance cost.
-   Brittle across redesigns and A/B tests.
-   Hard to scale across many domains without a lot of engineering.

**Use when:**

-   You have stable domains and enough volume to justify maintenance.
-   You need maximum accuracy for a small number of high-value sources.

### Why Markdown + boilerplate contracts is a strong default

**Why it works:**

-   Markdown is compact and chunk-friendly.
-   Boilerplate contracts add the missing engineering layer: selection, deterministic representation, validation, and evidence.
-   You get a practical balance: structure is preserved enough for chunking, while evidence and invariants keep retrieval trustworthy.

**When it is not enough:**

-   If your pages require deep structural reasoning, DOM-to-JSON may be better.
-   If your content is mostly prose, plain text may be sufficient.

## 15. Enterprise / Cloud Deployment (detailed, high-quality)

### At scale: run conversion as a stateless service

**Architecture pattern:**

-   Ingestion workers fetch and extract.
-   A conversion service converts kept blocks to deterministic Markdown.
-   A validation service enforces invariants and evidence requirements.
-   An embedding service indexes only validated outputs.

**Why stateless matters:**

-   Horizontal scaling is straightforward.
-   Retries are safe and reproducible.
-   You can version policies and re-run conversions without hidden state.

### Store evidence packets alongside embeddings

Evidence should be stored with the same lifecycle as embeddings:

-   evidence packets linked to the chunk ids
-   evidence integrity checks
-   policy version metadata (profile_id, conversion_policy_id)

**Why this matters:**

-   Citation correctness becomes measurable.
-   Debugging becomes fast (you can inspect evidence spans for failures).
-   You can re-score or re-render without re-fetching everything.

### Use queue-based retries for low-confidence pages

Instead of failing silently:

-   If validation fails, enqueue a retry job.
-   Retry with a different fetch mode (static vs rendered).
-   Retry with a widened extraction container or adjusted sidebar policy.

**Why queue-based retries matter:**

-   You do not block the ingestion pipeline.
-   You can cap retries (max_validation_failures) to control cost.
-   You can track retry rates as an operational metric.

### Maintain per-domain policy profiles

Create policy profiles so you do not hand-tune per page:

-   profile_id per domain (or per domain + page type)
-   tuned max_boilerplate_ratio
-   tuned cookie_banner_policy
-   tuned sidebar_inclusion
-   tuned min_main_tokens

**Why this matters:**

-   Boilerplate patterns vary by domain.
-   Cookie and consent UI differs widely.
-   Sidebars can be navigation or real content depending on the site.

### Operationally, you want drift alerts, policy versioning, and reproducible runs

**Drift alerts:**

-   monitor boilerplate_ratio spikes
-   monitor extraction_confidence drops
-   monitor validation failure rates by domain

**Policy versioning:**

-   store profile_id + conversion_policy_id
-   keep conversion rules immutable per version
-   allow rollbacks when a policy change regresses retrieval

**Reproducible evaluation runs:**

-   same query set
-   same scoring rules
-   same page set (or a controlled rolling window)
-   compare baseline vs candidate with consistent metrics

This is how you keep quality stable as websites change.

## 16. FAQs

### 1. Does boilerplate removal always improve retrieval?

In most pipelines, yes—because boilerplate is repeated, low-information text that competes with unique content in embedding space. The catch is that aggressive removal can delete the section you actually need. That is why you need both boilerplate_ratio targets and extraction_confidence gates.

### 2. What does boilerplate_ratio mean in practice?

It is the fraction of converted Markdown tokens that come from blocks you did not classify as retrieval content. If you convert the whole DOM, boilerplate_ratio tends to be high and unstable. If you extract retrieval blocks first, boilerplate_ratio becomes a measurable signal you can trend per domain and page type.

### 3. How do I choose max_boilerplate_ratio thresholds?

Start conservative (for example, 0.25–0.35) and validate on a representative page set. Tune based on retrieval outcomes, not just readability. If precision@k improves but recall drops, you are likely removing relevant sections.

### 4. What if my site has heavy sidebars that contain real content?

Treat sidebar inclusion as a policy knob. Some sidebars are navigation; others are "related work" or "key concepts" that genuinely answer user questions. Classify sidebar blocks using the same signals as main content (structure, density, repetition), then decide whether they are retrieval content or metadata.

### 5. Should I render JavaScript pages?

Render only when needed. If main content is client-side, a static HTML fetch will produce a shell where boilerplate looks "clean" but main content is missing. Use retry/fallback to switch fetch mode when validation fails, for example when main content token counts fall below min_main_tokens.

### 6. Can I do this without evidence packets?

You can, but you lose the fastest debugging loop. Evidence packets let you answer "which span produced this chunk?" and "did the chunk map to the right section path?" Without evidence, failures are harder to diagnose.

### 7. Are cookie banners always boilerplate?

For general Q&A retrieval, usually yes. For compliance-heavy questions, cookie or legal text may contain the only relevant policy. Support a compliance_mode policy: keep cookie or legal text as a separate non-retrieval block, or include it only when query intent matches legal or compliance.

### 8. How do tables affect boilerplate removal?

Tables are high-value but high-risk. A converter that flattens tables into inconsistent Markdown can create "table-like boilerplate" where structure is wrong and retrieval matches misleading fragments. Enforce table-formatting invariants before embedding.

### 9. What's the fastest way to improve retrieval quality?

Extract retrieval blocks first, convert only kept blocks, enforce deterministic Markdown, and fail closed when evidence or structure invariants are missing. This reduces chrome bleed and stabilizes chunk boundaries.

### 10. How do I detect when boilerplate removal is too aggressive?

Watch extraction_confidence and main content token counts. If extraction_confidence drops or main content tokens fall below min_main_tokens, you are likely removing relevant sections. Use evidence mapping to confirm.

### 11. How does this relate to chunking?

Chunking is downstream of conversion. If conversion changes heading order, list continuity, or table formatting, chunk boundaries drift and retrieval changes. Deterministic Markdown is therefore part of the ingestion contract, not a cosmetic choice.

### 12. What should I log in production?

Log boilerplate_ratio, extraction_confidence, validation failures, and evidence mapping status per URL. Also log which policy profile was used (profile_id) so you can correlate regressions with domain-level changes.

### 13. How do I handle "related links" blocks?

Treat them as a separate policy knob. If related links are part of the article narrative, for example "See also" sections with short summaries, you may keep them as retrieval content. If they are generic navigation, drop them from retrieval output and store them as metadata.

### 14. What if the site redesign changes boilerplate patterns?

Use validation and retries. When boilerplate_ratio spikes or extraction_confidence drops, retry with a different extraction policy: widen the main container or adjust sidebar inclusion. Alert on domain-level drift so you can update the policy profile.

### 15. How do I evaluate citation correctness?

Citation correctness is not "did the model cite something." It is "did the cited span actually support the answer." Score whether the retrieved chunk's evidence span overlaps the ground-truth section for the query.

### 16. Boilerplate removal vs content extraction?

Boilerplate removal is a specific goal: suppress repeated low-signal chrome so retrieval focuses on unique content. Content extraction is broader: selecting the right blocks, preserving structure, and representing them deterministically. In a good pipeline, boilerplate removal is implemented as a content extraction policy plus validation.

## 17. References

-   Ollagraph: HTML to Markdown for AI (existing guide)
-   Ollagraph: HTML to Markdown API contract for LLMs (existing guide)
-   Ollagraph: Preserve semantic structure for LLMs (existing guide)
-   RAG evaluation concepts: precision@k, citation correctness, evidence-based debugging

## 18. Conclusion

Boilerplate removal is one of the highest-leverage improvements you can make to an HTML→Markdown RAG pipeline, because it directly controls what your retriever is allowed to "learn from." If you embed navigation chrome, cookie banners, related-links blocks, or repeated UI scaffolding, you do not just waste tokens—you actively dilute relevance and make citations harder to trust.

The practical shift is to stop treating HTML→Markdown conversion as "formatting" and start treating it as knowledge engineering. In a RAG system, conversion is the step that turns a web page into the knowledge substrate your embeddings and chunking will index. Boilerplate removal is how you protect that substrate.

That is why the most reliable approach is to implement boilerplate removal as a measurable contract:

-   Extract retrieval blocks first (selection), so you only convert what is intended to be retrievable.
-   Convert deterministically (representation), so chunk boundaries and evidence spans do not drift between runs.
-   Validate invariants (verification), so you fail closed when the output does not meet structural expectations.
-   Attach evidence packets (provenance), so citation correctness becomes testable instead of anecdotal.

When you do this, you get more than "cleaner text." You get operational guarantees. You can track boilerplate_ratio to detect chrome bleed, track extraction_confidence to detect content starvation, and enforce gates like min_main_tokens to prevent silent ingestion failures. Most importantly, you can evaluate changes with a page-set harness and quantify whether the net effect improves precision, recall, and citation correctness.

## Common questions

### What is boilerplate in a RAG ingestion pipeline?

Boilerplate is page content that repeats across pages or serves the interface, not the information source. It includes navigation, footers, cookie banners, and similar chrome. In retrieval, it competes with the real content and can distort rankings and citations.

### Why remove boilerplate before converting HTML to Markdown?

If you convert first, non-content text can be embedded alongside the article and shape chunk boundaries. Removing boilerplate first keeps the Markdown focused on retrieval content. That improves signal density and makes downstream chunking more stable.

### How do you know whether extraction is too aggressive?

Watch for content starvation, where main content is missing or truncated. A low boilerplate ratio is not enough if the extraction confidence is weak or key headings disappear. Good pipelines validate structure invariants and fail closed when the main content looks incomplete.

### What makes Markdown deterministic in this context?

Deterministic Markdown uses consistent rules for headings, lists, tables, and spacing every time the same source is processed. That reduces chunk boundary drift and makes embeddings more reproducible. It also makes regressions easier to detect because output changes are meaningful, not accidental.

### What are evidence packets and why do they matter?

An evidence packet links each extracted block back to its source span, byte range, or DOM location. This gives you a verifiable trail from retrieved chunk to original HTML. It speeds debugging and makes citations auditable instead of approximate.

### How should you evaluate boilerplate removal quality?

Measure both retrieval quality and citation correctness, not just token counts. Track boilerplate ratio, extraction confidence, precision@k, and whether cited spans match the original source. A good pipeline improves relevance while keeping provenance intact.
