---
title: 'Evidence-Based Data Extraction: Provenance for Every Field'
description: 'Learn how to implement field-level provenance tracking in data extraction pipelines with JSON schemas, confidence scoring, and quality gates.'
metaTitle: 'Evidence-Based Data Extraction: Field Provenance'
metaDescription: 'Learn how to implement field-level provenance tracking in data extraction pipelines with JSON schemas, confidence scoring, and quality gates.'
primaryKeyword: 'evidence-based data extraction'
secondaryKeywords: 'provenance for every field, field-level provenance, extraction provenance envelope, data quality gates, extraction confidence scoring'
pubDate: 2026-07-30
author: 'Amit Sharma'
tags: ['guides', 'rag', 'ai-search', 'seo']
---

## Executive Summary

Every data extraction pipeline produces incorrect values at some point. A price is off by a factor of ten. A description contains navigation menu text. A stock status says "in_stock" for a discontinued product. The standard response is to open a ticket, pull the logs, and spend hours reproducing the extraction manually. This workflow is broken because logs record that an event occurred — they do not record how a specific value was derived.

Field-level provenance solves this by attaching a structured metadata envelope to every extracted value. The envelope contains the source URL, the exact DOM element the value came from, the raw text before normalization, the extraction strategy used, a confidence score, and a trace of every transformation applied. When a value is wrong, the provenance envelope tells you why within seconds instead of hours.

This article covers the complete architecture of a provenance-aware extraction pipeline: the JSON schema for provenance envelopes, Python and Node.js implementations, storage strategies for PostgreSQL, MongoDB, and Parquet, quality gates that catch problems before data reaches downstream systems, and a method for measuring what provenance costs and saves in your own pipeline.

## Key Takeaways

- Field-level provenance attaches a structured evidence envelope to every extracted value, documenting its origin, extraction method, confidence, and normalization history.
- Full provenance tracking costs some latency and a lot of extra storage per record. What it buys is faster root-cause analysis when a value is wrong.
- The provenance envelope schema covers seven dimensions: source, DOM location, extraction metadata, confidence scoring, normalization trace, quality gate results, and field identification.
- Quality gates built on provenance data catch extraction failures before they reach downstream systems.
- Tiered storage (hot/warm/cold) keeps provenance queryable without unbounded storage growth.
- The key insight is that provenance is not an optional add-on. It is a structural property of the extraction pipeline, and it must be designed in from the start. Retrofitting provenance after a pipeline is built means the extraction engine likely does not capture the raw metadata needed for a complete envelope, and the cost of adding it later is far higher than building it in from day one.

## 1. Problem Statement

You run an extraction pipeline that pulls product data from fifty competitor websites every six hours. The pipeline works — mostly. But every few days, someone on the data team notices something off. A price that should be $89.00 shows up as $8,900.00. A product description contains navigation menu text instead of the actual description. A stock status says "in_stock" for a product that has been discontinued for six months.

Each time, the same ritual plays out. Someone opens a ticket. A data engineer pulls the extraction logs. The logs show that the API returned HTTP 200 and the pipeline completed without errors. But the logs do not show what the page actually contained at extraction time, which CSS selector was used, what the raw HTML looked like, or whether the value passed through a normalization step that introduced the error.

The engineer spends two hours reproducing the extraction manually. They open the URL in a browser. The page looks correct. They check the Wayback Machine to see if the page changed. They run the extraction script locally with debug flags. Eventually they find the problem: the site added a new CSS class to its price element, the selector stopped matching, and the pipeline fell back to a different element that happened to contain a different number.

## 2. History & Context

### The Pre-Provenance Era (2000–2015)

Early web scrapers were simple. You fetched HTML with wget or curl, parsed it with regex or a lightweight DOM library, and wrote the results to a CSV file. If a value was wrong, you re-ran the scraper and watched the output. Provenance was not a concept anyone thought about — the pipeline was simple enough that you could reproduce any result in minutes. The assumption was that the web was static and deterministic. That assumption held for roughly the first decade of the web.

### The Dynamic Web Breaks Reproducibility (2015–2020)

Two things changed around 2015. First, JavaScript frameworks became the default — pages stopped being static HTML and became applications that built the DOM in the browser. Second, personalization and A/B testing became universal. The same URL could return different content depending on cookies, geolocation, and device type. Two engineers debugging the same issue from different laptops could see completely different pages. The concept of "re-running the scraper" became unreliable because the page itself might have changed.

### The Data Pipeline Maturity Model and Regulatory Push (2020–2026)

As data teams adopted modern data stacks — data warehouses, feature stores, RAG pipelines — the cost of bad data increased dramatically. A single corrupted field in a product feed could propagate to pricing algorithms, inventory forecasts, and customer-facing search results. Teams added validation layers (Pydantic, Zod, Great Expectations), but validation alone could not answer the fundamental question: was the value wrong because the page changed, because the parser broke, or because the normalization logic had a bug? Validation tells you that something is wrong. Provenance tells you why.

The industry is converging on a standard pattern: every extracted field should carry a provenance envelope. This builds on the same principles we covered in Document-to-JSON Extraction, where we introduced evidence packets at the record level. Field-level provenance extends that idea one level deeper — instead of one evidence packet per record, you get one per field.

## 3. What Is Field-Level Provenance?

**Definition: Field-Level Provenance** — A structured metadata record attached to each extracted value that documents its origin (source URL and DOM location), extraction method (selector strategy and normalization steps), confidence (how reliable the extraction is), and raw input (the unmodified text before any transformation).

Provenance is often confused with related concepts:

- **Logging** — What It Records: That an event occurred. Example: "Extraction job #4421 completed at 14:32:05"
- **Audit trail** — What It Records: Who did what and when. Example: "User user@example.com triggered re-extraction of product 8832"
- **Provenance** — What It Records: How a specific value was derived. Example: "Field price = 1299.00, extracted from div.price span.amount via CSS selector, raw text was '$1,299.00', confidence 0.97"
- **Lineage** — What It Records: How data flows through a system. Example: "Field price → normalization → validation → database column products.price"

The provenance envelope schema in this article is inspired by the W3C PROV-O ontology, which defines standard relationships between entities, activities, and agents. Our field-level envelope maps to PROV-O as follows: the extracted value is a `prov:Entity`, the extraction and normalization steps are `prov:Activity` nodes, and the extraction pipeline is a `prov:Agent`. This alignment means provenance envelopes can be exported as PROV-O-compatible RDF for enterprise data governance platforms.

### What a Provenance Envelope Contains

