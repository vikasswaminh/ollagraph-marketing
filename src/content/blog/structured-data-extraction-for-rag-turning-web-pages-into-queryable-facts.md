---
title: 'Structured Data Extraction for RAG: Web Pages to Queryable Facts'
description: 'Learn how structured data extraction turns web pages into queryable entities and relationships, enabling precise, citeable answers for RAG.'
metaTitle: 'Structured Data Extraction for RAG: Queryable Facts'
metaDescription: 'Learn how structured data extraction turns web pages into queryable entities and relationships, enabling precise, citeable answers for RAG.'
primaryKeyword: 'structured data extraction for RAG'
secondaryKeywords: 'queryable facts extraction, entity extraction for RAG, knowledge graph from web pages, fact extraction pipeline, structured RAG architecture'
pubDate: 2026-07-30
author: 'Amit Sharma'
tags: ['rag', 'ai-search', 'guides', 'seo']
---

## Executive Summary

Standard RAG pipelines retrieve chunks of text — paragraphs, sections, or pages — and hand them to an LLM as context. That works fine when the answer lives entirely inside one chunk. But most real-world questions do not map neatly to a single paragraph. "Which products under $50 are in stock from vendor X?" requires the system to understand products, prices, stock status, and vendor relationships as structured facts, not as strings buried inside a block of text.

Structured data extraction for RAG solves this by pulling entities, attributes, and relationships out of web pages and into queryable structures — typed records, knowledge graphs, or hybrid vector-graph indexes — before the retrieval step ever runs. Instead of searching for chunks that might contain the answer, the system queries facts directly.

This guide covers the architecture, the extraction pipeline, the query layer, and the trade-offs — with working code, a benchmark method you can run on your own corpus, and a decision framework for when structured extraction makes sense and when it does not.

## Definition: Structured Data Extraction for RAG

The process of extracting typed entities, their attributes, and their inter-relationships from unstructured web content, storing them in queryable structures (relational tables, graph databases, or hybrid indexes), and retrieving them at inference time to ground LLM responses in precise, citeable facts rather than approximate text chunks.

## Key Takeaways

- Chunk-based RAG retrieves paragraphs; structured RAG retrieves facts. The difference matters for any question that involves multiple entities, numeric constraints, or cross-document relationships.
- Entity extraction is the foundation. You cannot query what you did not extract. A well-designed schema contract defines which entities, attributes, and relationships matter for your domain.
- Three storage models exist for queryable facts: relational (SQL with pgvector), graph (Neo4j, Amazon Neptune), and hybrid (vector + graph). Each serves a different query pattern.
- Natural language to structured query translation (NL2SQL, NL2GraphQL) is the bridge that lets users ask "which products are under $50?" and get back precise, citeable answers without writing a single WHERE clause.
- Provenance chains every fact back to its source. When a user asks "where did you get that price?", the system can answer with the exact URL, the DOM path, and the raw text it extracted — not a vague "from your documentation."
- Structured extraction adds upfront cost but removes downstream ambiguity. You pay more at ingestion time to save ten times that at query time in debugging, hallucination recovery, and user trust.

## 1. The Problem: Why Chunk-Based RAG Fails on Factual Questions

Here is a question that looks simple: "What is the cheapest 27-inch monitor with USB-C charging and next-day delivery from a vendor within 50 miles of Chicago?"

A standard chunk-based RAG system will almost certainly get this wrong. Not because the embedding model is bad, not because the vector database is slow, but because the answer requires the system to compose facts across multiple entities — and chunk retrieval was never designed for that.

Let me walk through exactly where it breaks.

1. **Step one:** the query gets embedded. The user's question becomes a vector. The system searches the vector index for the nearest chunks. The closest match might be a product description page that says "27-inch monitor with USB-C charging — $449." That chunk contains two of the required facts: size and charging. But it does not contain the price comparison across multiple monitors, the stock availability, or the shipping radius.
2. **Step two:** the system retrieves the top-k chunks. Maybe it gets five chunks: one product page for a Dell monitor, one for an LG monitor, a shipping policy page, a vendor directory page, and a blog post about USB-C monitor setups. Each chunk contains some of the facts, but none contains all of them. The LLM now has to piece together a coherent answer from fragments that were never designed to be assembled.
3. **Step three:** the LLM hallucinates the composition. The model sees "27-inch monitor" in chunk A, "USB-C" in chunk B, "$449" in chunk C, and "next-day delivery available" in chunk D. It has no way to verify that the $449 price applies to the 27-inch USB-C monitor and not to a different model mentioned on the same page. It has no way to check whether that specific monitor is in stock at a vendor within 50 miles of Chicago. It guesses. Sometimes it guesses right. Often it guesses wrong, and because the output is fluent and confident, nobody knows.

