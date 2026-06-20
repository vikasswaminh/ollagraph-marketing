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
  { slug: "firecrawl-alternatives", title: "The 10 best Firecrawl alternatives in 2026", description: "Compare the 10 best Firecrawl alternatives for AI web scraping in 2026 — markdown, crawling, structured data, intelligence, and pricing — and pick the right fit.", date: "2026-06-19", readingTime: 15, tags: ["web scraping", "Firecrawl", "AI", "RAG"] },
  { slug: "exa-alternatives", title: "The best Exa alternatives for AI search in 2026", description: "Compare the best Exa alternatives for AI web search and content retrieval in 2026 — neural search, RAG, and extraction — and pick the right tool for the job.", date: "2026-06-19", readingTime: 14, tags: ["AI search", "Exa", "RAG", "AI agents"] },
  { slug: "web-data-for-llm-training", title: "Building a web data pipeline for LLM training in 2026", description: "A practical guide to collecting, cleaning, and shipping training data at scale — what works, what fails, and what to outsource.", date: "2026-05-16", readingTime: 14, tags: ["AI", "RAG", "training data"] },
  { slug: "sales-intelligence-api-buyers-guide", title: "Sales intelligence APIs in 2026: a buyer's guide to DNS, WHOIS, and technographic data", description: "What technographic data really is, what it isn't, and how to pick between BuiltWith, ZoomInfo, Clearbit, and the new wave of API-first providers.", date: "2026-05-16", readingTime: 12, tags: ["sales intelligence", "technographic", "RevOps"] },
  { slug: "scraping-zillow-in-2026", title: "Scraping Zillow in 2026: what works, what fails, what to do about it", description: "An honest look at the bot defenses, embedded payload extraction, and the three working strategies for getting Zillow data into a production pipeline.", date: "2026-05-16", readingTime: 11, tags: ["real estate", "Zillow", "anti-bot"] },
  { slug: "aeo-vs-seo-2026", title: "AEO vs SEO in 2026: optimizing for AI answer engines", description: "Answer Engine Optimization is the new layer on top of SEO. What changes, what stays the same, and how to measure whether AI engines can actually cite you.", date: "2026-06-18", readingTime: 10, tags: ["AEO", "SEO", "AI search"] },
];
