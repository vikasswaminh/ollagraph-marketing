// Per-competitor comparison pages → /vs/<slug>. Brand-voice rule: name what they
// do well first, never disparage. ACCURACY rules applied here:
//  - Apify IS included as of 2026-06-20 (owner decision: cost-leadership vs the
//    actor-marketplace model is a key marketing goal). GUARDRAILS, because we
//    STILL resell Apify upstream for some vertical actors:
//      (a) never disclose the supplier relationship in public copy;
//      (b) never claim to undercut Apify on the specific datasets we resell from
//          them — keep the comparison at the model / consolidation / breadth level;
//      (c) generous tone; soften the cost claim ("a fraction of the cost", "often
//          well under half", "depends on workload"); never "Apify is expensive".
//    See memory project_apify_positioning.
//  - No claims about a public CDP/remote-Chrome endpoint (we don't expose one);
//    browser automation = our session + natural-language (Stagehand) surface.
//  - Pricing stated as our real model: credits (1/call, failed calls auto-refund),
//    pay-as-you-go from $5, 1,000 free credits to start. No asserted competitor
//    prices (we link to theirs instead).
export interface CompetitorComparison {
  slug: string;
  name: string;
  positioning: string;
  heroSub: string;
  whatTheyDoWell: string;
  whereWeGoFurther: string[];
  matrix: { feature: string; them: string; us: string }[];
  bestForThem: string;
  bestForUs: string;
  faqs: { q: string; a: string }[];
}