This is the fundamental limitation of chunk-based RAG: it retrieves containers of text, not facts. Chunks are opaque bags of tokens. The retrieval system can tell you which chunks are semantically similar to the query, but it cannot tell you whether a specific fact exists in any chunk, whether two facts in different chunks refer to the same entity, or whether a numeric constraint like "under $50" is satisfied by any product in the corpus.

The consequences are measurable. Take a set of factual questions from your own domain, run them through your chunk-based pipeline, and score three things:

- **Exact-answer precision:** does the answer contain the correct fact?
- **Hallucination rate:** does the answer include information not present in any source chunk?
- **Citation accuracy:** when the system cites a source, does the cited chunk actually contain the claimed fact?

Any meaningful failure rate on these checks is not acceptable for a production system where factual accuracy matters — customer support, financial analysis, medical information, or legal research. And it is usually not a model problem. It is a retrieval problem. The model can only answer correctly if the retrieval system hands it the right facts in a form the model can use.

Structured data extraction for RAG exists to fix this. Instead of retrieving chunks and hoping the facts are in there somewhere, you extract the facts explicitly, store them in queryable structures, and retrieve them with deterministic precision. The rest of this guide shows you exactly how.

## 2. A Brief History: From Full-Text Search to Structured Retrieval

The path from "find me documents with these words" to "answer this factual question precisely" has been running for decades, and each step reveals why structured extraction matters.

**The RAG breakthrough.** Lewis et al. (2020) showed that feeding retrieved chunks to an LLM as context dramatically improved factual grounding. The community ran with it. By 2024, RAG was the default architecture for any system that needed to answer questions about private or current data. But the chunk-level limitation persisted, and as systems moved from demos to production, the hallucination problem became impossible to ignore.

**The structured retrieval response.** Around 2024-2025, several lines of work converged on the same insight: if you want factual answers, you need factual retrieval. GraphRAG (Microsoft, 2024) showed that extracting entity-relationship graphs from documents and using them for retrieval improved multi-hop question answering. Schema-based extraction pipelines (Ollagraph, Firecrawl, Jina AI) showed that you could extract typed records from web pages with high reliability. NL2SQL systems (text-to-SQL with LLMs) matured to the point where natural-language questions could be reliably translated into database queries.

**Where we are in 2026.** The state of the art is hybrid: extract structured facts from web content, store them in a queryable index (relational, graph, or both), and use the structured index for precise fact retrieval while falling back to chunk-based vector search for open-ended or ambiguous questions. The structured layer handles the "what is the price of X?" and "which products are in stock?" questions with 100% precision. The vector layer handles the "tell me about X" and "how does X compare to Y?" questions where semantic similarity matters more than exact fact matching.

## 3. What Structured Data Extraction for RAG Actually Means

Structured data extraction for RAG is the practice of extracting typed entities, their attributes, and their inter-relationships from unstructured web content, persisting them in a queryable store (relational database, graph database, or hybrid index), and retrieving them at inference time — either directly or via natural-language-to-structured-query translation — to ground LLM responses in precise, verifiable facts.

Three things distinguish it from standard RAG:

1. **One:** the unit of retrieval is the fact, not the chunk. Instead of retrieving a paragraph and asking the LLM to find the relevant fact inside it, you retrieve the fact directly. The price of a product is a row in a table, not a substring inside a block of text. The relationship between a vendor and a product is an edge in a graph, not a sentence buried in a paragraph.
2. **Two:** the extraction is schema-guided, not ad hoc. You define what entities matter (products, vendors, prices, specifications), what attributes each entity has (name, price, stock status, dimensions), and what relationships exist between them (vendor sells product, product has specification). The extraction pipeline uses these schemas to pull facts from web pages deterministically.
3. **Three:** the query layer is compositional. Because facts are stored in structured form, you can compose them. "Find products under $50 from vendors within 50 miles that are in stock" becomes a single query — SQL, Cypher, or a natural language query translated into one — that returns exactly the matching facts. No chunk assembly, no hallucination risk, no guesswork.

## 4. Architecture: The Five-Layer Structured RAG Pipeline

Here is the architecture at a glance, then we walk each layer.

