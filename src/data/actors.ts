// Actor catalog — drives /actors/<slug> reference pages. Each actor here is a
// real, verified /v1/actors/* endpoint in the live spec. Proxy language is kept
// to our actual customer-facing option (the residential-proxy opt-in), never a
// named upstream vendor.
export interface ActorField { name: string; type: string; example: string }
export interface ActorEndpoint { path: string; note: string }
export interface Actor {
  slug: string;
  name: string;
  category: string;
  endpoint: string;          // verified against the live OpenAPI spec
  short: string;
  long: string;
  fields?: ActorField[];     // detailed response fields (single-endpoint actors)
  sample?: string;           // JSON response sample (rendered via {expr})
  endpoints?: ActorEndpoint[]; // for actor FAMILIES with multiple sub-endpoints
  proxyNote?: string;
  recipe?: string;           // related /recipes/<slug>
}

export const actors: Actor[] = [
  {
    slug: "zillow",
    name: "Zillow property",
    category: "Real estate",
    endpoint: "POST /v1/actors/zillow",
    short: "Address, price, Zestimate, beds, baths, square footage, and year built — from any Zillow listing.",
    long: "The Zillow actor extracts the embedded data payload from a property detail page rather than scraping the DOM, so results stay consistent across single-family, condo, multi-family, and building pages. When Zillow returns its anti-bot wall, the actor detects it explicitly, returns a clear error, and recommends the residential-proxy option.",
    fields: [
      { name: "address", type: "string", example: "20 W 34th St, New York, NY 10001" },
      { name: "price", type: "number", example: "1250000" },
      { name: "zestimate", type: "number", example: "1310000" },
      { name: "bedrooms", type: "number", example: "2" },
      { name: "bathrooms", type: "number", example: "2.0" },
      { name: "living_area_sqft", type: "number", example: "1450" },
      { name: "year_built", type: "number", example: "1931" },
    ],
    sample: `{
  "status": "success",
  "url": "https://www.zillow.com/homedetails/...",
  "time_ms": 1820,
  "data": {
    "address": "20 W 34th St",
    "city": "New York", "state": "NY", "zipcode": "10001",
    "price": 1250000,
    "zestimate": 1310000,
    "bedrooms": 2, "bathrooms": 2,
    "living_area_sqft": 1450,
    "year_built": 1931
  }
}`,
    proxyNote: "Zillow runs an enterprise-grade bot defense. The actor detects the wall and returns a clear error when blocked — enable the residential-proxy option for production.",
    recipe: "scrape-zillow-listings",
  },
  {
    slug: "google-maps",
    name: "Google Maps place",
    category: "Local",
    endpoint: "POST /v1/actors/google-maps",
    short: "Name, rating, review count, hours, address, coordinates, and category — from any Google Maps place URL.",
    long: "Send a Google Maps place URL and receive structured business data — useful for local intelligence, competitor-density studies, lead-gen pipelines targeting brick-and-mortar businesses, and verifying name-address-phone (NAP) consistency. Google is aggressive with bot defenses, so production usage typically pairs the actor with the residential-proxy option.",
    fields: [
      { name: "name", type: "string", example: "Empire State Building" },
      { name: "rating", type: "number", example: "4.7" },
      { name: "review_count", type: "number", example: "98425" },
      { name: "address", type: "string", example: "20 W 34th St, New York, NY 10001" },
      { name: "phone", type: "string", example: "+1 212-736-3100" },
      { name: "category", type: "string", example: "Tourist attraction" },
      { name: "coordinates", type: "object", example: "{ lat: 40.7484, lng: -73.9857 }" },
    ],
    sample: `{
  "status": "success",
  "url": "https://www.google.com/maps/place/...",
  "time_ms": 1640,
  "data": {
    "name": "Empire State Building",
    "rating": 4.7,
    "review_count": 98425,
    "address": "20 W 34th St, New York, NY 10001",
    "phone": "+1 212-736-3100",
    "category": "Tourist attraction",
    "coordinates": { "lat": 40.7484, "lng": -73.9857 }
  }
}`,
    proxyNote: "Google flags datacenter traffic quickly. Enable the residential-proxy option for production volume.",
    recipe: "scrape-google-maps-businesses",
  },
  {
    slug: "markdown",
    name: "Markdown converter",
    category: "AI",
    endpoint: "POST /v1/actors/markdown",
    short: "LLM-ready markdown for any page — built-in readability, semantic structure preserved.",
    long: "The markdown actor combines a smart fetch (fast HTTP path when possible, full browser when needed) with a Readability-style extraction. The output is clean markdown — headings, paragraphs, links, code blocks — sized for direct embedding or for handing to a language model as context. Typical output is 80–95% smaller than the source HTML while preserving meaningful structure.",
    fields: [
      { name: "title", type: "string", example: "The State of the Web in 2026" },
      { name: "markdown", type: "string", example: "# The State of the Web in 2026 ..." },
      { name: "word_count", type: "number", example: "3873" },
      { name: "reading_time_min", type: "number", example: "16" },
    ],
    sample: `{
  "status": "success",
  "url": "https://example.com/article",
  "time_ms": 480,
  "data": {
    "title": "The State of the Web in 2026",
    "markdown": "# The State of the Web in 2026 ...",
    "word_count": 3873,
    "reading_time_min": 16
  }
}`,
    recipe: "build-rag-knowledge-base",
  },
  {
    slug: "jobs",
    name: "Job listings",
    category: "Jobs",
    endpoint: "POST /v1/actors/jobs/scrape",
    short: "Structured job postings — title, company, location, posted date, apply link — across major job boards.",
    long: "The jobs family aggregates listings across general job boards and regional aggregators. Use the generic scraper to search by query across sites, or target a specific source. Results normalize to a consistent shape so a downstream pipeline doesn't care which board a posting came from. See the live OpenAPI spec or Swagger UI for each sub-endpoint's exact request and response shape.",
    endpoints: [
      { path: "POST /v1/actors/jobs/scrape", note: "Search listings across sites by query" },
      { path: "GET /v1/actors/jobs/sites", note: "List the job sites the scraper supports" },
      { path: "GET /v1/actors/jobs/sources", note: "List available data sources" },
      { path: "POST /v1/actors/jobs/adzuna", note: "Adzuna aggregator" },
      { path: "POST /v1/actors/jobs/jobbank", note: "Canada Job Bank" },
      { path: "POST /v1/actors/jobs/reed", note: "Reed (UK)" },
      { path: "POST /v1/actors/jobs/usajobs", note: "USAJOBS (US federal)" },
    ],
    sample: `{
  "status": "success",
  "data": [
    {
      "title": "Senior Backend Engineer",
      "company": "Acme Inc",
      "location": "Remote, US",
      "posted": "2026-06-12",
      "url": "https://example.com/jobs/12345"
    }
  ]
}`,
  },
  {
    slug: "ats",
    name: "ATS career pages",
    category: "Jobs",
    endpoint: "POST /v1/actors/ats",
    short: "Pull open roles straight from a company's applicant-tracking system — Greenhouse, Lever, Workday, and more.",
    long: "Many companies host their careers page on a third-party applicant-tracking system. The ATS actor detects which system a careers URL runs on and extracts the structured list of open roles. Use detect to identify the platform behind a URL, and supported to see which ATS platforms are covered. Exact request/response shapes are in the live OpenAPI spec.",
    endpoints: [
      { path: "POST /v1/actors/ats", note: "Extract open roles from an ATS careers URL" },
      { path: "POST /v1/actors/ats/detect", note: "Identify which ATS a careers URL uses" },
      { path: "GET /v1/actors/ats/supported", note: "List supported ATS platforms" },
    ],
  },
  {
    slug: "producthunt",
    name: "Product Hunt",
    category: "Tech",
    endpoint: "POST /v1/actors/producthunt/daily",
    short: "The daily Product Hunt leaderboard and individual launch details — name, tagline, votes, topics.",
    long: "Track what's launching. The daily endpoint returns the leaderboard for a given day; the product endpoint returns the details for a single launch. Useful for trend monitoring, competitive launch tracking, and tech-news pipelines. See the live spec for exact request fields.",
    endpoints: [
      { path: "POST /v1/actors/producthunt/daily", note: "Leaderboard for a given day" },
      { path: "POST /v1/actors/producthunt/product", note: "Details for a single product launch" },
    ],
  },
  {
    slug: "scholar",
    name: "Academic / Scholar",
    category: "Research",
    endpoint: "POST /v1/actors/scholar/search",
    short: "Search academic literature and pull author and publication records — titles, authors, year, citations, DOIs.",
    long: "Backed by an open scholarly graph, the scholar family searches papers, resolves a single publication, and returns an author's record. Useful for research tooling, citation analysis, and literature monitoring. See the live OpenAPI spec for each sub-endpoint's exact request and response shape.",
    endpoints: [
      { path: "POST /v1/actors/scholar/search", note: "Search publications by query" },
      { path: "POST /v1/actors/scholar/author", note: "Author profile and works" },
      { path: "POST /v1/actors/scholar/publication", note: "A single publication record" },
    ],
    sample: `{
  "status": "success",
  "data": [
    {
      "title": "Attention Is All You Need",
      "authors": ["Vaswani, A.", "Shazeer, N."],
      "year": 2017,
      "cited_by_count": 134582,
      "doi": "10.48550/arXiv.1706.03762"
    }
  ]
}`,
  },
];
