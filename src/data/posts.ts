// Blog post manifest. Each post lives at src/pages/blog/<slug>.astro and uses
// the Article layout (kind="blog" → BlogPosting schema).
export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  readingTime: number;
  tags: string[];
}

export const posts: PostMeta[] = [
  { slug: "ollagraph-n8n-integration", title: "Ollagraph for n8n: web scraping, crawling, and enrichment (a Firecrawl alternative)", description: "Add web scraping, crawling, structured extraction, and domain intelligence to your n8n workflows with Ollagraph — through the HTTP Request node, no custom code. Includes ready workflows and the async-crawl pattern.", date: "2026-06-21", readingTime: 11, tags: ["n8n", "automation", "web scraping", "Firecrawl"] },
  { slug: "firecrawl-mcp-alternative", title: "The best Firecrawl MCP alternative in 2026", description: "Firecrawl's MCP server gives your AI agent scrape, crawl, and extract. See how the Ollagraph MCP server compares — 212 tools, one key, intelligence and vertical actors included — and how to switch in minutes.", date: "2026-06-21", readingTime: 13, tags: ["MCP", "Firecrawl", "AI agents", "web scraping"] },
  { slug: "firecrawl-pricing", title: "Firecrawl pricing in 2026: plans, credit multipliers, and a cheaper alternative", description: "How Firecrawl pricing actually works in 2026 — the credit model, the per-feature multipliers to watch, what is not included, and how a flat pay-as-you-go alternative compares on real workloads.", date: "2026-06-21", readingTime: 12, tags: ["Firecrawl", "pricing", "web scraping", "API"] },
  { slug: "firecrawl-alternatives", title: "The 11 best Firecrawl alternatives in 2026", description: "Compare the 11 best Firecrawl alternatives for AI web scraping in 2026 — markdown, crawling, structured data, intelligence, and pricing — and pick the right fit.", date: "2026-06-19", readingTime: 16, tags: ["web scraping", "Firecrawl", "AI", "RAG"] },
  { slug: "exa-alternatives", title: "The best Exa alternatives for AI search in 2026", description: "Compare the best Exa alternatives for AI web search and content retrieval in 2026 — neural search, RAG, and extraction — and pick the right tool for the job.", date: "2026-06-19", readingTime: 14, tags: ["AI search", "Exa", "RAG", "AI agents"] },
  { slug: "web-data-for-llm-training", title: "Building a web data pipeline for LLM training in 2026", description: "A practical guide to collecting, cleaning, and shipping training data at scale — what works, what fails, and what to outsource.", date: "2026-05-16", readingTime: 14, tags: ["AI", "RAG", "training data"] },
  { slug: "sales-intelligence-api-buyers-guide", title: "Sales intelligence APIs in 2026: a buyer's guide to DNS, WHOIS, and technographic data", description: "What technographic data really is, what it isn't, and how to pick between BuiltWith, ZoomInfo, Clearbit, and the new wave of API-first providers.", date: "2026-05-16", readingTime: 12, tags: ["sales intelligence", "technographic", "RevOps"] },
  { slug: "scraping-zillow-in-2026", title: "Scraping Zillow in 2026: what works, what fails, what to do about it", description: "An honest look at the bot defenses, embedded payload extraction, and the three working strategies for getting Zillow data into a production pipeline.", date: "2026-05-16", readingTime: 11, tags: ["real estate", "Zillow", "anti-bot"] },
  { slug: "aeo-vs-seo-2026", title: "AEO vs SEO in 2026: optimizing for AI answer engines", description: "Answer Engine Optimization is the new layer on top of SEO. What changes, what stays the same, and how to measure whether AI engines can actually cite you.", date: "2026-06-18", readingTime: 10, tags: ["AEO", "SEO", "AI search"] },
];