```
  +------------------------------------------------------------------+
  |           STRUCTURED DATA EXTRACTION FOR RAG (Five Layers)       |
  +------------------------------------------------------------------+

  LAYER 1: SCHEMA DESIGN
  +------------------+     +------------------+     +------------------+
  | Entity Schemas   |     | Attribute Types  |     | Relationship     |
  | (Product,        |     | (string, float,  |     | Schemas (sells,  |
  |  Vendor, Order)  |     |  enum, date)     |     |  has_spec, ...)  |
  +--------+---------+     +--------+---------+     +--------+---------+
           |                        |                         |
           +------------------------+-------------------------+
                                    |
  LAYER 2: EXTRACTION              |
  +------------------------------- v -------------------------+
  | Web Page -> Render -> Extract Entities -> Extract Rels    |
  | (Ollagraph Extraction API, custom pipeline, or hybrid)    |
  +-------------------------------+---------------------------+
                                  |
  LAYER 3: VALIDATION             v
  +------------------------------- ---------------------------+
  | Schema Validation -> Dedup -> Provenance Envelope        |
  | (type checks, uniqueness, source attribution)            |
  +-------------------------------+---------------------------+
                                  |
  LAYER 4: STORAGE                v
  +------------------------------- ---------------------------+
  | +----------+  +----------+  +----------------------------+|
  | | Relational|  | Graph DB |  | Hybrid (vector + graph)  ||
  | | (SQL +   |  | (Neo4j,  |  | (pgvector + edges,       ||
  | | pgvector)|  | Neptune) |  | Qdrant + relationships)   ||
  | +----------+  +----------+  +----------------------------+|
  +-------------------------------+---------------------------+
                                  |
  LAYER 5: QUERY                  v
  +------------------------------- ---------------------------+
  | NL Query -> Intent Router -> +----------+                |
  |                              | Structured|               |
  |                              | Query     | -> Facts      |
  |                              | (SQL,     |                |
  |                              |  Cypher)  |                |
  |                              +----------+                |
  |                              | Vector    | -> Chunks     |
  |                              | Search    |                |
  |                              +----------+                 |
  +-------------------------------+---------------------------+
                                  |
                                  v
                          +----------------+
                          | LLM + Context  |
                          | (facts + chunks|
                          |  + citations)  |
                          +----------------+
```

**Layer 1 — Schema Design.** Before you extract anything, you define what you are extracting. This is the most important layer and the one most teams skip. A good schema answers: what entities exist in this domain? What attributes does each entity have, and what are their types? What relationships connect entities? The schema is the contract between extraction and query — if you do not define it, you cannot query it.

**Layer 2 — Extraction.** Given a set of web pages and a schema, extract the entities, attributes, and relationships. This can be done with an extraction API such as Ollagraph, a custom pipeline using an LLM with structured output, or a hybrid approach. The output is a set of candidate facts, each with a provenance envelope (source URL, DOM path, raw text, confidence score).

**Layer 3 — Validation.** Candidate facts are not facts until they pass validation. Type checks ensure prices are floats, dates are valid ISO-8601 strings, and enums match allowed values. Deduplication merges facts that refer to the same real-world entity (two product pages for the same SKU). Provenance envelopes ensure every fact can be traced back to its source.

**Layer 4 — Storage.** Validated facts go into a queryable store. The choice of store depends on your query patterns: relational (PostgreSQL with pgvector) for attribute-heavy queries with numeric constraints, graph (Neo4j) for relationship-traversal queries, or hybrid for both.

**Layer 5 — Query.** The user asks a question in natural language. An intent router decides whether the question is best answered by structured retrieval (factual, compositional) or semantic retrieval (exploratory, narrative). Structured questions are translated into SQL or Cypher queries, executed against the fact store, and the results are handed to the LLM as grounded context alongside any relevant chunks from the vector index. Teams building this layer often use orchestration frameworks like LangChain (with its SQL agent and graph chain abstractions) or LlamaIndex (with its structured data query engines) to avoid writing the NL2SQL routing logic from scratch.

## 5. Layer 1: Schema Design — Defining Your Fact Model

**What it is:** The contract between extraction and query. Define what entities exist, what attributes they have, and what relationships connect them. If you don't define it, you can't query it.

**Key entities (e-commerce example):** Product, Vendor, Category, Specification, InventoryRecord

**Key principles:**

- Extract what you query — don't extract attributes nobody filters on
- Prefer enums over free text — "monitor" not "Monitor"/"monitors"/"LCD Monitor"
- Design for deduplication — use SKUs/GTINs/URLs as canonical IDs
- Include provenance in every schema — source URL, timestamp, raw text (makes citations possible)

Relationship schemas connect entities (Vendor → sells → Product). These edges enable multi-hop queries like "find vendors that sell monitors under $300 within 50 miles."

## 6. Layer 2: Entity and Relationship Extraction

Three approaches, each with different trade-offs:

| Approach | Speed | Cost | Determinism | Best For |
|---|---|---|---|---|
| **LLM-based (GPT-4o + JSON mode)** | 2-5s/page | $0.01-0.03/page | Low | Messy pages, implicit facts |
| **Extraction API (Ollagraph)** | 500-1500ms/page | 1 credit/page | High | Structured fields at scale |
| **Hybrid (API for structure + LLM for enrichment)** | 1-3s/page | Medium | Medium | Production — best of both |

**The pragmatic choice:** Use an extraction API for the 80% of fields that are structural (prices, dates, stock status, IDs). Use LLMs only for the 20% that need semantic understanding (descriptions, categories, implicit attributes). Getting this split wrong is the single biggest cost driver.