- source URL or document ID
- DOM location (CSS selector path, XPath, or byte range)
- raw text before normalization
- extraction strategy (CSS selector, AI extraction, regex, etc.)
- confidence score (0.0–1.0)
- normalization trace (every transformation applied)
- timestamp
- an optional DOM snapshot reference

### Why Field-Level Detail Matters

Pipeline-level provenance (recording that an extraction job ran) is not enough. When a single field out of fifty is wrong, you need to know which field, why it failed, and whether the failure is systematic or isolated. Consider a product extraction pipeline that pulls 20 fields per product across 10,000 products — 200,000 individual field extractions per run. If 1% of fields have issues, you have 2,000 problematic values. Without field-level provenance, finding and fixing those is a needle-in-a-haystack problem. With provenance, you can query by confidence threshold, strategy type, or DOM path and identify the failing subset in seconds.

## 4. Architecture: The Provenance Stack

A provenance-aware extraction pipeline has five layers. Each layer adds specific provenance metadata that the next layer can use for validation, debugging, or quality scoring.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 5: Storage & Query                                               │
│ (Provenance envelopes indexed and queryable by field path, confidence) │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 4: Quality Gate                                                  │
│ (Validate provenance completeness, check confidence thresholds)        │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Normalization                                                 │
│ (Type coercion, currency parsing, trace every transform)               │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Extraction Engine                                             │
│ (Locate target element via strategy, record selector, confidence)      │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 1: Fetch & Render                                                │
│ (Fetch URL, record status code, headers, DOM snapshot reference)       │
└────────────────────────────────────────────────────────────────────────┘
```

### Layer 1: Fetch & Render

Records target URL, final URL (after redirects), HTTP status code, response headers, fetch duration, render mode (static HTTP vs. headless browser), and an optional DOM snapshot reference. This layer answers: what did the page actually look like when the extraction ran?

### Layer 2: Extraction Engine

Records strategy used (css_selector, xpath, ai_extraction, llm_prompt, regex, json_ld, meta_tag, schema_org, visual_analysis), selector path, match count, raw text, and confidence score computed from match quality, element visibility, and strategy reliability. This layer answers: how was the value located, and what did the source say?

### Layer 3: Normalization

Records raw value, normalized value, an ordered normalization trace (every transformation applied with parameters), and any coercion errors. This layer answers: what transformations were applied to get from raw text to the final value?

### Layer 4: Quality Gate

Evaluates provenance completeness (are all required fields present?), confidence threshold (is the score above the configured minimum?), cross-field consistency (do related fields share the same source context?), and normalization validity (did all coercions succeed?). This layer answers: can we trust this value?

### Layer 5: Storage & Query

Persists provenance envelopes in a queryable format — JSONB in PostgreSQL, document store in MongoDB, or Parquet in S3. Indexes on field path, confidence score, strategy type, and timestamp. Retention policies typically 30–90 days. This layer answers: how do I find problematic extractions without scanning every record?

## 5. Components & Workflow

Here is the step-by-step workflow for extracting a single record with full provenance tracking:

```
Step 1: Fetch URL
        │
        ▼
Step 2: Render page (if needed)
        │
        ▼
Step 3: For each field in schema:
        │
        ├── 3a. Locate element using configured strategy
        ├── 3b. Extract raw text from DOM
        ├── 3c. Compute confidence score
        ├── 3d. Record selector path and strategy metadata
        │
        ▼
Step 4: Build raw provenance envelope
        │
        ▼
Step 5: Normalize each field (type coercion, formatting)
        │
        ▼
Step 6: Append normalization trace to provenance envelope
        │
        ▼
Step 7: Run quality gate on provenance envelope
        │
        ├── PASS → Emit validated record + provenance envelope
        └── FAIL → Route to retry queue or manual review
```

### Component Responsibilities

| Component | Responsibility | Provenance Output |
|---|---|---|
| **Fetcher** | Retrieve the page, handle redirects, manage cookies | Fetch metadata (URL, status, timing, render mode) |
| **Renderer** | Execute JavaScript, wait for dynamic content | Render metadata (duration, network requests) |
| **DOM Snapshotter** | Capture compressed DOM tree for forensic replay | Snapshot reference (S3 key or file path) |
| **Element Locator** | Find target elements using configured strategies | Selector path, match count, strategy type |
| **Text Extractor** | Extract raw text from matched elements | Raw text, element attributes, visibility flags |
| **Confidence Scorer** | Compute extraction confidence from multiple signals | Confidence score (0.0–1.0), signal breakdown |
| **Normalizer** | Apply type coercion and formatting transformations | Normalization trace (ordered list of transforms) |
| **Quality Gate** | Validate provenance completeness and confidence thresholds | Gate result (pass/fail), reason for failure |
| **Provenance Assembler** | Combine all metadata into a structured envelope | Complete provenance envelope |
| **Storage Engine** | Persist envelopes in a queryable store | Indexed envelope in database |

## 6. The Provenance Envelope Schema

Below is the JSON Schema for a provenance envelope. Each extracted field gets its own envelope, and a record-level envelope groups all field envelopes together with shared fetch context.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "FieldProvenanceEnvelope",
  "type": "object",
  "properties": {
    "field_name": { "type": "string" },
    "source": {
      "type": "object",
      "properties": {
        "url": { "type": "string", "format": "uri" },
        "fetch_timestamp": { "type": "string", "format": "date-time" },
        "fetch_duration_ms": { "type": "integer" },
        "render_mode": { "type": "string", "enum": ["static_http", "headless_browser"] }
      },
      "required": ["url", "fetch_timestamp"]
    },
    "dom_location": {
      "type": "object",
      "properties": {
        "selector": { "type": "string" },
        "xpath": { "type": "string" },
        "byte_offset_start": { "type": "integer" },
        "byte_offset_end": { "type": "integer" },
        "tag_name": { "type": "string" },
        "attributes": { "type": "object" }
      },
      "required": ["selector"]
    },
    "extraction": {
      "type": "object",
      "properties": {
        "strategy": { "type": "string", "enum": ["css_selector", "xpath", "ai_extraction", "llm_prompt", "regex", "json_ld", "meta_tag", "schema_org", "visual_analysis"] },
        "strategy_config": { "type": "object" },
        "match_count": { "type": "integer", "minimum": 0 },
        "match_index": { "type": "integer", "minimum": 0 },
        "raw_text": { "type": "string" },
        "raw_html_snippet": { "type": "string" },
        "element_visible": { "type": "boolean" }
      },
      "required": ["strategy", "raw_text"]
    },
    "confidence": {
      "type": "object",
      "properties": {
        "overall": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
        "signals": {
          "type": "object",
          "properties": {
            "selector_match_quality": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
            "element_visibility": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
            "text_plausibility": { "type": "number", "minimum": 0.0, "maximum": 1.0 },
            "strategy_reliability": { "type": "number", "minimum": 0.0, "maximum": 1.0 }
          }
        }
      },
      "required": ["overall"]
    },
    "normalization": {
      "type": "object",
      "properties": {
        "raw_value": { "type": "string" },
        "normalized_value": {},
        "target_type": { "type": "string", "enum": ["string", "number", "integer", "boolean", "date", "datetime", "enum", "array", "object"] },
        "trace": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "step": { "type": "integer" },
              "operation": { "type": "string" },
              "input": { "type": "string" },
              "output": {},
              "success": { "type": "boolean" }
            },
            "required": ["step", "operation", "input", "output", "success"]
          }
        },
        "errors": { "type": "array" }
      },
      "required": ["raw_value", "normalized_value", "target_type", "trace"]
    },
    "quality": {
      "type": "object",
      "properties": {
        "gate_passed": { "type": "boolean" },
        "gate_reason": { "type": "string" },
        "completeness_score": { "type": "number", "minimum": 0.0, "maximum": 1.0 }
      },
      "required": ["gate_passed"]
    }
  },
  "required": ["field_name", "source", "dom_location", "extraction", "confidence", "normalization", "quality"]
}
```

