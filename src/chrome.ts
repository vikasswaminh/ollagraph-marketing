// Marketing-site nav/footer renderer. Port of shared.js OG.renderNav / OG.renderFooter
// with one intentional change: the "Observability" link is removed because the
// observability surface is now the dashboard app (separate repo / separate Pages
// project). All other links, SVGs, badges, classes are byte-equivalent to the
// original.

// Grouped IA: top-level dropdown groups (Product / Solutions / Developers) plus
// a flat Pricing link. Groups surface every page — including the high-intent
// /for-* and /enterprise pages that used to live only in the footer — with
// descriptive anchor text, so the nav distributes internal-link equity for SEO.
// All <a> hrefs are present in the HTML regardless of hover state, so the
// dropdowns are fully crawlable. Add a link here only when the page is real.
type Leaf = { label: string; href: string; key?: string };
type Group = { label: string; key: string; items: Leaf[] };

const NAV: (Group | Leaf)[] = [
  {
    label: "Product", key: "product", items: [
      { label: "Capabilities",   href: "/capabilities",  key: "capabilities" },
      { label: "Actors",         href: "/actors",        key: "actors" },
      { label: "Bundles",        href: "/bundles",       key: "bundles" },
      { label: "MCP server",     href: "/mcp",           key: "mcp" },
      { label: "Observability",  href: "/observability", key: "observability" },
      { label: "AEO audits",     href: "/aeo",           key: "aeo" },
    ],
  },
  {
    label: "Solutions", key: "solutions", items: [
      { label: "For AI agent builders", href: "/for-ai",           key: "for-ai" },
      { label: "For SEO consultants",   href: "/for-seo",          key: "for-seo" },
      { label: "For AEO agencies",      href: "/for-aeo-agencies", key: "for-aeo-agencies" },
      { label: "For security teams",    href: "/for-intel",        key: "for-intel" },
      { label: "Enterprise",            href: "/enterprise",       key: "enterprise" },
    ],
  },
  {
    label: "Use cases", key: "usecases", items: [
      { label: "Web scraping API",     href: "/scrape",       key: "scrape" },
      { label: "Website crawler API",  href: "/crawl",        key: "crawl" },
      { label: "Browser automation",   href: "/automation",   key: "automation" },
      { label: "Headless browser API", href: "/browser",      key: "browser" },
      { label: "Domain intelligence",  href: "/intelligence", key: "intelligence" },
    ],
  },
  {
    label: "Developers", key: "developers", items: [
      { label: "API docs",            href: "/docs",                             key: "docs" },
      { label: "Swagger UI",          href: "https://api.ollagraph.com/docs" },
      { label: "OpenAPI spec",        href: "https://api.ollagraph.com/openapi.json" },
      { label: "Postman collection",  href: "/ollagraph.postman_collection.json" },
      { label: "Webhooks",            href: "/webhooks",     key: "webhooks" },
      { label: "Architecture",        href: "/architecture", key: "architecture" },
    ],
  },
  {
    label: "Resources", key: "resources", items: [
      { label: "Free tools", href: "/tools",     key: "tools" },
      { label: "Recipes",   href: "/recipes",   key: "recipes" },
      { label: "Blog",      href: "/blog",      key: "blog" },
      { label: "Changelog", href: "/changelog", key: "changelog" },
    ],
  },
  { label: "Pricing", href: "/pricing", key: "pricing" },
];

function isGroup(x: Group | Leaf): x is Group {
  return (x as Group).items !== undefined;
}