## 7. Layer 3: Fact Validation and Deduplication

**Validation:** Every extracted value must pass type and constraint checks before entering the fact store. A price of "$449.99" that wasn't coerced to float gets rejected. A date of "tomorrow" gets rejected. Use Pydantic or Zod schema validation — one function call catches all type errors.

**Deduplication (three-tier match):**

- Exact ID match — same SKU/GTIN/URL = same entity
- Fuzzy name match — Levenshtein distance < 0.15 + same category
- Attribute cluster match — 3+ matching attributes (price within 5%, same category, same vendor)

**Merge rule:** prefer most recent extraction → prefer official source → flag for human review.

**Provenance envelope:** Every fact carries source URL, DOM path, raw text, confidence score. This is what makes answers citeable — "where did you get that price?" returns the exact URL and DOM element, not a vague "from your website."

## 8. Layer 4: Storage — Relational, Graph, and Hybrid Models

| Model | Best For | Example Query |
|---|---|---|
| **Relational (PostgreSQL + pgvector)** | Attribute filtering, numeric constraints, aggregation | `WHERE price < 50 AND in_stock = TRUE` |
| **Graph (Neo4j)** | Multi-hop relationship traversal | `MATCH (v:Vendor)-[:SELLS]->(p:Product)` |
| **Hybrid (pgvector + relationships)** | Both filtering + semantic similarity | `WHERE price < 50 ORDER BY embedding <=> query` |

**Quick rule:** If your queries are mostly "find X where attribute = Y", use PostgreSQL. If they're "find X connected to Y through Z", use a graph DB. If both, use hybrid.

**Other stores to evaluate:** Weaviate (native hybrid search), Milvus (billion-scale), DuckDB + vss (analytical workloads with SQL aggregations over vectors).

## 9. Layer 5: The Query Layer — NL2SQL, NL2GraphQL, and Hybrid Retrieval

Intent routing classifies each query into one of three buckets:

- **Structured (factual, constraint-based)** → NL2SQL/NL2Cypher → fact store
- **Semantic (exploratory, narrative)** → vector search → chunk index
- **Hybrid (both)** → both, results merged

**NL2SQL flow:** LLM receives database schema DDL, generates SQL, executes against PostgreSQL, returns result rows. A second LLM call answers the user's question using ONLY those rows — no hallucination risk.

**End-to-end latency:** ~800ms (structured) vs ~1,200ms (chunk-based RAG). Structured is faster and more precise because retrieval is a deterministic DB lookup instead of a fuzzy vector search.

**Guardrail:** Always validate generated SQL against known-good query patterns before executing. LLMs can write syntactically valid but semantically wrong SQL (wrong column, wrong JOIN, missing WHERE clause).

## 10. Concrete Example: Extracting and Querying E-Commerce Product Facts

The following is a complete end-to-end example so you can see every layer in action.

### Step 1: Define the Schema

```python
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class VendorTier(str, Enum):
    PREMIUM = "premium"
    STANDARD = "standard"
    BUDGET = "budget"

class ProductSpec(BaseModel):
    screen_size_inches: Optional[float] = None
    ports: list[str] = []
    weight_lbs: Optional[float] = None
    resolution: Optional[str] = None

class ProductFact(BaseModel):
    sku: str
    name: str
    category: str
    price_usd: float
    in_stock: bool
    vendor: str
    vendor_tier: VendorTier
    specifications: ProductSpec
    url: str
```

### Step 2: Extract from a Product Page

```python
import httpx
from datetime import datetime, timezone

url = "https://example.com/products/dell-u2724d"

response = httpx.post(
    "https://api.ollagraph.com/v1/extract/structured",
    json={"url": url},
    headers={"Authorization": "Bearer YOUR_KEY"},
    timeout=60,
)

result = response.json()
# result["products"] is a flattened view of the page's Product JSON-LD / Microdata;
# result["json_ld"] holds the full blocks if you need more fields
product = result["products"][0]
extracted_at = datetime.now(timezone.utc).isoformat()
```

### Step 3: Validate and Store

```python
validated_fact = ProductFact(
    sku=product["sku"],
    name=product["name"],
    category="monitor",                # from your own taxonomy
    price_usd=float(product["price"]),
    in_stock=product.get("availability") == "InStock",
    vendor=product.get("brand", ""),
    vendor_tier=VendorTier.PREMIUM,    # from your vendor table
    specifications=ProductSpec(),      # fill from json_ld or an LLM pass
    url=url,
)

# Keep your own provenance record next to the fact
provenance = {
    "price_usd": {
        "raw_value": product["price"],
        "source": "json_ld.offers.price",
        "source_url": url,
        "extracted_at": extracted_at,
    }
}
```

### Store in PostgreSQL