Record-level envelope (wraps all field envelopes with shared fetch context):

```json
{
  "record_id": "prod-20260728-00421",
  "schema_name": "ProductRecord",
  "schema_version": "v2.1.0",
  "extraction_timestamp": "2026-07-28T14:32:05.123Z",
  "pipeline_version": "product-extractor-v1.4.2",
  "shared_source": {
    "url": "https://example.com/products/widget-pro",
    "fetch_timestamp": "2026-07-28T14:32:05.123Z",
    "fetch_duration_ms": 2340,
    "render_mode": "headless_browser",
    "dom_snapshot_ref": "s3://your-snapshot-bucket/2026/07/28/snap-00421.html.gz"
  },
  "fields": {
    "title": {},
    "price": {},
    "availability": {},
    "description": {},
    "specs": {}
  },
  "summary": {
    "total_fields": 5,
    "fields_passed": 4,
    "fields_failed": 1,
    "average_confidence": 0.91,
    "lowest_confidence_field": "price",
    "lowest_confidence_score": 0.67
  }
}
```

## 7. Implementation: Python

The Ollagraph API fetches the page and returns the structured data embedded in it (JSON-LD, Microdata, OpenGraph). It does not take a schema and does not return provenance, so the envelope below is assembled in your own code from what you requested and received: the URL, the fetch time, where each value sat in the response, and its raw source text. When a field fails, the retry fetches the page HTML with `/v1/scrape` and re-extracts just that field with your own selector.

```python
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone
import os
import requests
from bs4 import BeautifulSoup

class Availability(str, Enum):
    IN_STOCK = "IN_STOCK"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    PREORDER = "PREORDER"
    DISCONTINUED = "DISCONTINUED"

class ProductSpec(BaseModel):
    name: str = Field(..., min_length=1)
    value: str = Field(..., min_length=1)

class ProductRecord(BaseModel):
    sku: str = Field(..., pattern=r"^[A-Z0-9]{6,12}$")
    title: str = Field(..., min_length=3)
    price: float = Field(..., gt=0.0)
    availability: Availability
    specs: List[ProductSpec] = Field(..., min_items=1)
    last_updated: datetime

OLLAGRAPH_API = "https://api.ollagraph.com"
HEADERS = {"Authorization": f"Bearer {os.environ['OLLAGRAPH_API_KEY']}"}
AVAILABILITY_MAP = {"InStock": "IN_STOCK", "OutOfStock": "OUT_OF_STOCK",
                    "PreOrder": "PREORDER", "Discontinued": "DISCONTINUED"}

def find_typed_objects(node, type_name: str, path: str = ""):
    """Yield (path, object) for every schema.org object of the given @type."""
    if isinstance(node, dict):
        node_type = node.get("@type")
        if node_type == type_name or (isinstance(node_type, list) and type_name in node_type):
            yield path or "/", node
        for key, value in node.items():
            yield from find_typed_objects(value, type_name, f"{path}/{key}")
    elif isinstance(node, list):
        for i, item in enumerate(node):
            yield from find_typed_objects(item, type_name, f"{path}/{i}")

def field_envelope(name, source, location, strategy, raw, value, gate_passed, reason=None):
    return {
        "field_name": name,
        "source": source,
        "dom_location": {"selector": location},
        "extraction": {"strategy": strategy, "raw_text": None if raw is None else str(raw)},
        "confidence": {"overall": 1.0 if gate_passed else 0.0},  # swap in your own multi-signal scorer
        "normalization": {"raw_value": raw, "normalized_value": value, "trace": []},
        "quality": {"gate_passed": gate_passed, "gate_reason": reason},
    }

def extract_with_provenance(url: str, schema_model=ProductRecord) -> Dict[str, Any]:
    # The API fetches the page and returns the structured data embedded in it.
    # It takes only url, stealth, timeout and proxy: the provenance is built here.
    fetch_timestamp = datetime.now(timezone.utc).isoformat()
    resp = requests.post(
        f"{OLLAGRAPH_API}/v1/extract/structured",
        json={"url": url, "timeout": 30},
        headers=HEADERS,
        timeout=60
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Extraction failed: HTTP {resp.status_code}")
    source = {"url": url, "fetch_timestamp": fetch_timestamp}

    path, product = next(find_typed_objects(resp.json(), "Product"), ("", {}))
    offer = product.get("offers") or {}
    if isinstance(offer, list):
        offer = offer[0] if offer else {}

    # field -> (where the raw value sits in the response, raw source value)
    raw = {
        "sku": (f"{path}/sku", product.get("sku")),
        "title": (f"{path}/name", product.get("name")),
        "price": (f"{path}/offers/price", offer.get("price")),
        "availability": (f"{path}/offers/availability", offer.get("availability")),
        "specs": (f"{path}/additionalProperty", product.get("additionalProperty")),
        "last_updated": (f"{path}/dateModified", product.get("dateModified")),
    }
    availability = raw["availability"][1]
    specs = raw["specs"][1] or []
    if isinstance(specs, dict):
        specs = [specs]
    candidate = {
        "sku": raw["sku"][1],
        "title": raw["title"][1],
        "price": raw["price"][1],
        "availability": AVAILABILITY_MAP.get(str(availability).rstrip("/").rsplit("/", 1)[-1]) if availability else None,
        "specs": [{"name": p.get("name"), "value": str(p.get("value"))} for p in specs],
        "last_updated": raw["last_updated"][1],
    }

    failed = {}
    try:
        data = schema_model.model_validate(candidate).model_dump(mode="json")
    except ValidationError as err:
        data = None
        for e in err.errors():
            failed.setdefault(str(e["loc"][0]), e["msg"])

    fields = {
        name: field_envelope(name, source, location, "json_ld_or_microdata", value,
                             candidate[name], name not in failed, failed.get(name))
        for name, (location, value) in raw.items()
    }
    return {"data": data, "provenance": {"source": source, "fields": fields}}

def inspect_field_provenance(result: Dict[str, Any], field_name: str):
    prov = result.get("provenance", {}).get("fields", {}).get(field_name)
    if not prov:
        return print(f"No provenance for '{field_name}'")
    s, d, e, c, n, q = prov["source"], prov["dom_location"], prov["extraction"], prov["confidence"], prov["normalization"], prov["quality"]
    print(f"URL: {s['url']} | Fetched: {s['fetch_timestamp']} | Location: {d['selector']} | Strategy: {e['strategy']} | Raw: '{e['raw_text']}' | Confidence: {c['overall']:.3f} | Gate: {'PASS' if q['gate_passed'] else 'FAIL'}")
    for step in n.get("trace", []):
        print(f"  Step {step['step']}: {step['operation']} '{step['input']}' -> '{step['output']}' {'✓' if step['success'] else '✗'}")

def find_low_confidence_fields(results: List[Dict[str, Any]], threshold: float = 0.7) -> List[Dict[str, Any]]:
    issues = []
    for r in results:
        for fn, fp in r.get("provenance", {}).get("fields", {}).items():
            c = fp.get("confidence", {}).get("overall", 0.0)
            if c < threshold:
                issues.append({
                    "record_id": (r.get("data") or {}).get("sku", "unknown"),
                    "field": fn,
                    "confidence": c,
                    "raw_text": fp.get("extraction", {}).get("raw_text"),
                    "selector": fp.get("dom_location", {}).get("selector"),
                    "strategy": fp.get("extraction", {}).get("strategy")
                })
    return issues

def retry_failed_fields_from_html(url: str, selectors: Dict[str, str]) -> Dict[str, Any]:
    """Escalation: fetch the page HTML with /v1/scrape and re-extract only the
    failed fields with your own CSS selectors ({field_name: selector})."""
    fetch_timestamp = datetime.now(timezone.utc).isoformat()
    resp = requests.post(
        f"{OLLAGRAPH_API}/v1/scrape",
        json={"url": url, "format": "html", "wait_until": "networkidle0"},
        headers=HEADERS,
        timeout=90
    )
    if resp.status_code != 200:
        raise RuntimeError(f"Retry failed: HTTP {resp.status_code}")
    soup = BeautifulSoup(resp.json()["content"], "html.parser")
    source = {"url": url, "fetch_timestamp": fetch_timestamp}
    fields = {}
    for name, selector in selectors.items():
        el = soup.select_one(selector)
        text = el.get_text(strip=True) if el else None
        fields[name] = field_envelope(name, source, selector, "css_selector", text, None, text is not None)
    return {"provenance": {"source": source, "fields": fields}}
```