export const LOGO_SVG = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7.5V16.5L12 22L21 16.5V7.5L12 2Z" stroke="url(#g1)" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M12 7L7 10V14L12 17L17 14V10L12 7Z" fill="url(#g2)" stroke="#c7f751" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="1.4" fill="#0b0e02"/>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="24" y2="24"><stop stop-color="#c7f751"/><stop offset="1" stop-color="#5eead4"/></linearGradient>
        <linearGradient id="g2" x1="7" y1="7" x2="17" y2="17"><stop stop-color="#c7f751"/><stop offset="1" stop-color="#a3d83a"/></linearGradient>
      </defs>
    </svg>`;

function leafLink(l: Leaf, activeKey: string, cls: string): string {
  const ext = l.href.startsWith("http");
  const active = l.key && l.key === activeKey ? " active" : "";
  const attrs = ext ? ` target="_blank" rel="noopener"` : "";
  return `<a class="${cls}${active}" href="${l.href}"${attrs}>${l.label}</a>`;
}

const CARET_SVG = `<svg class="dd-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;

export function navHtml(activeKey: string = ""): string {
  const itemsHTML = NAV.map((entry) => {
    if (!isGroup(entry)) {
      const active = entry.key === activeKey ? " active" : "";
      return `<a class="nav-link${active}" href="${entry.href}">${entry.label}</a>`;
    }
    const groupActive =
      entry.key === activeKey || entry.items.some((i) => i.key === activeKey) ? " active" : "";
    const dd = entry.items.map((i) => leafLink(i, activeKey, "dd-link")).join("");
    return `<div class="nav-group">
                  <button type="button" class="nav-link nav-group-label${groupActive}" aria-haspopup="true">${entry.label}${CARET_SVG}</button>
                  <div class="nav-dropdown">${dd}</div>
                </div>`;
  }).join("");
  return `
        <div class="nav">
          <div class="container-wide">
            <div class="nav-inner">
              <a class="nav-logo" href="/">
                ${LOGO_SVG}
                <span>Ollagraph</span>
                <span class="badge badge-mute" style="margin-left:4px;">BETA</span>
              </a>
              <input type="checkbox" id="nav-toggle" class="nav-toggle" aria-hidden="true" />
              <nav class="nav-links">
                ${itemsHTML}
                <div class="nav-mobile-cta">
                  <a class="nav-link" href="https://app.ollagraph.com/login">Log in</a>
                  <a class="nav-link" href="https://app.ollagraph.com/signup">Sign up</a>
                </div>
              </nav>
              <div class="nav-right">
                <a class="btn btn-ghost nav-hide-sm" href="https://app.ollagraph.com/login">Log in</a>
                <a class="btn btn-secondary nav-hide-sm" href="https://app.ollagraph.com/signup">Sign up</a>
                <a class="btn btn-primary" href="https://app.ollagraph.com/signup">
                  Start free
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </a>
                <label for="nav-toggle" class="nav-burger" aria-label="Toggle menu">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                </label>
              </div>
            </div>
          </div>
        </div>`;
}

export function footerHtml(): string {
  // Every link below points at something that actually exists. Don't add a
  // footer link until the destination is real — broken footers look worse
  // than missing ones.
  const cols = [
    {
      h: "Product",
      items: [
        { label: "Capabilities",   href: "/capabilities" },
        { label: "Actors",         href: "/actors" },
        { label: "Bundles",        href: "/bundles" },
        { label: "Observability",  href: "/observability" },
        { label: "MCP server",     href: "/mcp" },
        { label: "AEO",            href: "/aeo" },
        { label: "Pricing",        href: "/pricing" },
        { label: "Enterprise",     href: "/enterprise" },
        { label: "Compare",        href: "/vs" },
        { label: "Free tools",     href: "/tools" },
      ],
    },
    {
      h: "Developers",
      items: [
        { label: "Docs",                href: "/docs" },
        { label: "Swagger UI",          href: "https://api.ollagraph.com/docs" },
        { label: "OpenAPI spec",        href: "https://api.ollagraph.com/openapi.json" },
        { label: "Postman collection",  href: "/ollagraph.postman_collection.json" },
        { label: "Changelog",           href: "/changelog" },
      ],
    },
    {
      h: "For",
      items: [
        { label: "AI agent builders",   href: "/for-ai" },
        { label: "SEO consultants",     href: "/for-seo" },
        { label: "Security teams",      href: "/for-intel" },
      ],
    },
    {
      h: "Account",
      items: [
        { label: "Log in",          href: "https://app.ollagraph.com/login" },
        { label: "Sign up",         href: "https://app.ollagraph.com/signup" },
        { label: "Contact",         href: "mailto:hello@ollagraph.com" },
      ],
    },
    {
      h: "Legal",
      items: [
        { label: "Privacy",         href: "/legal/privacy" },
        { label: "Terms",           href: "/legal/terms" },
        { label: "Subprocessors",   href: "/legal/subprocessors" },
      ],
    },
  ];
  const colsHTML = cols.map((c) => `
        <div class="footer-col">
          <h4>${c.h}</h4>
          ${c.items.map((i) => `<a href="${i.href}">${i.label}</a>`).join("")}
        </div>`).join("");

  return `
        <footer class="footer">
          <div class="container-wide">
            <div class="footer-grid">
              <div class="footer-col">
                <a class="nav-logo" href="/" style="font-size:18px;">
                  ${LOGO_SVG}
                  <span>Ollagraph</span>
                </a>
                <p style="color:var(--text-muted); font-size:13.5px; max-width:300px; margin-top:18px; line-height:1.6;">
                  Web infrastructure for AI agents. Fetch, extract, audit, and reason about the live web through one API.
                </p>
              </div>
              ${colsHTML}
            </div>
            <div class="footer-bottom">
              <div>© 2026 Ollagraph</div>
              <div style="color:var(--text-muted); font-size:12.5px;">
                Built for AI agents.
              </div>
            </div>
          </div>
        </footer>`;
}