```python
cursor.execute("""
    INSERT INTO products (sku, name, category, price_usd, in_stock, vendor, url)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (sku) DO UPDATE SET
        price_usd = EXCLUDED.price_usd,
        in_stock = EXCLUDED.in_stock,
        last_updated = CURRENT_DATE
""", (
    validated_fact.sku,
    validated_fact.name,
    validated_fact.category,
    validated_fact.price_usd,
    validated_fact.in_stock,
    validated_fact.vendor,
    validated_fact.url
))
```

### Step 4: Query via Natural Language

**User asks:** "Which premium vendors have monitors under $500 that are in stock?"

The NL2SQL layer generates:

```sql
SELECT v.name AS vendor_name, p.name AS product_name, p.price_usd
FROM products p
JOIN vendors v ON p.vendor = v.name
WHERE p.category = 'monitor'
  AND p.price_usd < 500
  AND p.in_stock = TRUE
  AND v.tier = 'premium'
ORDER BY p.price_usd;
```

**The LLM responds:** "Three premium vendors have monitors under $500 in stock: Dell (UltraSharp 27 at $449.99), LG (27UP600 at $379.99), and Samsung (S27A800 at $429.99). [Sources: dell.com, lg.com, samsung.com]"

Here is what that query execution looks like from the command line — the raw SQL, the result set, and the provenance chain for one row:

```bash
$ psql -h localhost -d fact_store -c "
    SELECT p.name, p.price_usd, p.in_stock, p.last_updated,
           v.name AS vendor, v.tier
    FROM products p
    JOIN vendors v ON p.vendor = v.name
    WHERE p.category = 'monitor'
      AND p.price_usd < 500
      AND p.in_stock = TRUE
      AND v.tier = 'premium'
    ORDER BY p.price_usd
    LIMIT 3;
"

        name         | price_usd | in_stock | last_updated | vendor  |  tier
---------------------+-----------+----------+--------------+---------+---------
 LG 27UP600          |    379.99 | t        | 2026-07-28   | LG      | premium
 Samsung S27A800     |    429.99 | t        | 2026-07-27   | Samsung | premium
 Dell UltraSharp 27  |    449.99 | t        | 2026-07-28   | Dell    | premium
(3 rows)
```

**Check provenance for the Dell price field** (stored by your pipeline; Ollagraph does not keep extracted data):

```bash
$ psql -h localhost -d fact_store -At -c "
    SELECT provenance->'price_usd' FROM facts WHERE fact_id = 'fact-20260728-001';
"

{
  "raw_value": "449.99",
  "source": "json_ld.offers.price",
  "source_url": "https://example.com/products/dell-u2724d",
  "extracted_at": "2026-07-28T10:30:00Z"
}
```

## 11. How to Benchmark Structured vs. Chunk-Based RAG

To decide whether structured extraction is worth it for your domain, run both approaches against the same question set and compare them on the same metrics.

### Benchmark Setup

- **Test set:** a few hundred real questions per domain, drawn from your query logs where possible
- **Question types:** factual (single entity), compositional (multiple constraints), multi-hop (relationship traversal), and exploratory (open-ended)
- **Chunk-based RAG:** your current embedding model, top-k chunks, and answer-generation model
- **Structured RAG:** extraction pipeline + PostgreSQL with pgvector + NL2SQL, same answer generation model
- **Metric:** Exact-answer precision (does the answer contain the correct fact?), hallucination rate (does the answer include information not in any source?), citation accuracy (does the cited source actually contain the claimed fact?), end-to-end latency (p50 and p95), ingestion cost per page, and query cost per question

Break the results down by question type. The aggregate number hides the pattern that matters: where each approach wins.

### What to Look For

Structured extraction shifts cost from query time to ingestion time. You pay more per page at ingestion (extraction API calls, validation, storage), and each query can get cheaper because retrieval is a deterministic database lookup instead of a fuzzy vector search plus context window fill.

The real win to look for is not cost — it is accuracy on factual and compositional questions. Also check where the structured system's remaining errors come from: questions outside its schema should produce "I don't have that information" instead of a guess.

### When Structured Extraction Does Not Help

Structured extraction underperforms on exploratory questions. "Tell me about the latest trends in USB-C monitors" does not map well to a SQL query. The structured layer returns nothing useful, and the fallback to chunk-based retrieval adds latency. For these questions, standard chunk-based RAG actually performs better.

The lesson: use structured extraction for the questions that need precision, and chunk-based retrieval for the questions that need exploration. A hybrid system that routes queries appropriately gets the best of both worlds.

## 12. Security and Governance for Fact Extraction

Structured extraction introduces security considerations that chunk-based RAG does not face, because you are storing explicit facts rather than opaque chunks.

### PII and Sensitive Data

Extraction pipelines can inadvertently capture personal information — email addresses, phone numbers, names — from web pages. A schema that extracts "customer reviews" might pull reviewer names and locations. A schema that extracts "job listings" might capture contact information.

**Mitigation strategies:**

