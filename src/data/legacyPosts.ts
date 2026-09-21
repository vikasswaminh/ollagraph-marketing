export interface LegacyBlogPost {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  readingTime: number;
  tags: string[];
}

export const LEGACY_BLOG_POSTS: LegacyBlogPost[] = [
  {
    "slug": "aeo-vs-seo-2026",
    "title": "AEO vs SEO in 2026: optimizing for AI answer engines",
    "description": "Answer Engine Optimization is the new layer on top of SEO. What changes, what stays the same, and how to measure whether AI engines can actually cite you.",
    "pubDate": "2026-06-18",
    "readingTime": 10,
    "tags": [
      "aeo",
      "seo",
      "ai-search"
    ]
  },
  {
    "slug": "ai-crawler-fetch-simulator-see-what-chatgpt",
    "title": "AI Crawler Fetch Simulator: See What Answer Engines Can Access",
    "description": "Model fetch, render, extract, and score to see why answer engines miss your content. Find blocked fetches, timing issues, and noisy extraction fast.",
    "pubDate": "2026-07-28",
    "readingTime": 25,
    "tags": [
      "ai-search",
      "guides",
      "citations",
      "seo"
    ]
  },
  {
    "slug": "answer-engine-optimization-complete-guide-2026",
    "title": "Answer Engine Optimization: The 2026 AEO Playbook",
    "description": "A practical framework to get cited in AI answers. Learn crawler access, extractable structure, and authority signals that drive citations.",
    "pubDate": "2026-07-26",
    "readingTime": 25,
    "tags": [
      "aeo",
      "ai-search",
      "guides",
      "seo"
    ]
  },
  {
    "slug": "blog-14-how-ai-agents-access-the-web",
    "title": "How AI Agents Access the Web: APIs, Browsers, MCP",
    "description": "Learn how AI agents retrieve live web data using APIs, headless browsers, and MCP servers, and how to combine them into a reliable access layer.",
    "pubDate": "2026-07-27",
    "readingTime": 25,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "blog-19-llms-txt-explained-complete-guide-ai-crawlers-search",
    "title": "llms.txt: Complete Guide for AI Crawlers and Search",
    "description": "Learn how llms.txt guides AI crawlers to your highest-signal content, improves citation accuracy, and complements robots.txt and sitemaps.",
    "pubDate": "2026-07-26",
    "readingTime": 24,
    "tags": [
      "robots-txt",
      "ai-search",
      "seo",
      "aeo"
    ]
  },
  {
    "slug": "blog-20-how-to-audit-whether-ai-crawlers-can-access-your-website",
    "title": "Audit AI Crawler Access: A 6-Layer Framework",
    "description": "Verify that AI crawlers can fetch, render, and extract your pages. Use a practical six-layer audit to find blockers and prevent citation loss.",
    "pubDate": "2026-07-26",
    "readingTime": 24,
    "tags": [
      "ai-search",
      "seo",
      "guides"
    ]
  },
  {
    "slug": "chatgpt-seo-how-to-get-your-website-cited",
    "title": "ChatGPT SEO Playbook: Crawl-Render-Quote That Wins",
    "description": "A practical playbook for getting cited in ChatGPT. Learn the crawl-render-quote workflow, common pitfalls, and how Ollagraph tracks AI citations.",
    "pubDate": "2026-07-26",
    "readingTime": 23,
    "tags": [
      "aeo",
      "ai-search",
      "seo",
      "guides"
    ]
  },
  {
    "slug": "debugging-mcp-tool-calls-in-production",
    "title": "Observability for MCP Tool Calls in Production",
    "description": "Trace, log, and replay MCP tool calls so agent failures are diagnosable, retry-safe, and evidence-backed.",
    "pubDate": "2026-07-29",
    "readingTime": 24,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "docx-to-markdown-for-rag",
    "title": "DOCX to Markdown for RAG: Turn Word Files into AI-Ready Knowledge",
    "description": "Clean DOCX conversion preserves structure, cuts noise, and improves RAG retrieval. Learn how to turn Word files into AI-ready Markdown.",
    "pubDate": "2026-07-28",
    "readingTime": 27,
    "tags": [
      "rag",
      "guides"
    ]
  },
  {
    "slug": "exa-alternatives",
    "title": "The best Exa alternatives for AI search in 2026",
    "description": "Compare the best Exa alternatives for AI web search and content retrieval in 2026 — neural search, RAG, and extraction — and pick the right tool for the job.",
    "pubDate": "2026-06-19",
    "readingTime": 14,
    "tags": [
      "ai-search",
      "guides",
      "rag"
    ]
  },
  {
    "slug": "extract-structured-data",
    "title": "Extract Structured Data from Any Website with an API",
    "description": "Learn how schema-first extraction turns any URL into reliable, typed JSON and replaces brittle parsers with scalable pipelines using Ollagraph.",
    "pubDate": "2026-07-27",
    "readingTime": 28,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "firecrawl-alternatives",
    "title": "The 11 best Firecrawl alternatives in 2026",
    "description": "Compare the 11 best Firecrawl alternatives for AI web scraping in 2026 — markdown, crawling, structured data, intelligence, and pricing — and pick the right fit.",
    "pubDate": "2026-06-19",
    "readingTime": 15,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "firecrawl-mcp-alternative",
    "title": "The best Firecrawl MCP alternative in 2026",
    "description": "Firecrawl",
    "pubDate": "2026-06-21",
    "readingTime": 13,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "firecrawl-pricing",
    "title": "Firecrawl pricing in 2026: plans, credit multipliers, and a cheaper alternative",
    "description": "How Firecrawl pricing actually works in 2026 — the credit model, the per-feature multipliers to watch, what is not included, and how a flat pay-as-you-go alternative compares on real workloads.",
    "pubDate": "2026-06-21",
    "readingTime": 12,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "generative-engine-optimization",
    "title": "Generative Engine Optimization: Rank in AI Answers",
    "description": "Learn how to make content discoverable, quotable, and trusted by AI answer engines. A practical GEO framework to earn citations and visibility.",
    "pubDate": "2026-07-26",
    "readingTime": 24,
    "tags": [
      "geo",
      "ai-search",
      "guides",
      "seo"
    ]
  },
  {
    "slug": "how-ai-crawlers-read-schema-markup",
    "title": "How AI Crawlers Read Schema Markup for Better Citations",
    "description": "Schema only helps when crawlers can label and trust it. Learn how JSON-LD, entities, and page text work together for AI citations.",
    "pubDate": "2026-07-28",
    "readingTime": 30,
    "tags": [
      "guides",
      "citations"
    ]
  },
  {
    "slug": "how-ai-crawlers-read-your-website",
    "title": "How AI Crawlers Read Your Website: Preparing Content for LLMs",
    "description": "AI crawlers don",
    "pubDate": "2026-07-17",
    "readingTime": 22,
    "tags": [
      "ai-search",
      "guides",
      "aeo"
    ]
  },
  {
    "slug": "how-ai-crawlers-read-your",
    "title": "How AI Crawlers Read Websites (and How to Prepare)",
    "description": "AI crawlers extract and rank raw text, not design. Learn how to structure content so LLMs can read, retrieve, and cite your pages.",
    "pubDate": "2026-07-27",
    "readingTime": 25,
    "tags": [
      "ai-search",
      "seo",
      "guides"
    ]
  },
  {
    "slug": "how-javascript-rendering",
    "title": "How JavaScript Rendering Impacts AI Search Citations",
    "description": "Modern SPA pages can hide content from answer engines. Learn how rendering, hydration, and extraction affect citations and what to fix.",
    "pubDate": "2026-07-28",
    "readingTime": 25,
    "tags": [
      "guides",
      "seo"
    ]
  },
  {
    "slug": "how-to-build-a-rag-data",
    "title": "Build a RAG Data Pipeline That Actually Retrieves",
    "description": "Learn how to turn messy web content into clean, chunked, searchable data for RAG. Avoid silent failures by fixing ingestion, chunking, and retrieval measurement.",
    "pubDate": "2026-07-26",
    "readingTime": 26,
    "tags": [
      "rag",
      "guides"
    ]
  },
  {
    "slug": "how-to-build-an-mcp-toolchain-for-ai-agents",
    "title": "Build an MCP Toolchain for AI Agents",
    "description": "Scrape, extract, and convert web data into LLM-ready artifacts with evidence loops, validation, and reliable citations.",
    "pubDate": "2026-07-28",
    "readingTime": 23,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "html-to-markdown-api-for-llms-turn-any-web-page-into-ai-ready-markdown",
    "title": "HTML to Markdown API for LLMs: Build AI-Ready Content",
    "description": "Turn web pages into deterministic, LLM-ready Markdown with structure, quality signals, and evidence mappings for reliable ingestion.",
    "pubDate": "2026-07-29",
    "readingTime": 23,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "html-to-markdown-for-ai",
    "title": "HTML to Markdown for AI: Clean, LLM-Ready Web Context",
    "description": "Convert noisy web pages into clean Markdown for AI systems. Keep structure, drop chrome, and scale extraction with Ollagraph.",
    "pubDate": "2026-07-28",
    "readingTime": 25,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "html-to-markdown-for-llms-preserve-semantic-structure-for-better-ai-responses",
    "title": "HTML to Markdown for LLMs: Preserve Semantic Structure",
    "description": "Convert HTML into Markdown that keeps headings, lists, tables, and code intact so chunking and retrieval stay accurate.",
    "pubDate": "2026-07-29",
    "readingTime": 23,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "javascript-rendering-for-web-scraping",
    "title": "JavaScript Rendering for Web Scraping: A Production Guide",
    "description": "Render only when needed, extract what users actually see, and avoid expensive browser farms with a practical JavaScript scraping workflow.",
    "pubDate": "2026-07-28",
    "readingTime": 24,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "markdown-vs-html-for-llms",
    "title": "Markdown vs HTML for LLM Context: What Actually Wins",
    "description": "Choosing Markdown or HTML changes token cost, retrieval quality, and reasoning. Here’s when each format improves LLM context and how to decide with evidence.",
    "pubDate": "2026-07-26",
    "readingTime": 27,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "mcp-agent-observability-a-complete-guide",
    "title": "MCP Agent Observability: Trace Tool Calls and Debug Failures",
    "description": "Trace every MCP tool call end-to-end with correlation IDs, evidence packets, and deterministic retries. Debug failures from one complete timeline.",
    "pubDate": "2026-07-29",
    "readingTime": 23,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "mcp-security-protecting-ai-agents-from-unsafe-web-tool-calls",
    "title": "MCP Security: Stop Unsafe Web Tool Calls in AI Agents",
    "description": "Secure MCP agents with policy gates, allowlists, sandboxed retrieval, and evidence packets. Prevent unsafe web tool calls without breaking browsing.",
    "pubDate": "2026-07-29",
    "readingTime": 24,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "ocr-for-rag-how-layout",
    "title": "OCR for RAG: Why Layout Preservation Boosts Accuracy",
    "description": "Plain OCR flattens structure and degrades RAG retrieval. Layout-preserving OCR keeps document semantics intact, improving answer accuracy and reducing hallucinations.",
    "pubDate": "2026-07-27",
    "readingTime": 26,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "ollagraph-n8n-integration",
    "title": "Ollagraph for n8n: web scraping, crawling, and enrichment (a Firecrawl alternative)",
    "description": "Add web scraping, crawling, structured extraction, and domain intelligence to your n8n workflows with Ollagraph — through the HTTP Request node, no custom code. Includes ready workflows and the async-crawl pattern.",
    "pubDate": "2026-06-21",
    "readingTime": 11,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "optimizing-for-perplexity",
    "title": "Optimizing for Perplexity: Technical Guide to AI Citations",
    "description": "How to make pages discoverable, parseable, and trustworthy so Perplexity retrieves and cites them. Covers crawlability, structure, and content signals.",
    "pubDate": "2026-07-27",
    "readingTime": 22,
    "tags": [
      "aeo",
      "ai-search",
      "seo",
      "guides"
    ]
  },
  {
    "slug": "pdf-to-markdown-for-rag",
    "title": "Layout-Aware PDF Parsing: Reconstructing Reading Order and Document Flow for LLMs",
    "description": "How layout-aware PDF parsers detect reading order, resolve multi-column documents, strip running headers, and convert complex PDFs into semantic Markdown for RAG.",
    "pubDate": "2026-07-28",
    "readingTime": 26,
    "tags": [
      "pdf-parsing",
      "rag",
      "guides"
    ]
  },
  {
    "slug": "sales-intelligence-api-buyers-guide",
    "title": "Sales intelligence APIs in 2026: a buyer",
    "description": "What technographic data really is, what it isn",
    "pubDate": "2026-05-16",
    "readingTime": 12,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "scaling-document-to-markdown-for-ai-performance-reliability-and-cost",
    "title": "Scaling Document-to-Markdown for AI: Performance, Reliability, Cost",
    "description": "Build a reliable document-to-Markdown pipeline for AI with async orchestration, quality gates, and cost controls. Avoid silent failures and runaway spend.",
    "pubDate": "2026-07-29",
    "readingTime": 23,
    "tags": [
      "rag",
      "guides"
    ]
  },
  {
    "slug": "scrape-websites-for-rag",
    "title": "Scrape Websites for RAG with One API Call",
    "description": "Turn messy web pages into clean, chunk-ready Markdown for RAG in a single API call. Learn architecture, pitfalls, and what a reliable extraction endpoint must return.",
    "pubDate": "2026-07-26",
    "readingTime": 28,
    "tags": [
      "rag",
      "guides"
    ]
  },
  {
    "slug": "scraping-zillow-in-2026",
    "title": "Scraping Zillow in 2026: what works, what fails, what to do about it",
    "description": "An honest look at the bot defenses, embedded payload extraction, and the three working strategies for getting Zillow data into a production pipeline.",
    "pubDate": "2026-05-16",
    "readingTime": 11,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "structured-extraction-json-schema-pipelines-ai-agents",
    "title": "Structured Extraction: JSON Schema Pipelines for AI Agents",
    "description": "Learn how schema-first pipelines turn fragile AI extraction into reliable, validated JSON outputs with deterministic retries and debuggable workflows.",
    "pubDate": "2026-07-22",
    "readingTime": 22,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "structured-extraction-with-mcp",
    "title": "Structured Extraction with MCP and JSON Schema",
    "description": "Build agent outputs you can trust with schema-first extraction and validation. Use contracts, evidence, and retries to prevent silent corruption.",
    "pubDate": "2026-07-29",
    "readingTime": 23,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "web-data-for-llm-training",
    "title": "Building a web data pipeline for LLM training in 2026",
    "description": "A practical guide to collecting, cleaning, and shipping training data at scale — what works, what fails, and what to outsource.",
    "pubDate": "2026-05-16",
    "readingTime": 14,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "web-scraping-api-how-to-scrape-any",
    "title": "Scrape Any Website with One API Call",
    "description": "Learn how a web scraping API turns fetching, rendering, and unblocking into a single request, and how to scale it into a resilient data pipeline.",
    "pubDate": "2026-07-26",
    "readingTime": 26,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "web-scraping-at-scale",
    "title": "Web Scraping at Scale: Reliable Architecture for Tough Targets",
    "description": "Build scraping systems that survive failures, changing defenses, and rising costs. Learn the queue-first architecture, proxy strategy, and escalation ladder.",
    "pubDate": "2026-07-28",
    "readingTime": 23,
    "tags": [
      "guides"
    ]
  },
  {
    "slug": "web-scraping-for-ai-a-comp",
    "title": "Web Scraping for AI: Building Reliable Live Data Pipelines",
    "description": "A practical guide to turning live web data into LLM-ready inputs with traceability, quality controls, and resilience against common pipeline failures.",
    "pubDate": "2026-07-26",
    "readingTime": 22,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "web-scraping-for-llms",
    "title": "Web Scraping for LLMs: Build AI-Ready Data Pipelines",
    "description": "Turn public web pages into structured, chunked data for RAG, fine-tuning, and agents with a production-grade scraping pipeline.",
    "pubDate": "2026-07-28",
    "readingTime": 23,
    "tags": [
      "guides",
      "rag"
    ]
  },
  {
    "slug": "website-to-markdown-for-rag-convert-any-website-into-ai-ready-knowledge",
    "title": "Website to Markdown for RAG: Turn Sites into AI-Ready Knowledge",
    "description": "Convert arbitrary websites into deterministic Markdown for RAG, preserving structure, provenance, and retrieval boundaries.",
    "pubDate": "2026-07-29",
    "readingTime": 26,
    "tags": [
      "rag",
      "guides"
    ]
  },
  {
    "slug": "website-to-rag-pipeline-with-mcp",
    "title": "Website-to-RAG Pipelines with MCP, Without Custom Scrapers",
    "description": "Turn websites into RAG-ready knowledge bases with deterministic ingestion, stable metadata, and provenance. No per-site scrapers required.",
    "pubDate": "2026-07-29",
    "readingTime": 22,
    "tags": [
      "rag",
      "guides"
    ]
  }
];
