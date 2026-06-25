// Recipe manifest — long-tail, intent-driven landing pages. Each recipe lives
// at src/pages/recipes/<slug>.astro and uses the Article layout.
export interface RecipeMeta {
  slug: string;
  title: string;
  description: string;
  category: "ecommerce" | "real-estate" | "local" | "leadgen" | "ai" | "ops" | "crawling" | "seo" | "intel";
  readingTime: number;
  date: string;
}

export const recipes: RecipeMeta[] = [
  { slug: "scrape-amazon-product-data", title: "How to scrape Amazon product data in 2026", description: "A working playbook for pulling titles, prices, ratings, reviews, and ASINs from Amazon at scale — without writing a single line of scraping code.", category: "ecommerce", readingTime: 13, date: "2026-05-16" },
  { slug: "monitor-competitor-pricing", title: "How to monitor competitor pricing across e-commerce in 2026", description: "Build a real-time pricing intelligence pipeline that tracks competitor SKUs across Amazon, Shopify, and direct-to-consumer sites — the stack, the cadence, the cost.", category: "ecommerce", readingTime: 14, date: "2026-05-16" },
  { slug: "scrape-zillow-listings", title: "How to scrape Zillow listings at scale in 2026", description: "The honest guide to extracting Zestimate, price, beds, baths, and lot details from Zillow — what works, what fails, and how proptech teams ship in production.", category: "real-estate", readingTime: 13, date: "2026-05-16" },
  { slug: "scrape-google-maps-businesses", title: "How to scrape Google Maps businesses in 2026", description: "Pull places, ratings, reviews, hours, addresses, and coordinates from Google Maps at scale — the architecture local SEO, sales prospecting, and market research teams actually use.", category: "local", readingTime: 13, date: "2026-05-16" },
  { slug: "enrich-leads-from-domain", title: "How to enrich B2B leads from a domain in 2026", description: "Turn a list of company domains into a sales-ready dataset with tech stack, contact emails, social profiles, and email-deliverability scores — no Clearbit budget required.", category: "leadgen", readingTime: 14, date: "2026-05-16" },
  { slug: "build-rag-knowledge-base", title: "How to build a RAG knowledge base from the web in 2026", description: "The 2026 playbook for ingesting public web content into a retrieval-augmented generation pipeline — clean markdown, structured metadata, and freshness without infrastructure pain.", category: "ai", readingTime: 14, date: "2026-05-16" },
  { slug: "scrape-pages-behind-login", title: "How to scrape pages behind a login in 2026", description: "A practical guide to authenticated scraping in 2026 — form-based logins, session-persistent flows, and the legal and operational guardrails every team needs.", category: "crawling", readingTime: 13, date: "2026-05-16" },
  { slug: "extract-structured-data-from-articles", title: "How to extract structured data from articles in 2026", description: "Pull clean article bodies, JSON-LD, OpenGraph, Twitter Cards, and reading-time metadata from any news or blog page — the modern alternative to building a Readability fork.", category: "ai", readingTime: 13, date: "2026-05-16" },
  { slug: "crawl-entire-website", title: "How to crawl an entire website in 2026", description: "The full-site crawler playbook — depth controls, budget caps, robots.txt obedience, sitemap unrolling, and webhook-based delivery for crawls that finish hours later.", category: "crawling", readingTime: 13, date: "2026-05-16" },
  { slug: "verify-email-addresses-at-scale", title: "How to verify email addresses at scale in 2026", description: "SMTP-handshake verification, catch-all and disposable detection, MX-record validation — how RevOps teams keep cold-outbound deliverability above 95% in 2026.", category: "ops", readingTime: 12, date: "2026-05-16" },
  { slug: "convert-documents-to-markdown", title: "How to convert PDFs and documents to clean markdown for RAG in 2026", description: "Turn PDFs, Word docs, spreadsheets, and slide decks into LLM-ready markdown with one API call — OCR for scanned pages included.", category: "ai", readingTime: 11, date: "2026-06-18" },
  { slug: "audit-site-for-ai-search", title: "How to audit your site for AI answer engines (AEO) in 2026", description: "Measure whether ChatGPT, Perplexity, and Google's AI answers can find, fetch, and cite your pages — and fix what's blocking them.", category: "seo", readingTime: 12, date: "2026-06-18" },
  { slug: "technical-seo-audit", title: "How to run a technical SEO audit with an API in 2026", description: "Programmatic meta-tag, schema, redirect-chain, broken-link, and readability audits — wire a full technical SEO check into CI.", category: "seo", readingTime: 12, date: "2026-06-18" },
  { slug: "detect-website-tech-stack", title: "How to detect a website's tech stack from a domain in 2026", description: "Identify the frameworks, analytics, CMS, and infrastructure a site runs — technographic enrichment without a Clearbit contract.", category: "intel", readingTime: 11, date: "2026-06-18" },
  { slug: "monitor-ssl-and-subdomains", title: "How to monitor SSL certificates and discover subdomains in 2026", description: "Track certificate expiry, certificate-transparency history, and the live subdomain attack surface for any domain via API.", category: "intel", readingTime: 11, date: "2026-06-18" },
  { slug: "ip-geolocation-and-asn-lookup", title: "How to geolocate IP addresses and look up ASN ownership in 2026", description: "Resolve any IP to country, city, coordinates, ASN, and network owner — single or bulk — for fraud checks, analytics, and routing decisions.", category: "intel", readingTime: 11, date: "2026-06-18" },
  { slug: "check-email-authentication", title: "How to check SPF, DKIM, and DMARC records in 2026", description: "Validate a domain's email-authentication posture — SPF, DKIM, DMARC — to protect deliverability and catch spoofing risk before it bites.", category: "intel", readingTime: 11, date: "2026-06-18" },
  { slug: "audit-http-security-headers", title: "How to audit HTTP security headers (CSP, HSTS) in 2026", description: "Programmatically check CSP, HSTS, security.txt, subresource integrity, and mixed content — wire a security-header audit into CI.", category: "intel", readingTime: 11, date: "2026-06-18" },
  { slug: "check-ip-and-domain-reputation", title: "How to check IP and domain reputation with DNSBL in 2026", description: "Look up IP reputation and DNS blocklist status to defend your own infrastructure and vet inbound traffic — free data, no paid threat feeds.", category: "intel", readingTime: 10, date: "2026-06-18" },
  { slug: "track-page-history-wayback", title: "How to track historical page changes with the Wayback Machine in 2026", description: "Pull archived snapshots of any URL to monitor competitor changes, recover lost content, and build change-over-time datasets.", category: "intel", readingTime: 10, date: "2026-06-18" },
  { slug: "solve-captchas", title: "How to solve CAPTCHAs programmatically in 2026", description: "Clear reCAPTCHA, hCaptcha, and Turnstile challenges in automation flows on sites you operate or are authorized to access — via one API.", category: "crawling", readingTime: 10, date: "2026-06-18" },
  { slug: "ocr-images-and-scanned-docs", title: "How to OCR images and scanned documents via API in 2026", description: "Extract text from images, screenshots, and scanned PDFs with one API call — bounding boxes included — for search, RAG, and data entry.", category: "ai", readingTime: 10, date: "2026-06-18" },
  { slug: "dns-records-and-propagation", title: "How to check DNS records and propagation via API in 2026", description: "Resolve A/AAAA/MX/TXT/NS records, check propagation across global resolvers, and run DNS-over-HTTPS lookups — for migrations and monitoring.", category: "intel", readingTime: 11, date: "2026-06-18" },
];

export const categoryLabels: Record<RecipeMeta["category"], string> = {
  ecommerce: "E-commerce",
  "real-estate": "Real estate",
  local: "Local & maps",
  leadgen: "Lead generation",
  ai: "AI & RAG",
  crawling: "Crawling",
  ops: "RevOps",
  seo: "SEO & AEO",
  intel: "Domain intelligence",
};

export const categoryOrder: RecipeMeta["category"][] = ["ecommerce", "real-estate", "local", "leadgen", "ai", "seo", "intel", "crawling", "ops"];