- Schema-level filtering: Define your schema to exclude PII fields. If you do not define a phone_number field, the extraction pipeline will not extract it.
- Post-extraction redaction: Run extracted values through a PII detection model (Presidio, Amazon Comprehend) and redact matches before storage.
- Field-level access control: Store PII-tainted facts in a separate table with stricter access controls, and exclude them from the RAG query path.

### Fact Freshness and Staleness

A fact that was true at extraction time may be false at query time. A price of $449.99 extracted last week may have changed today. Structured extraction makes staleness visible — every fact has a last_updated timestamp — but it does not solve it.

**Production systems should:**

- Set a TTL on facts. Any fact older than N days is flagged as stale and excluded from query results until re-extracted.
- Re-extract on a cadence. Run the extraction pipeline on a schedule (daily for e-commerce prices, weekly for documentation, monthly for reference data).
- Surface staleness to users. When a fact is near its TTL, include a caveat: "This price was last verified 6 days ago."

### Audit Trail

Every fact in a structured extraction system has a complete audit trail: who extracted it (which API key), when, from which URL, using which schema version, and with what confidence. This is essential for regulated industries (finance, healthcare, legal) where data provenance is a compliance requirement.

## 13. Troubleshooting Common Fact Extraction Failures

| Failure | Symptom | Most Likely Cause | Quick Fix |
|---|---|---|---|
| **Missing facts** | 12 entities instead of 20 | JS render timeout or anti-bot detection | Increase wait time, rotate proxies |
| **Wrong facts** | $1,299 extracted as $12.99 | Wrong DOM element or currency misdetection | Add CSS selector hint, require currency field |
| **Duplicate facts** | Same product 15 times with different prices | No deduplication key | Configure SKU/URL-based dedup strategy |
| **Slow extraction** | 5+ seconds per page | LLM extraction or JS rendering overhead | Use extraction API for structured fields, static HTML for non-JS pages |

Root cause pattern: 80% of extraction failures trace back to either the page not rendering fully (JS timeout) or the schema not matching the page's actual structure (wrong selectors, missing enum values). Fix those two and you fix most of your pipeline.

## 14. Best Practices for Production Fact Pipelines

- Design schemas iteratively — start with 5-10 fields, add more based on real query logs, not assumptions
- Always include provenance — source URL, timestamp, raw text, confidence. Without it you can't debug, audit, or cite
- Validate at ingestion, not query time — type-checking and dedup when the fact enters the store, not when a user asks
- Monitor three metrics — extraction success rate, field completion rate, fact accuracy. Alert on drops
- Version your schemas — old facts don't auto-conform when you add a field. Keep a schema version in every record and run migration scripts
- Test with real pages — synthetic tests never capture the messiness of the live web. Build a 50-100 page test corpus

## 15. Common Mistakes and Anti-Patterns

| # | Mistake | Why It Hurts | Fix |
|---|---|---|---|
| **1** | Extracting everything | Fact store full of noise nobody queries | Extract only what users filter on |
| **2** | Trusting extraction without validation | Bad data enters the store silently | Validate every field against schema before insert |
| **3** | Ignoring deduplication | Conflicting records for the same entity | Three-tier match: ID → fuzzy name → attribute cluster |
| **4** | Using LLMs for every extraction field | 5x slower, 10x more expensive than needed | 80% of fields (prices, dates, IDs) → extraction API. 20% (descriptions, categories) → LLM |
| **5** | No re-extraction cadence | Fact store becomes a museum of outdated data | Set TTL + re-extraction schedule from day one |
| **6** | NL2SQL without guardrails | LLM generates valid SQL that answers the wrong question | Validate generated SQL against known-good patterns before execution |
| **7** | Structured vs. chunk-based as mutually exclusive | You lose half your query types | Route: structured for factual, chunk-based for exploratory, hybrid for both |

The one that costs the most: Mistake 4. Teams hear "AI extraction" and assume every field needs an LLM call. The 80/20 split (deterministic extraction for structure, LLM for semantics) is the difference between a pipeline that scales and one that burns money.

## 16. Alternatives and When to Use Each

| Approach | Best For | Key Trade-off |
|---|---|---|
| **Chunk-based RAG** | Exploratory questions, narrative content | Cheap to ingest, prone to hallucinating facts |
| **Structured + SQL** | Factual questions with numeric constraints | High ingestion cost, precise fact lookups |
| **Structured + Graph DB** | Multi-hop relationship queries | Overkill for simple attribute lookups |
| **GraphRAG (Microsoft)** | Community detection, thematic summaries | Expensive, imprecise for individual facts |
| **Hybrid (structured + vector)** | General-purpose QA | Most complex, best overall accuracy |
| **Fine-tuned model** | Fixed domain, no real-time updates | Can't update without retraining, no citations |