export const comparisons: CompetitorComparison[] = [
  {
    slug: "firecrawl",
    name: "Firecrawl",
    positioning: "Ollagraph vs Firecrawl",
    heroSub: "Firecrawl popularized clean markdown for LLM workflows. Ollagraph matches that quality and ships a complete intelligence layer, vertical actors, and browser automation alongside.",
    whatTheyDoWell: "Firecrawl earned its position by making LLM-ready markdown extraction simple and reliable. Their crawl-to-markdown pipeline is excellent, and they were early to recognize that AI engineers need a different shape of web data than traditional scrapers produced. If your use case is exclusively markdown for RAG or training, Firecrawl serves it well.",
    whereWeGoFurther: [
      "**Built-in intelligence layer.** Ollagraph returns DNS, WHOIS, SSL, GeoIP/ASN, tech-stack, contacts, and email verification in the same API. Firecrawl focuses on scrape and crawl — for the intelligence layer you'd add a second vendor.",
      "**Browser automation.** Persistent stealth sessions plus natural-language actions (goto / act / observe / extract) drive multi-step flows behind logins. Firecrawl is scrape-API-focused.",
      "**One bill, one token.** Scrape + intelligence + actors + automation are all credit-metered through one key, and failed calls auto-refund.",
    ],
    matrix: [
      { feature: "Clean markdown output for LLMs", them: "Native, excellent", us: "Native" },
      { feature: "Full-site crawler with webhook", them: "Yes", us: "Yes" },
      { feature: "Structured data (JSON-LD / OpenGraph / microdata)", them: "Partial", us: "Native" },
      { feature: "Domain intelligence (DNS / WHOIS / SSL)", them: "Not offered", us: "Included" },
      { feature: "Email verification", them: "Not offered", us: "Included" },
      { feature: "Browser automation (sessions + NL actions)", them: "Limited", us: "Included" },
      { feature: "MCP server", them: "Yes", us: "Included" },
      { feature: "JavaScript eval + action macros", them: "Limited", us: "Native" },
      { feature: "Pricing", them: "Per-credit", us: "Per-credit · PAYG from $5 · refund on failure" },
      { feature: "Free to start", them: "Free tier", us: "1,000 credits" },
    ],
    bestForThem: "Teams whose use case is exclusively markdown extraction for LLM training or RAG, and who do not need intelligence, vertical actors, or browser automation from the same vendor.",
    bestForUs: "Teams who need clean markdown plus intelligence, plus vertical actors, plus browser automation — behind one key and one bill. Especially AI teams whose agents also need to enrich the domains they scrape.",
    faqs: [
      { q: "Is Ollagraph's markdown output the same quality as Firecrawl's?", a: "Both use Readability-style extraction with strong defaults for stripping navigation, ads, and boilerplate, so output is comparable across most content sites. If your use case is markdown-only at low volume, either vendor serves you well." },
      { q: "Does Firecrawl have a domain intelligence layer?", a: "No. Firecrawl focuses on scraping and crawling; DNS, WHOIS, SSL, tech-stack, and email verification are not part of their product. Teams that need both typically pair Firecrawl with a separate intelligence vendor, or consolidate on Ollagraph." },
      { q: "How does pricing compare?", a: "Both price on usage. Ollagraph uses credits — 1 credit per call, failed calls auto-refund — with pay-as-you-go from $5 and 1,000 free credits to start. Because scrape, intelligence, actors, and automation all draw from the same credits, mixed workloads often land lower than paying per layer. See our pricing page and theirs for current numbers." },
      { q: "Can I migrate from Firecrawl to Ollagraph?", a: "In most cases it's a URL change plus a small response-shape adjustment, and switching your output format to markdown for LLM workloads. We're happy to help with the migration on higher-volume and enterprise plans." },
    ],
  },
  {
    slug: "scraperapi",
    name: "ScraperAPI",
    positioning: "Ollagraph vs ScraperAPI",
    heroSub: "ScraperAPI nailed developer ergonomics — a clean API, fast onboarding, simple pricing. Ollagraph matches that simplicity and ships structured output, an intelligence layer, and vertical actors in the same API.",
    whatTheyDoWell: "ScraperAPI is one of the cleanest developer experiences in the scraping-API category. Onboarding is fast, the docs are clear, the auth pattern is simple. If you need raw HTML from any URL with anti-bot handling, ScraperAPI is a strong, focused choice.",
    whereWeGoFurther: [
      "**Structured data, not just HTML.** Ollagraph returns clean markdown, extracted Readability content, and structured JSON-LD / OpenGraph / microdata in the same call. ScraperAPI returns raw HTML; cleaning and structure extraction is on your side.",
      "**Domain intelligence layer.** DNS, WHOIS, SSL, GeoIP/ASN, tech-stack, contacts, and email verification in the same API. ScraperAPI doesn't cover this category.",
      "**Browser automation + MCP.** Persistent sessions with natural-language actions, plus a Model Context Protocol server for AI agents. ScraperAPI focuses on the scraping API itself.",
    ],
    matrix: [
      { feature: "Raw HTML scraping with anti-bot", them: "Yes", us: "Yes" },
      { feature: "Clean markdown output", them: "Not native", us: "Native format" },
      { feature: "Structured data (JSON-LD, OG, microdata)", them: "Bring your own parser", us: "Native" },
      { feature: "Domain intelligence", them: "Not offered", us: "Included" },
      { feature: "Browser automation (sessions + NL actions)", them: "Not offered", us: "Included" },
      { feature: "MCP server", them: "Not offered", us: "Included" },
      { feature: "Async + webhooks", them: "Yes", us: "Yes" },
      { feature: "Pricing", them: "Per-request", us: "Per-credit · PAYG from $5 · refund on failure" },
      { feature: "Free to start", them: "Trial", us: "1,000 credits" },
    ],
    bestForThem: "Teams that need raw HTML from arbitrary URLs and want to own their own parsing and structure extraction downstream. ScraperAPI is the simplest path to bytes.",
    bestForUs: "Teams who want bytes plus structure plus intelligence plus actors plus browser automation — behind one key. Especially AI engineering teams, sales-intelligence platforms, and AEO/SEO agencies who need the full toolkit.",
    faqs: [
      { q: "Can Ollagraph return raw HTML like ScraperAPI?", a: "Yes. Set format: \"html\" on the scrape call and Ollagraph returns raw HTML. You'd choose this when you already own a downstream HTML parser you don't want to replace." },
      { q: "How does pricing compare?", a: "Both price on usage. Ollagraph uses credits — 1 credit per call, failed calls auto-refund — with pay-as-you-go from $5 and 1,000 free credits to start, and the same credits cover scraping, intelligence, actors, and browser automation. Compare against ScraperAPI's current tiers on their pricing page." },
      { q: "Does ScraperAPI have domain intelligence?", a: "No. ScraperAPI focuses on scraping and proxy management. Teams that need DNS, WHOIS, SSL, or tech-stack data typically add a separate vendor, or consolidate on Ollagraph." },
      { q: "Can I migrate my ScraperAPI integration to Ollagraph quickly?", a: "Usually it's a URL change — both APIs use Bearer auth and similar parameter shapes. Most teams switch the output format to markdown for LLM workloads to eliminate downstream parsing." },
    ],
  },
  {
    slug: "octoparse",
    name: "Octoparse",
    positioning: "Ollagraph vs Octoparse",
    heroSub: "Octoparse pioneered no-code visual scraping for non-developers. Ollagraph is the API-first alternative for teams who'd rather call an endpoint than configure a desktop workflow.",
    whatTheyDoWell: "Octoparse makes scraping approachable for non-engineers — a point-and-click visual builder, templates for popular sites, and cloud scheduling. For analysts who don't write code and need a repeatable extraction without engineering help, it's a strong fit.",
    whereWeGoFurther: [
      "**API-first, not a desktop app.** Ollagraph is a single HTTP endpoint family — no visual builder to configure, no client to install. Drop it into any pipeline, agent, or cron job.",
      "**Structured output + intelligence.** Clean markdown for LLMs, JSON-LD/OpenGraph extraction, plus DNS/WHOIS/SSL/enrichment in the same API. Octoparse focuses on the scrape itself.",
      "**Agent-native.** An MCP server and natural-language browser actions make Ollagraph usable directly by AI agents. Octoparse targets human operators.",
      "**Per-call economics.** Credits at 1 per call, pay-as-you-go from $5, failed calls auto-refund.",
    ],
    matrix: [
      { feature: "No-code visual builder", them: "Yes (its core)", us: "API-first" },
      { feature: "Programmatic HTTP API", them: "Limited", us: "Native" },
      { feature: "Clean markdown output for LLMs", them: "Not native", us: "Native" },
      { feature: "Domain intelligence (DNS/WHOIS/SSL)", them: "Not offered", us: "Included" },
      { feature: "MCP server for AI agents", them: "Not offered", us: "Included" },
      { feature: "Async + webhooks", them: "Cloud schedules", us: "Native" },
      { feature: "Free to start", them: "Free plan", us: "1,000 credits" },
    ],
    bestForThem: "Non-technical analysts who prefer a visual, point-and-click tool and don't want to write or call code.",
    bestForUs: "Engineering and AI teams who want a programmatic API — scraping plus intelligence plus agent tooling — they can wire into a pipeline.",
    faqs: [
      { q: "Is Ollagraph no-code like Octoparse?", a: "No — Ollagraph is API-first. You call an HTTP endpoint with a bearer token and get JSON back. That's the deliberate trade-off: less hand-holding for non-coders, far more power for engineers and agents." },
      { q: "Can Ollagraph schedule recurring scrapes like Octoparse cloud?", a: "Ollagraph handles long and recurring work through async jobs with webhook delivery; you trigger them from your own scheduler or pipeline rather than a built-in visual scheduler." },
      { q: "Which is cheaper?", a: "It depends on volume and workload. Ollagraph prices in credits — 1 per call, failed calls auto-refund — with pay-as-you-go from $5 and 1,000 free credits to start. Compare against Octoparse's plans on their pricing page." },
    ],
  },
  {
    slug: "diffbot",
    name: "Diffbot",
    positioning: "Ollagraph vs Diffbot",
    heroSub: "Diffbot built automatic AI extraction and a web-scale Knowledge Graph. Ollagraph overlaps on automatic extraction and adds scraping control, vertical actors, and agent-native tooling at a developer-friendly entry point.",
    whatTheyDoWell: "Diffbot's automatic extraction (Article, Product, and other entity types) and its Knowledge Graph are genuinely differentiated — entity-level structured data at web scale. For teams whose core need is a queryable graph of companies, people, and articles, Diffbot is in a category of its own.",
    whereWeGoFurther: [
      "**Lower entry barrier.** Pay-as-you-go from $5 and 1,000 free credits to start, versus an enterprise-oriented entry point.",
      "**Markdown + scraping control.** Clean LLM-ready markdown, action macros, and a full scrape/crawl surface alongside extraction. Diffbot centers on automatic extraction and the graph.",
      "**Browser automation + MCP.** Persistent sessions, natural-language actions, and a Model Context Protocol server for agents.",
      "**One bill across layers.** Scrape, extract, intelligence, actors, and automation all draw from the same credits.",
    ],
    matrix: [
      { feature: "Automatic content extraction", them: "Native AI", us: "Native" },
      { feature: "Web-scale Knowledge Graph", them: "Yes (its core)", us: "Not offered" },
      { feature: "Clean markdown output for LLMs", them: "Partial", us: "Native" },
      { feature: "Browser automation (sessions + NL actions)", them: "Not offered", us: "Included" },
      { feature: "MCP server for AI agents", them: "Not offered", us: "Included" },
      { feature: "Free to start", them: "Trial", us: "1,000 credits" },
    ],
    bestForThem: "Teams whose core need is a web-scale knowledge graph or entity database — companies, people, articles — queried at scale.",
    bestForUs: "Teams who need scraping plus clean markdown plus browser automation plus agent tooling at a low entry point, and don't need a standalone knowledge graph.",
    faqs: [
      { q: "Does Ollagraph have a Knowledge Graph like Diffbot?", a: "No, and we won't pretend otherwise — Diffbot's Knowledge Graph is its core product and we don't offer an equivalent. Ollagraph is a web-data API: scrape, extract, intelligence, actors, and automation. If you need a queryable entity graph, Diffbot is the better fit." },
      { q: "Can Ollagraph do automatic article and product extraction?", a: "Yes. The extract and markdown endpoints return clean article content, and vertical actors return structured product/place/property data. The output is comparable for most content and commerce pages." },
      { q: "How does pricing compare?", a: "Ollagraph's entry point is lower — pay-as-you-go from $5, 1,000 free credits to start, 1 credit per call with refunds on failure. Diffbot is positioned toward enterprise; compare current tiers on their pricing page." },
    ],
  },
  {
    slug: "zyte",
    name: "Zyte",
    positioning: "Ollagraph vs Zyte",
    heroSub: "Zyte (formerly Scrapinghub) is the Scrapy company — managed crawl infrastructure, a smart proxy/unblocker, and automatic extraction for large engineering teams. Ollagraph is the consolidated single-API alternative.",
    whatTheyDoWell: "Zyte has deep scraping heritage — they steward the Scrapy framework, run mature managed crawling infrastructure, and their proxy/unblocker handles tough anti-bot targets. For teams already invested in Scrapy at scale, Zyte is a natural home.",
    whereWeGoFurther: [
      "**Single API, no framework to run.** Ollagraph is one endpoint family with a bearer token — no Scrapy project to maintain or deploy.",
      "**Breadth behind one key.** Markdown, structured extraction, domain intelligence, vertical actors, and browser automation all in the same API and bill.",
      "**Agent-native.** An MCP server and natural-language browser actions make it directly usable by AI agents.",
      "**Low entry point.** Pay-as-you-go from $5, 1,000 free credits, 1 credit per call, refunds on failure.",
    ],
    matrix: [
      { feature: "Managed Scrapy infrastructure", them: "Yes (its core)", us: "API-first (no framework)" },
      { feature: "Smart proxy / unblocker", them: "Yes", us: "Built into the managed engine" },
      { feature: "Automatic extraction", them: "Yes", us: "Native" },
      { feature: "Clean markdown output for LLMs", them: "Partial", us: "Native" },
      { feature: "Domain intelligence (DNS/WHOIS/SSL)", them: "Not offered", us: "Included" },
      { feature: "Browser automation (sessions + NL actions)", them: "Via tooling", us: "Included" },
      { feature: "MCP server for AI agents", them: "Not offered", us: "Included" },
      { feature: "Free to start", them: "Trial / credits", us: "1,000 credits" },
    ],
    bestForThem: "Engineering teams standardized on Scrapy or needing managed crawl infrastructure and a dedicated unblocker for hard targets at large scale.",
    bestForUs: "Teams who want a single API spanning scrape, intelligence, vertical actors, and browser automation without running a crawling framework themselves.",
    faqs: [
      { q: "Do I need Scrapy to use Ollagraph?", a: "No. Ollagraph is a plain HTTP API — no framework, no project scaffolding. You POST a URL and get JSON. That's the main difference from a Scrapy-centric platform." },
      { q: "Does Ollagraph handle tough anti-bot sites like Zyte's unblocker?", a: "Our managed engine escalates automatically — fast HTTP path, then a stealth browser, with a residential-proxy option for the hardest targets — and tells you which path served the request via the tier field. For the toughest enterprise targets, evaluate both against your specific sites." },
      { q: "How does pricing compare?", a: "Ollagraph prices in credits — 1 per call, refunds on failure — with pay-as-you-go from $5 and 1,000 free credits. Compare against Zyte's current plans on their pricing page." },
    ],
  },
  {
    slug: "scrapingbee",
    name: "ScrapingBee",
    positioning: "Ollagraph vs ScrapingBee",
    heroSub: "ScrapingBee is a clean, focused scraping API with JS rendering and proxy rotation. Ollagraph matches the scraping core and adds an intelligence layer, vertical actors, and agent tooling in the same API.",
    whatTheyDoWell: "ScrapingBee is a well-built, developer-friendly scraping API — JS rendering, proxy rotation, screenshots, and a simple parameterized request model. For teams who want reliable rendered HTML or screenshots from arbitrary URLs with a minimal surface, it's a solid, focused choice.",
    whereWeGoFurther: [
      "**Structured output, not just HTML.** Clean markdown for LLMs and JSON-LD / OpenGraph extraction in the same call, where ScrapingBee centers on rendered HTML you parse yourself.",
      "**Intelligence layer.** DNS, WHOIS, SSL, GeoIP/ASN, and company enrichment alongside the scrape.",
      "**Vertical actors + browser automation.** Dedicated Amazon/Zillow/Maps extractors plus persistent sessions and natural-language actions.",
      "**Agent-native.** A Model Context Protocol server makes the whole surface callable by AI agents.",
    ],
    matrix: [
      { feature: "JS rendering + proxy rotation", them: "Yes", us: "Yes" },
      { feature: "Screenshots", them: "Yes", us: "Via browser sessions" },
      { feature: "Clean markdown output for LLMs", them: "Not native", us: "Native" },
      { feature: "Structured data (JSON-LD / OpenGraph)", them: "Bring your own parser", us: "Native" },
      { feature: "Domain intelligence (DNS/WHOIS/SSL)", them: "Not offered", us: "Included" },
      { feature: "MCP server for AI agents", them: "Not offered", us: "Included" },
      { feature: "Free to start", them: "Trial credits", us: "1,000 credits" },
    ],
    bestForThem: "Teams that need focused, reliable rendered HTML or screenshots from arbitrary URLs and want a minimal API surface.",
    bestForUs: "Teams who want scraping plus structure plus intelligence plus vertical actors plus browser automation behind one key and one bill.",
    faqs: [
      { q: "Can Ollagraph render JavaScript like ScrapingBee?", a: "Yes. Our managed engine escalates from a fast HTTP path to a full stealth browser automatically, and tells you which path served the request via the tier field. You can also force rendering and pass action macros." },
      { q: "Does ScrapingBee have a domain intelligence layer?", a: "No. ScrapingBee focuses on scraping and proxy handling. DNS, WHOIS, SSL, and enrichment are not part of their product; teams that need both consolidate on Ollagraph or add a second vendor." },
      { q: "How does pricing compare?", a: "Both price on usage. Ollagraph uses credits — 1 per call, refunds on failure — with pay-as-you-go from $5 and 1,000 free credits to start, and the same credits cover scraping, intelligence, actors, and automation. See both pricing pages for current numbers." },
    ],
  },
  {
    slug: "crawlbase",
    name: "Crawlbase",
    positioning: "Ollagraph vs Crawlbase",
    heroSub: "Crawlbase (formerly ProxyCrawl) pairs a scraping API with crawling and optional result storage. Ollagraph overlaps on scraping and crawling, adds intelligence and agent tooling — and deliberately does not retain your scraped content.",
    whatTheyDoWell: "Crawlbase offers a mature scraping and crawling API with a large proxy pool, plus optional cloud storage and a screenshots API. For teams that want crawling plus managed storage of results in one vendor with a long track record, it's a capable option.",
    whereWeGoFurther: [
      "**No content retention, by design.** Ollagraph returns your data and keeps URL-level metadata only — we don't store the scraped content itself. That's a deliberate privacy posture, not a missing feature.",
      "**Structured output for LLMs.** Clean markdown plus JSON-LD / OpenGraph extraction in the same call.",
      "**Intelligence + vertical actors.** DNS/WHOIS/SSL/enrichment and dedicated Amazon/Zillow/Maps extractors alongside the crawl.",
      "**Agent-native.** Browser automation with natural-language actions and a Model Context Protocol server.",
    ],
    matrix: [
      { feature: "Scraping API with proxies", them: "Yes", us: "Yes" },
      { feature: "Full-site crawler", them: "Yes", us: "Yes" },
      { feature: "Managed storage of scraped results", them: "Yes (optional)", us: "By design, not stored" },
      { feature: "Clean markdown output for LLMs", them: "Not native", us: "Native" },
      { feature: "Domain intelligence (DNS/WHOIS/SSL)", them: "Not offered", us: "Included" },
      { feature: "MCP server for AI agents", them: "Not offered", us: "Included" },
      { feature: "Free to start", them: "Trial", us: "1,000 credits" },
    ],
    bestForThem: "Teams that specifically want managed cloud storage of crawled results inside the same vendor, plus a long-established proxy pool.",
    bestForUs: "Teams who want scraping plus intelligence plus actors plus automation — and who prefer that their scraped content is never retained by the vendor.",
    faqs: [
      { q: "Does Ollagraph store my scraped data like Crawlbase's storage option?", a: "No, and that's deliberate. We return your results and keep only URL-level metadata for your usage and observability — the scraped content itself is never persisted. If you need the vendor to hold a copy of crawled pages, Crawlbase's storage is the better fit; if you'd rather it never be retained, that's our default." },
      { q: "Can Ollagraph crawl whole sites like Crawlbase?", a: "Yes. The crawl endpoint walks a site within depth and budget limits, obeys robots.txt, and delivers results to a webhook — comparable to a managed crawler, returned to you rather than stored on our side." },
      { q: "How does pricing compare?", a: "Ollagraph prices in credits — 1 per call, refunds on failure — with pay-as-you-go from $5 and 1,000 free credits. Compare against Crawlbase's current plans on their pricing page." },
    ],
  },
  {
    slug: "apify",
    name: "Apify",
    positioning: "Ollagraph vs Apify",
    heroSub: "Apify pioneered the actor marketplace and runs a deep catalog of community and official scrapers. Ollagraph delivers comparable coverage from one curated, in-house catalog — at a fraction of the cost, behind one predictable bill, with failed calls refunded.",
    whatTheyDoWell: "Apify built the category-defining actor marketplace. Thousands of community and official actors, a mature and battle-tested platform, flexible compute, and a large ecosystem of integrations make it genuinely hard to match on raw breadth. If you want the widest possible library of ready-made and customizable scrapers — including long-tail and niche targets — Apify is a powerful, proven choice.",
    whereWeGoFurther: [
      "**One predictable bill, not a metered stack.** Apify bills across a platform plan, compute units, proxy usage, and often per-result charges. Ollagraph is flat credits — 1 per call, pay-as-you-go from $5, failed calls auto-refunded. For mixed workloads that would otherwise span several actors, the consolidated bill is often well under half the stacked cost.",
      "**A curated, in-house catalog.** Every Ollagraph actor is maintained by us to one quality and schema bar, so reliability and response shape stay consistent across the catalog rather than varying by community author.",
      "**A built-in intelligence layer.** DNS, WHOIS, SSL, GeoIP/ASN, tech-stack, contacts, and email verification ship in the same API. Apify centers on scraping and automation, so this is typically a second vendor.",
      "**One key across everything.** Scrape, crawl, structured extraction, vertical actors, browser automation, intelligence, and an MCP server all draw from the same credits and the same token.",
    ],
    matrix: [
      { feature: "Ready-made actor / extractor library", them: "Marketplace (community + official)", us: "Curated in-house catalog" },
      { feature: "Clean markdown output for LLMs", them: "Varies by actor", us: "Native" },
      { feature: "Domain intelligence (DNS / WHOIS / SSL)", them: "Not offered", us: "Included" },
      { feature: "Browser automation + sessions", them: "Yes", us: "Included" },
      { feature: "MCP server for AI agents", them: "Yes", us: "Included" },
      { feature: "Pricing model", them: "Platform + compute + proxy + per-result", us: "Flat credits · 1/call · PAYG from $5 · refund on failure" },
      { feature: "Free to start", them: "Free tier", us: "1,000 credits" },
    ],
    bestForThem: "Teams that want the broadest possible library of ready-made and community-built actors — including long-tail and highly customized targets — and are comfortable managing actor selection and metered platform billing.",
    bestForUs: "Teams that want a consistently-maintained catalog plus scrape, intelligence, and automation behind one predictable bill — often a fraction of the cost of stitching actors, platform, and proxy together — with failed calls refunded.",
    faqs: [
      { q: "Is Ollagraph cheaper than Apify?", a: "It depends on the workload, and we will not claim one number for every case. Ollagraph uses flat credits — 1 per call, failed calls auto-refunded — with pay-as-you-go from $5 and 1,000 free credits. For mixed workloads that would otherwise stack a platform plan, compute, proxy, and per-result charges, the consolidated bill is often well under half. Compare on your own workload." },
      { q: "Can Ollagraph replace the Apify actors I use?", a: "For common targets — marketplaces, maps, reviews, social, and dozens of public-data sources — Ollagraph's vertical actors return structured JSON directly. For long-tail or highly customized community actors, evaluate per target; Apify's marketplace is wider, and we would rather you check than take our word." },
      { q: "How is Apify's pricing different from Ollagraph's?", a: "Apify meters several dimensions — a platform plan, compute units, proxy traffic, and often per-result charges — which gives fine-grained control and a bill that takes some modeling. Ollagraph is flat: 1 credit per call, refunds on failure, pay-as-you-go from $5. The trade is granularity for predictability." },
      { q: "Does Ollagraph have an MCP server like Apify?", a: "Yes. Ollagraph ships a Model Context Protocol server that exposes its full surface — scrape, extract, intelligence, and actors — so an AI agent can call everything through one token without custom glue code." },
    ],
  },
  {
    slug: "tavily",
    name: "Tavily",
    positioning: "Ollagraph vs Tavily",
    heroSub: "Tavily is a search API tuned for AI agents and RAG — ask a question, get ranked sources and a synthesized answer. Ollagraph is the layer underneath: fetch, render, extract, and enrich the actual pages, behind one key.",
    whatTheyDoWell: "Tavily is purpose-built for agents that need to search the web and get back clean, ranked, LLM-ready results with an optional synthesized answer. The search-and-summarize loop is fast, the API is simple, and for 'find sources and answer a question' it's an excellent, focused fit. If your agent's job is primarily real-time search and quick answers, Tavily serves it well.",
    whereWeGoFurther: [
      "**The full page, not just the snippet.** Tavily returns ranked results and summaries; Ollagraph fetches and renders the actual pages — clean markdown, structured JSON-LD / OpenGraph, screenshots via sessions — for the URLs you care about.",
      "**Managed anti-bot + rendering.** A 4-tier engine escalates from a fast HTTP path to a stealth browser with a residential-proxy option, so protected and JS-heavy pages still return. Search APIs hand you links; getting the hard ones to load is on you.",
      "**Intelligence + vertical actors.** DNS/WHOIS/SSL/enrichment and dedicated Amazon/Zillow/Maps extractors alongside the fetch — context a search result doesn't carry.",
      "**One key, refunds on failure.** Retrieval (where you supply the URLs), extraction, intelligence, actors, and an MCP server all draw from the same credits — 1 per call, failed calls auto-refunded.",
    ],
    matrix: [
      { feature: "Agent-tuned web search + ranked sources", them: "Native (its core)", us: "Bring your URLs / crawl" },
      { feature: "Synthesized answer from sources", them: "Yes", us: "Not the focus" },
      { feature: "Full-page fetch + clean markdown", them: "Snippets / summaries", us: "Native" },
      { feature: "Managed anti-bot + JS rendering", them: "Limited", us: "Included (4-tier)" },
      { feature: "Structured data (JSON-LD / OpenGraph)", them: "Not offered", us: "Native" },
      { feature: "Domain intelligence (DNS / WHOIS / SSL)", them: "Not offered", us: "Included" },
      { feature: "MCP server for AI agents", them: "Yes", us: "Included" },
      { feature: "Free to start", them: "Free tier", us: "1,000 credits" },
    ],
    bestForThem: "Agents whose core need is real-time web search with ranked sources and a quick synthesized answer, and who don't need to fetch, render, or enrich the underlying pages themselves.",
    bestForUs: "Teams who need to fetch and render the actual pages — clean markdown, structured data, intelligence, and vertical actors — behind one key, often alongside a search step. Tavily and Ollagraph are frequently complementary: search to find, Ollagraph to fetch and extract.",
    faqs: [
      { q: "Is Ollagraph a search API like Tavily?", a: "Not primarily. Tavily's core is query-to-ranked-sources with a synthesized answer; Ollagraph's core is fetching, rendering, extracting, and enriching specific pages. Many teams use both — Tavily (or another search) to discover URLs, Ollagraph to pull clean content and intelligence from them." },
      { q: "Can Ollagraph replace Tavily for an agent?", a: "If your agent mostly needs to read specific pages and structured data, yes — point it at the URLs and Ollagraph returns clean markdown plus extraction. If it needs open-web search and answers, keep a search layer; Ollagraph complements it rather than replacing it." },
      { q: "How does pricing compare?", a: "Both price on usage. Ollagraph uses credits — 1 per call, failed calls auto-refund — with pay-as-you-go from $5 and 1,000 free credits to start. Compare against Tavily's current tiers on their pricing page." },
    ],
  },
  {
    slug: "jina",
    name: "Jina AI",
    positioning: "Ollagraph vs Jina AI Reader",
    heroSub: "Jina AI's Reader (r.jina.ai) turns a URL into clean markdown for LLMs — fast, generous, often free. Ollagraph matches the markdown and adds managed anti-bot, structured extraction, intelligence, and vertical actors for production workloads.",
    whatTheyDoWell: "Jina AI's Reader is one of the easiest ways to get LLM-ready markdown from a URL, and the free, no-friction entry point made it a favorite for RAG prototypes. Jina also ships embeddings, rerankers, and a search endpoint, so for teams that want reading plus embeddings from one vendor, it's a strong, well-engineered toolkit.",
    whereWeGoFurther: [
      "**Managed anti-bot + rendering for the hard pages.** Ollagraph's 4-tier engine escalates from a fast HTTP path to a stealth browser with a residential-proxy option, so login-walled, JS-heavy, and bot-protected pages still return — where a lightweight reader often can't.",
      "**Structure beyond markdown.** JSON-LD, OpenGraph, microdata, and dedicated Amazon/Zillow/Maps actors return structured JSON, not just prose.",
      "**Domain intelligence.** DNS, WHOIS, SSL, GeoIP/ASN, tech-stack, and enrichment in the same API.",
      "**Predictable per-call billing.** Flat credits — 1 per call, failed calls auto-refunded, pay-as-you-go from $5 — for production volumes you can forecast.",
    ],
    matrix: [
      { feature: "URL → clean markdown for LLMs", them: "Native (Reader)", us: "Native" },
      { feature: "Embeddings + rerankers", them: "Yes", us: "Not offered" },
      { feature: "Managed anti-bot + JS rendering", them: "Limited", us: "Included (4-tier)" },
      { feature: "Structured data (JSON-LD / OpenGraph / microdata)", them: "Partial", us: "Native" },
      { feature: "Domain intelligence (DNS / WHOIS / SSL)", them: "Not offered", us: "Included" },
      { feature: "Browser automation (sessions + NL actions)", them: "Not offered", us: "Included" },
      { feature: "MCP server for AI agents", them: "Partial", us: "Included" },
      { feature: "Free to start", them: "Free / generous", us: "1,000 credits" },
    ],
    bestForThem: "Teams that want the simplest possible URL-to-markdown for easy pages, or who want reading plus embeddings and rerankers from a single vendor for a RAG stack.",
    bestForUs: "Teams moving from prototype to production who hit bot-protected or JS-heavy pages, need structured data and intelligence beyond markdown, and want predictable per-call billing with refunds on failure.",
    faqs: [
      { q: "Is Ollagraph's markdown as clean as Jina Reader's?", a: "For straightforward content pages, both produce clean, LLM-ready markdown. The difference shows on harder targets — pages behind bot protection, heavy JavaScript, or logins — where Ollagraph's managed escalation is built to still return a result." },
      { q: "Does Ollagraph offer embeddings like Jina?", a: "No. Embeddings and rerankers are Jina's domain and we don't offer an equivalent — Ollagraph is the web-data layer (fetch, extract, intelligence, actors). Many teams pair Ollagraph for retrieval with their embedding model of choice." },
      { q: "Why pay when Jina Reader has a free tier?", a: "For prototypes and easy pages, a free reader is great. Teams move to Ollagraph for production reliability on hard targets, structured extraction and intelligence beyond markdown, and predictable per-call billing with refunds on failed calls. Start on 1,000 free credits and compare on your own URLs." },
    ],
  },
  {
    slug: "browse-ai",
    name: "Browse AI",
    positioning: "Ollagraph vs Browse AI",
    heroSub: "Browse AI lets non-coders build 'robots' that scrape and monitor sites with point-and-click and change alerts. Ollagraph is the API-first alternative for engineers and AI agents who'd rather call an endpoint.",
    whatTheyDoWell: "Browse AI made no-code scraping and monitoring genuinely approachable — record a robot by clicking through a page, schedule it, and get change-detection alerts when the data moves. For non-technical teams that need a watched data point or a prebuilt robot without writing code, it's a strong, friendly product.",
    whereWeGoFurther: [
      "**API-first, not a recorded robot.** Ollagraph is a single HTTP endpoint family with a bearer token — drop it into any pipeline, agent, or cron without recording or maintaining a visual robot.",
      "**Structured output + intelligence.** Clean markdown, JSON-LD/OpenGraph extraction, plus DNS/WHOIS/SSL/enrichment in the same API.",
      "**Vertical actors + browser automation.** Dedicated Amazon/Zillow/Maps extractors and persistent stealth sessions with natural-language actions.",
      "**Agent-native.** An MCP server exposes the whole surface to AI agents — no per-site robot to build first.",
    ],
    matrix: [
      { feature: "No-code visual robot builder", them: "Yes (its core)", us: "API-first" },
      { feature: "Scheduled monitoring + change alerts", them: "Yes", us: "Async jobs + webhooks" },
      { feature: "Programmatic HTTP API", them: "Available", us: "Native (the product)" },
      { feature: "Clean markdown output for LLMs", them: "Not native", us: "Native" },
      { feature: "Domain intelligence (DNS / WHOIS / SSL)", them: "Not offered", us: "Included" },
      { feature: "MCP server for AI agents", them: "Not offered", us: "Included" },
      { feature: "Free to start", them: "Free plan", us: "1,000 credits" },
    ],
    bestForThem: "Non-technical teams that want point-and-click robots and scheduled change-monitoring on specific pages without writing or calling code.",
    bestForUs: "Engineering and AI teams who want a programmatic API — scraping plus structured output plus intelligence plus actors plus agent tooling — they can wire into a pipeline or hand to an agent.",
    faqs: [
      { q: "Is Ollagraph no-code like Browse AI?", a: "No — Ollagraph is API-first. You call an endpoint with a bearer token and get JSON back. That's the deliberate trade-off: less point-and-click for non-coders, far more power and composability for engineers and agents." },
      { q: "Can Ollagraph monitor a page for changes like a Browse AI robot?", a: "Yes, programmatically. Schedule the call from your own scheduler or pipeline, run it as an async job, and receive results via webhook — then diff against the previous result on your side. You own the cadence and the comparison rather than configuring a visual monitor." },
      { q: "How does pricing compare?", a: "Ollagraph prices in credits — 1 per call, failed calls auto-refund — with pay-as-you-go from $5 and 1,000 free credits. Browse AI prices by robot and monitored rows; compare on your workload on their pricing page." },
    ],
  },
];