## 8. Implementation: Node.js

Here is the equivalent implementation in Node.js with TypeScript, using Zod for schema validation.

```typescript
import { z } from "zod";

const AvailabilityEnum = z.enum(["IN_STOCK", "OUT_OF_STOCK", "PREORDER", "DISCONTINUED"]);
const ProductRecordSchema = z.object({
  sku: z.string().regex(/^[A-Z0-9]{6,12}$/),
  title: z.string().min(3),
  price: z.number().positive(),
  availability: AvailabilityEnum,
  specs: z.array(z.object({ name: z.string().min(1), value: z.string().min(1) })).min(1),
  last_updated: z.string().datetime(),
});
type ProductRecord = z.infer<typeof ProductRecordSchema>;

const AVAILABILITY_MAP: Record<string, string> = {
  InStock: "IN_STOCK", OutOfStock: "OUT_OF_STOCK", PreOrder: "PREORDER", Discontinued: "DISCONTINUED",
};

// Yield [path, object] for every schema.org object of the given @type.
function* findTyped(node: any, type: string, path = ""): Generator<[string, any]> {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* findTyped(node[i], type, `${path}/${i}`);
  } else if (node && typeof node === "object") {
    const t = node["@type"];
    if (t === type || (Array.isArray(t) && t.includes(type))) yield [path || "/", node];
    for (const [k, v] of Object.entries(node)) yield* findTyped(v, type, `${path}/${k}`);
  }
}

async function extractWithProvenance(url: string): Promise<{ data: ProductRecord | null; provenance: any }> {
  // The API fetches the page and returns its embedded structured data
  // (it takes only url, stealth, timeout, proxy). Provenance is built here.
  const fetchTimestamp = new Date().toISOString();
  const resp = await fetch("https://api.ollagraph.com/v1/extract/structured", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OLLAGRAPH_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, timeout: 30 }),
  });
  if (!resp.ok) throw new Error(`Extraction failed: HTTP ${resp.status}`);
  const body = await resp.json();
  const source = { url, fetch_timestamp: fetchTimestamp };

  const [path, product] = [...findTyped(body, "Product")][0] ?? ["", {}];
  const offer = (Array.isArray(product.offers) ? product.offers[0] : product.offers) ?? {};
  const specs = product.additionalProperty ?? [];

  // field -> [where the raw value sits in the response, raw source value]
  const raw: Record<string, [string, unknown]> = {
    sku: [`${path}/sku`, product.sku],
    title: [`${path}/name`, product.name],
    price: [`${path}/offers/price`, offer.price],
    availability: [`${path}/offers/availability`, offer.availability],
    specs: [`${path}/additionalProperty`, product.additionalProperty],
    last_updated: [`${path}/dateModified`, product.dateModified],
  };
  const candidate: Record<string, unknown> = {
    sku: product.sku,
    title: product.name,
    price: offer.price === undefined ? undefined : Number(offer.price),
    availability: AVAILABILITY_MAP[String(offer.availability ?? "").split("/").pop() ?? ""],
    specs: (Array.isArray(specs) ? specs : [specs]).map((p: any) => ({ name: p.name, value: String(p.value) })),
    last_updated: product.dateModified,
  };

  const parsed = ProductRecordSchema.safeParse(candidate);
  const failed = new Map<string, string>();
  if (!parsed.success) {
    for (const issue of parsed.error.issues) failed.set(String(issue.path[0]), issue.message);
  }

  const fields: Record<string, any> = {};
  for (const [name, [location, rawValue]] of Object.entries(raw)) {
    fields[name] = {
      field_name: name,
      source,
      dom_location: { selector: location },
      extraction: {
        strategy: "json_ld_or_microdata",
        raw_text: rawValue == null ? null : typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue),
      },
      confidence: { overall: failed.has(name) ? 0.0 : 1.0 }, // swap in your own multi-signal scorer
      normalization: { raw_value: rawValue, normalized_value: candidate[name] },
      quality: { gate_passed: !failed.has(name), gate_reason: failed.get(name) },
    };
  }
  return { data: parsed.success ? parsed.data : null, provenance: { source, fields } };
}

function findLowConfidenceFields(results: { data: any; provenance: any }[], threshold = 0.7) {
  const issues: any[] = [];
  for (const r of results) {
    for (const [fn, fp] of Object.entries(r.provenance.fields || {})) {
      const c = (fp as any).confidence.overall;
      if (c < threshold) {
        issues.push({
          recordId: (r.data as any)?.sku || "unknown",
          field: fn,
          confidence: c,
          rawText: (fp as any).extraction.raw_text,
          selector: (fp as any).dom_location.selector,
          strategy: (fp as any).extraction.strategy
        });
      }
    }
  }
  return issues;
}
```