Choose structured extraction when: users ask constraint-heavy questions ("under $50", "within 50 miles"), your domain has well-defined entities, accuracy is non-negotiable, or you need citeable answers.

Skip it when: users ask open-ended questions, content is primarily narrative, entities are poorly defined, or your ingestion budget is extremely tight.

Cost-breakeven rule of thumb: Structured extraction is cheaper than chunk-based RAG when the extra ingestion cost per page, multiplied by your monthly page count, is less than the query-cost saving per question, multiplied by your monthly query count. Plug in your own measured costs. The hidden variable is accuracy cost — if each hallucination costs your business $10, a 10% hallucination rate on 10,000 queries is $10,000/month in bad answers.

## 17. Enterprise Deployment Patterns

| Pattern | When to Use | Key Consideration |
|---|---|---|
| **Centralized fact store** | Multiple apps need the same facts | Schema governance + access control |
| **Domain-specific stores** | Different domains have different query patterns | Higher ops complexity, better per-domain perf |
| **Real-time extraction** | Facts change minute-by-minute (stock prices, inventory) | Cost at scale + conflict resolution |

Five observability metrics you need:

- Extraction success rate
- Fact freshness (average age of facts)
- Query precision
- Query coverage (% answered from fact store vs. chunk fallback)
- Cost per fact — the one that surprises everyone who hasn't run structured extraction at scale

## 18. Frequently Asked Questions

### Q1. How is structured data extraction for RAG different from regular web scraping?
Regular web scraping dumps raw HTML or text into a storage bucket. Structured data extraction applies a typed schema, validates every field, tracks provenance, and stores the result in a queryable index. The difference is the difference between saving a PDF to a folder and entering the PDF's data into a spreadsheet with column types, validation rules, and cell-level source notes.

### Q2. Do I need a graph database for structured RAG?
Not necessarily. PostgreSQL with pgvector handles most structured RAG workloads — attribute filtering, numeric constraints, and even basic relationship queries via JOINs. Graph databases (Neo4j, Amazon Neptune) become valuable when your queries involve multi-hop relationship traversals: "find products that are similar to product X, sold by vendors that also sell product Y, in categories that overlap with Z." If your queries are mostly single-entity with filters, stick with PostgreSQL.

### Q3. How often should I re-extract facts?
It depends on how fast your source data changes. E-commerce prices change daily — re-extract every 24 hours. SaaS documentation changes weekly — re-extract every 7 days. Reference data (product specifications, company information) changes monthly — re-extract every 30 days. The right cadence is the one where your fact staleness rate stays below your accuracy threshold.

### Q4. What happens when the extraction API returns a fact that contradicts an existing fact?
The system should flag the contradiction and apply a resolution strategy. Common strategies: prefer the most recent extraction, prefer the extraction from the official source (vendor site over retailer site), or prefer the extraction with higher confidence. Contradictions that cannot be resolved automatically should be queued for human review.

### Q5. Can structured extraction handle pages that require login?
Yes, but it requires session management. The extraction pipeline needs valid authentication credentials (cookies, API tokens, or OAuth flows) for the target domain. Ollagraph fetches public pages only and does not accept cookies or session headers, so for authenticated pages fetch the HTML yourself and run extraction on it in your own pipeline (Ollagraph endpoints that take an `html` field, such as `/v1/convert/html-to-markdown` and `/v1/extract/tables`, still work). For pages behind SSO, you may need a dedicated integration.

### Q6. How do I handle pages with multiple entities of the same type?
A product listing page might show 50 products. The extraction pipeline should return an array of entities, each with its own provenance. The schema should define whether the page is expected to contain a single entity or multiple entities, and the validation layer should check that the count is reasonable (not zero, not 10,000 from a page that should have 50).

### Q7. What is the minimum viable schema for a structured RAG system?
Three entities and two relationships. Pick the three most important entity types in your domain (e.g., Product, Vendor, Category) and the two most important relationships (e.g., Vendor sells Product, Product belongs to Category). That is enough to answer a surprising range of factual questions. Add more entities and relationships as you observe what users actually query.

### Q8. Does structured extraction work for PDF documents?
Yes, but the pipeline is different. PDFs require OCR or text extraction before the structured extraction step. The extracted text is then fed through the same schema-guided extraction pipeline. The provenance envelope for PDF facts includes the page number and bounding box coordinates instead of DOM paths.

### Q9. How does structured RAG handle ambiguous queries like "best monitor under $500"?
The structured layer handles the constraint ("under $500") deterministically. The "best" part is subjective — the system can sort by price, by rating (if extracted), or by a composite score. The LLM then explains the ranking criteria in the answer. The key is that the structured layer guarantees the price constraint is satisfied, and the LLM layer handles the qualitative ranking.

### Q10. What is the cost difference between structured and chunk-based RAG at scale?
At 100,000 pages and 10,000 queries per day: chunk-based RAG costs approximately $200/month for ingestion (embedding API calls) and $2,400/month for query (LLM context fill). Structured RAG costs approximately $1,500/month for ingestion (extraction API calls) and $1,500/month for query (fewer tokens per query, cheaper NL2SQL calls). The structured approach breaks even around 50,000 pages and becomes cheaper beyond that, while delivering significantly higher accuracy.

### Q11. How do I handle multi-language web pages in a structured extraction pipeline?
Set the language parameter on the extraction request to the expected language, or leave it unset for auto-detection. The extraction API handles most major languages (English, Spanish, French, German, Japanese, Chinese, Arabic) for entity extraction. Numeric fields like prices and dates are language-agnostic. For text fields like product names and descriptions, the extracted values are returned in the source language — your NL2SQL layer should query in that same language, or you can add a translation step between extraction and storage.

## 19. Conclusion

Structured data extraction for RAG is not a replacement for chunk-based retrieval. It is a complement — one that fills the gap where chunk-based RAG has always been weakest: factual, compositional, constraint-heavy questions that require precise answers with verifiable sources.

The architecture is straightforward: define a schema, extract entities and relationships from web pages, validate and deduplicate the results, store them in a queryable index, and let users ask questions in natural language that get translated into deterministic database queries. Every fact carries a provenance chain back to its source. Every answer can be cited. Every claim can be verified.

The trade-off is higher ingestion cost — you pay more upfront to extract and validate facts, but you save at query time and, more importantly, you ship a system that users can trust.

Not every RAG system needs structured extraction. If your users ask exploratory questions and you can tolerate occasional hallucinations, chunk-based RAG is simpler and cheaper. But if your users need facts — prices, specifications, stock levels, dates, relationships — and they need those facts to be correct, structured extraction is the difference between a demo and a production system.

Start small. Pick the three most important entity types in your domain. Define a schema. Extract facts from your top 100 pages. Build a single NL2SQL query. Measure the precision improvement. Then expand from there.

## 20. References

- [Lewis et al. (2020) — "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"](https://arxiv.org/abs/2005.11401)
- [Edge et al. (2024) — "From Local to Global: A Graph RAG Approach to Query-Focused Summarization"](https://arxiv.org/abs/2404.16130)
- [Ollagraph Engineering — Document-to-JSON Extraction: Turning Web Pages into Typed Records](/blog/document-to-json-extraction-turning-web-pages-into-typed-records/)
- [Ollagraph Engineering — How to Build a RAG Data Pipeline: From Web Scraping to Vector Search](/blog/reliable-web-data-pipelines-from-crawling-to-validated-json/)
- [Ollagraph Engineering — Evidence-Based Data Extraction: Provenance for Every Field](/blog/evidence-based-data-extraction-how-to-return-provenance-for-every-field/)
- [OpenAI — GPT-4o Structured Outputs API Reference](https://platform.openai.com/docs/guides/structured-outputs)
- Related Ollagraph cluster: [Citation Readiness Score](/blog/citation-readiness-score-how-to-build-reliable-scoring-model/), [Evidence-Based Data Extraction](/blog/evidence-based-data-extraction-how-to-return-provenance-for-every-field/), [Markdown Conversion Quality for AI](/blog/markdown-conversion-quality-for-ai-accuracy-structure-and-retrieval/), [Reliable Web Data Pipelines](/blog/reliable-web-data-pipelines-from-crawling-to-validated-json/)

## Common questions

### What is structured data extraction for RAG?

It converts unstructured web pages into typed facts: entities, attributes, relationships, and provenance. That lets retrieval operate on facts instead of passages. The result is more precise answers to questions that span multiple fields or documents.

### How is structured RAG different from chunk-based RAG?

Chunk-based RAG finds the nearest text, then asks the model to infer the answer. Structured RAG queries exact fields and links, so it can combine filters like price, availability, location, and vendor in one deterministic step. That reduces ambiguity and hallucination.

### What should I extract from each page?

Extract the facts users actually query: names, dates, prices, status, categories, identifiers, and relationships between them. Also capture source metadata such as the page URL, document section, and source text span. If a field cannot be traced back, it should not be trusted as a fact.

### Which storage model should I use for queryable facts?

Relational storage works best for numeric filters, aggregations, and reporting. Graph storage is better when answers depend on many-to-many relationships, inheritance, or traversals. A hybrid model is strongest when you need both exact filtering and semantic retrieval.

### How do I keep extracted facts accurate and citeable?

Use validation rules, deduplication, and schema constraints before facts enter retrieval. Keep provenance with every record so answers can cite the source page and extracted span. This makes debugging faster and gives users a clear audit trail.

### When should I not use structured extraction?

Use it when users ask questions with constraints, joins, or multi-hop relationships. Skip it when the task is mostly open-ended summarization or creative synthesis over a small set of passages. The upfront cost is worth it when accuracy and traceability matter.