## 9. Provenance Storage & Query Strategies

### Option 1: Embedded JSONB (PostgreSQL)

Store the provenance envelope as a JSONB column alongside the extracted data. Simplest approach, works well when querying provenance alongside the data.

```sql
CREATE TABLE extracted_products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(20) NOT NULL,
    title TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    availability VARCHAR(20) NOT NULL,
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    provenance JSONB NOT NULL,
    UNIQUE(sku, extracted_at)
);

CREATE INDEX idx_prov_conf ON extracted_products USING GIN ((provenance -> 'summary' -> 'average_confidence'));
CREATE INDEX idx_prov_fields ON extracted_products USING GIN ((provenance -> 'fields'));

SELECT sku, title, price FROM extracted_products
WHERE (provenance -> 'summary' ->> 'lowest_confidence_score')::numeric < 0.7;
```

### Option 2: Separate Provenance Store (MongoDB)

```javascript
const provSchema = new Schema({
  recordId: { type: String, required: true, index: true },
  extractionTimestamp: { type: Date, default: Date.now, index: true },
  sharedSource: { url: String, fetchTimestamp: Date, fetchDurationMs: Number, renderMode: String, domSnapshotRef: String },
  fields: Schema.Types.Mixed,
  summary: { totalFields: Number, fieldsPassed: Number, fieldsFailed: Number, averageConfidence: Number, lowestConfidenceField: String, lowestConfidenceScore: Number },
}, { timestamps: true });

provSchema.index({ "summary.lowest_confidence_score": 1 });
provSchema.index({ "extractionTimestamp": -1, "summary.average_confidence": 1 });
provSchema.index({ "fields.price.confidence.overall": 1 });
provSchema.index({ "extractionTimestamp": 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90-day TTL
```

### Option 3: Columnar Storage (Parquet + S3)

```python
import pandas as pd, pyarrow as pa, pyarrow.parquet as pq

def store_provenance_parquet(records: list, path: str = "s3://your-provenance-bucket/"):
    df = pd.DataFrame(records)
    df["extraction_date"] = pd.to_datetime(df["extraction_timestamp"]).dt.date
    pq.write_to_dataset(
        pa.Table.from_pandas(df),
        root_path=path,
        partition_cols=["extraction_date", "schema_name"],
        compression="zstd"
    )
```

## 10. Performance & Benchmarks

Provenance overhead depends on your pages, your envelope, and your storage engine, so measure it on your own pipeline. Run the same sample of pages through three configurations — no provenance, minimal provenance (source, selector, raw text, confidence), and full provenance (the complete envelope plus DOM snapshot and normalization trace) — and compare them on the dimensions below.

### Latency Overhead

Time each stage per page: fetch and render, element location, text extraction, provenance capture, normalization, and quality gate. Fetch and render usually dominate total time, so judge the provenance-capture and quality-gate stages against that baseline rather than in isolation.

### Storage Overhead

Measure the extracted data per record and the provenance envelope per record, then multiply by your daily record volume to project daily and monthly growth. DOM snapshots tend to be the largest part of a full envelope, so measure with and without them.

### Debugging Impact

The payoff shows up in incident handling, so track real incidents before and after you add provenance: mean time to resolution (MTTR), the share of incidents that needed a manual re-extraction, the share where the root cause was found within 30 minutes, and the false positive rate of your data quality alerts.

### Cost Analysis

Put the extra compute and storage cost of each configuration next to the engineering time your team spends debugging extraction incidents under it. If provenance shortens investigations, the saved debugging time is what pays for the storage.

### Live Query: Finding Low-Confidence Fields

```sql
SELECT p.sku, f.field_name, f.confidence, f.raw_text, f.selector, f.strategy
FROM extracted_products p,
     jsonb_to_recordset(p.provenance #> '{fields}') AS f(field_name text, confidence jsonb, raw_text text, selector text, strategy text)
WHERE (f.confidence->>'overall')::numeric < 0.7 AND p.extracted_at > NOW() - INTERVAL '1 hour'
ORDER BY (f.confidence->>'overall')::numeric ASC;
```

**Output:**

```
  sku    | field_name   | confidence | raw_text              | selector                     | strategy
---------+--------------+------------+-----------------------+------------------------------+--------------
 PRO-442 | price        | 0.42       | "Call for pricing"    | div.pricing .amount span     | css_selector
 PRO-018 | availability | 0.51       | ""                    | span.stock-badge             | css_selector
 PRO-883 | price        | 0.55       | "$0.00"               | div.price span.amount        | css_selector
 PRO-231 | description  | 0.61       | "Click here to learn" | div.product-desc p           | css_selector
 PRO-774 | specs        | 0.67       | "[]"                  | table.specs tbody tr         | css_selector
(5 rows)
```

## 11. Using Provenance for Quality Gates

Provenance is not just for debugging after something breaks. You can use it proactively to build quality gates that catch problems before data reaches downstream systems.

### Gate 1: Provenance Completeness

Reject any record where required provenance fields are missing:

```python
def check_provenance_completeness(provenance: dict) -> bool:
    for fp in provenance.get("fields", {}).values():
        if not fp.get("dom_location", {}).get("selector"):
            return False
        if not fp.get("extraction", {}).get("raw_text"):
            return False
        if fp.get("confidence", {}).get("overall") is None:
            return False
    return True
```

### Gate 2: Confidence Threshold

Reject any field where confidence falls below a configurable threshold:

```python
def check_confidence_threshold(provenance: dict, threshold: float = 0.7, hard_fail: list = None) -> tuple:
    failures = []
    for fn, fp in provenance.get("fields", {}).items():
        c = fp.get("confidence", {}).get("overall", 0.0)
        if c < threshold:
            failures.append({
                "field": fn,
                "confidence": c,
                "hard_fail": hard_fail and fn in hard_fail,
                "raw_text": fp.get("extraction", {}).get("raw_text")
            })
    return len(failures) == 0 or all(not f["hard_fail"] for f in failures), failures
```

### Gate 3: Cross-Field Consistency

```python
def check_cross_field_consistency(provenance: dict) -> list:
    fields, issues = provenance.get("fields", {}), []
    urls = {fp.get("source", {}).get("url") for fp in fields.values()}
    if len(urls) > 1:
        issues.append({"type": "inconsistent_source_url", "detail": f"{len(urls)} different URLs: {urls}"})
    timestamps = [fp.get("source", {}).get("fetch_timestamp") for fp in fields.values() if fp.get("source", {}).get("fetch_timestamp")]
    if len(timestamps) > 1:
        from datetime import datetime
        diff = max(datetime.fromisoformat(t) for t in timestamps) - min(datetime.fromisoformat(t) for t in timestamps)
        if diff.total_seconds() > 60:
            issues.append({"type": "timestamp_spread", "detail": f"Timestamps span {diff.total_seconds():.0f}s"})
    raw_map = {}
    for fn, fp in fields.items():
        raw = fp.get("extraction", {}).get("raw_text", "")
        raw_map.setdefault(raw, []).append(fn)
    for raw, names in raw_map.items():
        if len(names) > 1 and raw.strip():
            issues.append({"type": "duplicate_raw_text", "detail": f"Fields {names} share raw text: '{raw[:50]}'"})
    return issues
```

## 12. Security Considerations

### Provenance Data Sensitivity

Provenance envelopes can contain sensitive information. Raw HTML snippets and DOM snapshots may include PII (email addresses, phone numbers), session tokens, or internal identifiers leaked through data attributes.

**Mitigations:** Run raw HTML through a PII scrubber before storage. Only capture the DOM subtree containing extracted elements, not the full page. Apply the same IAM policies to provenance data as to the extracted data itself. Set retention limits of 30–90 days.

### Compliance Considerations

| Regulation | Provenance Requirement | Implementation |
|---|---|---|
| **GDPR Article 22** | Right to explanation for automated decisions | Provenance envelope provides chain of evidence for each input |
| **EU AI Act Art. 10** | Data governance for high-risk AI systems | Provenance documents origin and processing of data |
| **SOC 2 Type II** | Data integrity and processing integrity | Provenance gates ensure data was not corrupted |
| **ISO/IEC 42001** | Documented information about data sources | Provenance store serves as documented record |

### Storage Encryption

Encrypt provenance data at rest using AES-256 (S3 server-side encryption with KMS). Use TLS 1.3 for all data in transit. Apply row-level security policies to restrict access by team or use case.

## 13. Troubleshooting

**Issue 1: Missing Selector Path**
- **Symptom:** `dom_location.selector` is empty or generic (`html > body > div`).
- **Cause:** AI extraction couldn't map result to a DOM element.
- **Fix:** Add a fallback CSS selector strategy to your extractor's configuration.

```json
{
  "extraction_strategies": {
    "primary": "ai_extraction",
    "fallback": "css_selector"
  },
  "provenance": {
    "enabled": true,
    "depth": "full"
  }
}
```

**Issue 2: Confidence Score Is Always 1.0**
- **Symptom:** Every field reports 1.0 even when values are wrong.
- **Cause:** No signals configured — scorer defaults to 1.0.
- **Fix:** Enable signal-based scoring in your own scorer's configuration.

```json
{
  "confidence_scoring": {
    "mode": "signal_based",
    "signals": ["selector_match_quality", "element_visibility", "text_plausibility", "strategy_reliability"]
  }
}
```

**Issue 3: Normalization Trace Is Empty**
- **Symptom:** `normalization.trace` is empty despite differing raw/normalized values.
- **Cause:** Normalization isn't instrumented to record transforms.
- **Fix:** Use a tracing decorator.

```python
from functools import wraps

def traced_normalization(op: str):
    def decorator(f):
        @wraps(f)
        def wrapper(v, trace=None, *a, **kw):
            r = f(v, *a, **kw)
            if trace is not None:
                trace.append({
                    "step": len(trace) + 1,
                    "operation": op,
                    "input": str(v),
                    "output": str(r),
                    "success": True
                })
            return r
        return wrapper
    return decorator

@traced_normalization("strip_currency")
def strip_currency(v: str) -> str:
    return v.replace("$", "").replace(",", "")
```

**Issue 4: Provenance Storage Growing Too Fast**
- **Symptom:** Provenance outgrows extracted data.
- **Cause:** DOM snapshots stored uncompressed for every extraction.
- **Fix:** Tiered retention.

```python
PROVENANCE_TIERS = {
    "hot": {"retention_days": 7, "include_dom_snapshot": True, "storage": "postgres_jsonb"},
    "warm": {"retention_days": 30, "include_dom_snapshot": False, "storage": "postgres_jsonb"},
    "cold": {"retention_days": 90, "include_dom_snapshot": False, "include_normalization_trace": False, "storage": "s3_parquet"}
}
```

## 14. Best Practices

1. **Design Provenance into the Schema, Not as an Afterthought**  
   The most common mistake teams make is adding provenance after the pipeline is built. By then, the extraction engine does not capture the metadata needed for a complete envelope, and retrofitting requires rewriting core components. Define your provenance requirements at the same time you define your extraction schema.

2. **Use a Standardized Provenance Envelope Format**  
   Adopt a standard schema for provenance envelopes across your organization. The schema in this article is a starting point — keep the core fields consistent. When every pipeline emits provenance in the same format, you can build cross-pipeline tooling for monitoring, alerting, and debugging.

3. **Store Raw Text, Not Just Normalized Values**  
   The single most valuable piece of provenance metadata is the raw text before normalization. When a normalized value looks wrong, the raw text is the first thing you check. Without it, you cannot tell whether the extraction was correct and the normalization introduced the error, or the extraction itself was wrong.

4. **Set Confidence Thresholds Per Field, Not Per Record**  
   Different fields have different reliability requirements. A product title can tolerate lower confidence because a wrong title is obvious downstream. A price field should have a high threshold because a wrong price can cause financial errors. Configure thresholds at the field level.

5. **Implement Tiered Provenance Retention**  
   Keep full provenance (with DOM snapshots) for 7 days for active debugging. Keep minimal provenance for 30 days for trend analysis. Keep summary-level provenance for 90 days for compliance. Delete or anonymize after that.

6. **Make Provenance Queryable**  
   Index by confidence score, strategy type, field name, and timestamp. Build a simple dashboard showing provenance health metrics: percentage of fields passing the quality gate, average confidence by strategy, and top failing fields.

## 15. Common Mistakes

1. **Confusing Logging with Provenance**  
   Logging records that an event occurred. Provenance records how a specific value was derived. A log entry that says "extraction job #4421 completed" is not provenance. A provenance envelope that says "field price = 1299.00, extracted from div.price span.amount via CSS selector, raw text was '$1,299.00'" is provenance. Teams that replace provenance with logging end up with the same debugging problem: they know something happened, but they cannot trace any specific value back to its source.

2. **Storing Only the Normalized Value**  
   This is the most common provenance mistake. The pipeline extracts a value, normalizes it, and stores only the final result. When the normalized value is wrong, there is no way to tell whether the source page had the wrong value, the extraction picked the wrong element, or the normalization introduced the error. Always store the raw text alongside the normalized value.

3. **Using a Single Confidence Threshold for All Fields**  
   A single threshold of 0.7 applied to all fields means a critical field like price and a non-critical field like description are held to the same standard. Either the threshold is too low for critical fields (allowing bad prices through) or too high for non-critical fields (generating false positives). Set field-specific thresholds based on business impact.

4. **Not Indexing Provenance Data**  
   Provenance is only useful if you can find it. Storing provenance in a JSONB column without indexes means every query requires a full table scan. Index the fields you query most often: confidence score, strategy type, field name, and extraction timestamp.

5. **Keeping Provenance Forever**  
   Provenance data accumulates fast. At an assumed 5 KB of provenance per record, a pipeline extracting 10,000 records per day generates about 50 MB per day, or 1.5 GB per month. Without a retention policy, storage costs grow linearly and query performance degrades. Implement tiered retention and delete or archive after 90 days.

## 16. Alternatives & Comparison

### Provenance Approaches Compared

| Approach | Depth | Overhead | Debugging Value | Compliance Readiness | Complexity |
|---|---|---|---|---|---|
| **No provenance** | None | None | None | None | Low |
| **Pipeline logging** | Job-level only | Negligible | Minimal | None | Low |
| **Field-level provenance (minimal)** | Source, selector, raw text, confidence | Low latency, moderate storage | High | Partial | Medium |
| **Field-level provenance (full)** | Full envelope + DOM snapshot + normalization trace | Low latency, high storage | Very high | Full | Medium-High |
| **Full lineage tracking** | End-to-end from source to consumer | Highest | Maximum | Full | High |

### When to Use Each Approach

| Use Case | Recommended Approach | Rationale |
|---|---|---|
| **Internal dashboard with low data quality requirements** | No provenance or pipeline logging | Cost of bad data is low |
| **E-commerce product feed** | Minimal field-level provenance | Wrong prices have direct revenue impact |
| **Financial data extraction** | Full field-level provenance | Compliance requirements (SOX, audit) |
| **RAG pipeline grounding data** | Full field-level provenance | AI governance requirements (EU AI Act) |
| **Healthcare or legal data** | Full lineage tracking | Regulatory compliance (HIPAA, GDPR) |
| **High-volume social media monitoring** | Minimal provenance with sampling | Volume makes full provenance cost-prohibitive |

### Ollagraph vs. Building Your Own

| Factor | Ollagraph for fetching + your provenance code | Fully DIY pipeline |
|---|---|---|
| **Fetching & proxy routing** | Handled by the API (`/v1/extract/structured`, `/v1/scrape`) | Must build and maintain yourself |
| **Provenance envelope** | Built in your code from what you fetched | Built in your code |
| **DOM snapshot storage** | Your storage (Ollagraph does not store page content) | Your storage |
| **Confidence scoring** | Must implement yourself | Must implement yourself |
| **Normalization tracing** | Must instrument yourself | Must instrument yourself |
| **Quality gates** | Must build yourself | Must build yourself |
| **Query interface** | Must build yourself | Must build yourself |
| **Maintenance** | Fetch layer managed; selectors, scoring and gates are yours | All of it, including proxies |
| **Cost** | Per-call API credits + your storage | Compute + proxies + storage + engineering time |

## 17. Enterprise / Cloud Deployment

### Scaling to Millions of Records

Use tiered storage: hot (7 days, PostgreSQL JSONB), warm (30 days, MongoDB TTL), cold (90+ days, Parquet in S3 + Athena).

```python
class ProvenanceStorageManager:
    def __init__(self):
        self.hot = PostgresStore(connection_string)
        self.warm = MongoStore(mongo_uri)
        self.cold = S3ParquetStore(bucket="your-provenance-bucket")

    def store(self, envelope: dict):
        self.hot.insert(envelope)

    def query(self, field_name: str, confidence_max: float, hours: int):
        results = []
        if hours <= 168:
            results.extend(self.hot.query(field_name=field_name, confidence_max=confidence_max))
        if hours > 168:
            results.extend(self.warm.query(field_name=field_name, confidence_max=confidence_max))
        if hours > 720:
            results.extend(self.cold.query(field_name=field_name, confidence_max=confidence_max))
        return results
```

### Multi-Team Provenance Governance

```python
class ProvenanceRegistry:
    def __init__(self):
        self.schemas, self.policies = {}, {}

    def register_schema(self, team: str, name: str, schema: dict):
        self.schemas[f"{team}:{name}"] = schema

    def register_policy(self, team: str, name: str, policy: dict):
        self.policies[f"{team}:{name}"] = policy

    def validate(self, team: str, name: str, envelope: dict) -> bool:
        policy = self.policies.get(f"{team}:{name}")
        if not policy:
            return True
        for f in policy.get("required_fields", []):
            if f not in envelope:
                return False
        for fn, threshold in policy.get("confidence_thresholds", {}).items():
            if envelope.get("fields", {}).get(fn, {}).get("confidence", {}).get("overall", 0.0) < threshold:
                return False
        return True
```

### Observability & Alerting

```python
PROVENANCE_FIELDS_TOTAL = Counter("provenance_fields_total", "", ["schema_name", "strategy"])
PROVENANCE_GATE_FAILURES = Counter("provenance_gate_failures_total", "", ["schema_name", "field_name", "failure_reason"])
PROVENANCE_CONFIDENCE = Histogram("provenance_confidence_score", "", ["schema_name", "field_name"], buckets=(0.0, 0.5, 0.7, 0.8, 0.9, 0.95, 0.99, 1.0))
PROVENANCE_LATENCY = Histogram("provenance_capture_latency_ms", "", ["schema_name"], buckets=(5, 10, 25, 50, 100, 250, 500))
```

Alert thresholds: completeness < 95%, average confidence < 0.8, gate failure rate > 5%, storage growing faster than expected.

## 18. FAQs

### Q1. What exactly is field-level provenance in data extraction?
Field-level provenance is a structured metadata record attached to each extracted value that documents its complete chain of evidence: the source URL, the exact DOM element it came from (CSS selector path, tag name, attributes), the raw text before any transformation, the extraction strategy used, a confidence score, and a trace of every normalization step applied. It answers "where did this specific value come from and how was it derived?" at the granularity of individual fields, not entire records.

### Q2. How is provenance different from regular logging?
Logging records that an event occurred — "extraction job #4421 completed at 14:32:05." Provenance records how a specific value was derived — "field price = 1299.00, extracted from div.price span.amount via CSS selector, raw text was '$1,299.00', confidence 0.97, normalized by stripping currency symbol and parsing as float." Logging tells you that something happened. Provenance tells you exactly what happened for each individual value.

### Q3. How much overhead does provenance tracking add?
It depends on your envelope and your storage engine. Provenance capture and quality gates add work per page, but fetching and rendering usually dominate total latency. Storage is the bigger cost: a full envelope with a DOM snapshot can be larger than the extracted record itself. Measure both on a sample of your own pages before choosing between minimal and full provenance (see the method in the Performance & Benchmarks section).

### Q4. What should I do if my provenance confidence score is always 1.0?
A confidence score that is always 1.0 means your confidence scorer is not configured with meaningful signals. Enable signal-based scoring with at least selector match quality, element visibility, text plausibility, and strategy reliability. After enabling these signals, you will see a realistic distribution of scores that actually helps you identify problematic extractions.

### Q5. Can provenance help with AI governance and compliance?
Yes. The EU AI Act requires providers of high-risk AI systems to examine the origin and nature of data. GDPR Article 22 requires the ability to explain how automated inputs were derived. ISO/IEC 42001 requires documented information about data sources. Field-level provenance is the technical mechanism that satisfies all three. For RAG systems that ground LLM responses on extracted web data, provenance provides the audit trail needed for AI governance.

### Q6. How long should I keep provenance data?
Implement tiered retention. Keep full provenance (with DOM snapshots) for 7 days for active debugging. Keep minimal provenance for 30 days for trend analysis. Keep summary-level provenance for 90 days for compliance. After 90 days, delete or anonymize. Financial services may need longer retention; consumer applications can use shorter windows.

### Q7. What is the most common mistake teams make with provenance?
Storing only the normalized value without the raw text. When a normalized value is wrong, you cannot tell whether the source page had the wrong value, the extraction picked the wrong element, or the normalization introduced the error. The second most common mistake is treating provenance as optional — "we will add it later" is a promise almost never kept. Build provenance into the pipeline from day one.

### Q8. Does provenance work with AI-based extraction (LLMs, vision models)?
Yes, but the provenance envelope looks different. The extraction.strategy field would be ai_extraction or llm_prompt, and the dom_location may contain a bounding box or visual coordinates instead of a CSS selector. The confidence score should include a text_plausibility signal. The key challenge is that DOM location is less precise — include a screenshot region reference or rendered DOM snippet as part of the provenance.

## 19. Conclusion

Field-level provenance transforms data extraction from a black box into an auditable, debuggable, and verifiable system. The core idea is simple: every extracted value carries a structured record of where it came from, how it was extracted, and how confident the system is that it is correct.

The trade-off is straightforward. Full provenance costs some latency and noticeably more storage per record. What it buys is the ability to answer "why is this value wrong?" from the record itself, instead of by reproducing the extraction by hand.

The regulatory landscape is moving in the same direction. The EU AI Act, GDPR Article 22, and ISO/IEC 42001 all require documented evidence of data origin and processing. Field-level provenance is the technical mechanism that satisfies these requirements.

Start small. Pick one extraction pipeline, add provenance tracking for the most critical fields, and measure the impact on debugging time. If you use the Ollagraph API for fetching, keep the provenance layer in your own code: record the URL you requested, the fetch time, and each field's raw source text as you build the record. The API returns page content and embedded structured data; it does not return provenance envelopes.

## 20. References

- [Ollagraph API Documentation](https://ollagraph.com/docs/)
- [Great Expectations Documentation — Data Validation and Provenance](https://docs.greatexpectations.io/)
- [OpenTelemetry Semantic Conventions for Data Processing](https://opentelemetry.io/docs/specs/semconv/database/)
- [W3C PROV-O: The PROV Ontology](https://www.w3.org/TR/prov-o/)
- Related Ollagraph cluster: [Structured Data for RAG](/blog/structured-data-extraction-for-rag-turning-web-pages-into-queryable-facts/), [Citation Readiness Score](/blog/citation-readiness-score-how-to-build-reliable-scoring-model/), [Document-to-JSON Extraction](/blog/document-to-json-extraction-turning-web-pages-into-typed-records/), [Reliable Web Data Pipelines](/blog/reliable-web-data-pipelines-from-crawling-to-validated-json/)

## Common questions

### What is field-level provenance in data extraction?

Field-level provenance is a structured record that explains where each extracted value came from and how it was produced. It typically includes the source location, raw text, extraction method, normalization steps, and confidence. With it, every field becomes auditable instead of just the final output.

### Why is field-level provenance better than standard logs?

Standard logs tell you that a job ran; provenance tells you how a specific value was derived. That difference matters when one field is wrong and the rest are correct. Provenance reduces debugging from manual reproduction to a fast inspection of the value's evidence trail.

### What should a provenance envelope contain?

A complete envelope should capture the source reference, exact element or record location, raw input, extraction strategy, confidence score, and transformation history. It should also record field identity and quality-check outcomes. Those pieces let you verify the value, not just store it.

### How do quality gates use provenance data?

Quality gates compare the extracted value against its evidence, not just against downstream rules. For example, they can flag a price that came from an unexpected element or a description that contains navigation text. This catches failures before bad data reaches reporting or product systems.

### Does provenance add too much latency or storage cost?

It adds overhead, but the tradeoff is usually worth it when data quality matters. You can control cost by storing detailed evidence for recent data and archiving older records in cheaper tiers. The key is to keep provenance queryable without treating every field like a full log dump.

### What is the biggest mistake teams make with provenance?

The biggest mistake is trying to add provenance after the pipeline is already built. If the extractor never captured raw context, you cannot reconstruct a complete evidence trail later. Provenance works best when it is designed into the extraction flow from day one.
