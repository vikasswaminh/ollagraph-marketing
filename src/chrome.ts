// Marketing-site nav/footer renderer. Port of shared.js OG.renderNav / OG.renderFooter
// with one intentional change: the "Observability" link is removed because the
// observability surface is now the dashboard app (separate repo / separate Pages
// project). All other links, SVGs, badges, classes are byte-equivalent to the
// original.

// Flat IA: a slim top-level nav (Docs / Pricing / Blog / Compare) with no
// dropdowns. The former grouped mega-menu was unstable (hover-gap flicker) and
// crowded; every other page now lives in the footer, which is equally sitewide
// and crawlable, so internal-link equity for the /for-*, /enterprise, and
// use-case pages is preserved. Add a nav link here only when the page is real.
type Leaf = { label: string; href: string; key?: string };

const NAV: Leaf[] = [
  { label: "Docs",    href: "/docs",    key: "docs" },
  { label: "Pricing", href: "/pricing", key: "pricing" },
  { label: "Blog",    href: "/blog",    key: "blog" },
  { label: "Compare", href: "/vs",      key: "vs" },
];

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

export function navHtml(activeKey: string = ""): string {
  const itemsHTML = NAV.map((entry) => {
    const active = entry.key === activeKey ? " active" : "";
    return `<a class="nav-link${active}" href="${entry.href}">${entry.label}</a>`;
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
              <nav class="nav-links" id="nav-menu">
                ${itemsHTML}
                <div class="nav-mobile-cta">
                  <a class="nav-link" href="https://app.ollagraph.com/login">Log in</a>
                  <a class="nav-link" href="/contactus">Request access</a>
                </div>
              </nav>
              <div class="nav-right">
                <a class="btn btn-ghost nav-hide-sm" href="https://app.ollagraph.com/login">Log in</a>
                <a class="btn btn-secondary nav-hide-sm" href="/contactus">Request access</a>
                <a class="btn btn-primary" href="/contactus">
                  Request access
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </a>
                <button type="button" class="nav-burger" aria-label="Open menu" aria-expanded="false" aria-controls="nav-menu" data-nav-burger>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <main id="main-content" tabindex="-1">`;
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
        { label: "AEO audits",     href: "/aeo" },
        { label: "Compare",        href: "/vs" },
        { label: "Pricing",        href: "/pricing" },
      ],
    },
    {
      h: "Use cases",
      items: [
        { label: "Web scraping API",     href: "/scrape" },
        { label: "Website crawler API",  href: "/crawl" },
        { label: "Browser automation",   href: "/automation" },
        { label: "Headless browser API", href: "/browser" },
        { label: "Domain intelligence",  href: "/intelligence" },
      ],
    },
    {
      h: "Solutions",
      items: [
        { label: "AI agent builders",   href: "/for-ai" },
        { label: "SEO consultants",     href: "/for-seo" },
        { label: "AEO agencies",        href: "/for-aeo-agencies" },
        { label: "Security teams",      href: "/for-intel" },
        { label: "Enterprise",          href: "/enterprise" },
      ],
    },
    {
      h: "Developers",
      items: [
        { label: "API docs",            href: "/docs" },
        { label: "Swagger UI",          href: "https://api.ollagraph.com/docs" },
        { label: "OpenAPI spec",        href: "https://api.ollagraph.com/openapi.json" },
        { label: "Postman collection",  href: "/ollagraph.postman_collection.json" },
        { label: "Webhooks",            href: "/webhooks" },
        { label: "Architecture",        href: "/architecture" },
        { label: "Changelog",           href: "/changelog" },
      ],
    },
    {
      h: "Resources",
      items: [
        { label: "Free tools",  href: "/tools" },
        { label: "Recipes",     href: "/recipes" },
        { label: "Blog",        href: "/blog" },
      ],
    },
    {
      h: "Account",
      items: [
        { label: "Log in",          href: "https://app.ollagraph.com/login" },
        { label: "Request access",         href: "/contactus" },
        { label: "Contact",         href: "mailto:hello@ollagraph.com" },
      ],
    },
    {
      h: "Legal",
      items: [
        { label: "Privacy",         href: "/legal/privacy" },
        { label: "Cookies",         href: "/legal/cookies" },
        { label: "Terms",           href: "/legal/terms" },
        { label: "Acceptable Use",  href: "/legal/acceptable-use" },
        { label: "Subprocessors",   href: "/legal/subprocessors" },
      ],
    },
  ];
  const colsHTML = cols.map((c) => `
        <div class="footer-col">
          <h4>${c.h}</h4>
          ${c.items.map((i) => {
            const ext = i.href.startsWith("http");
            const attrs = ext ? ` target="_blank" rel="noopener"` : "";
            return `<a href="${i.href}"${attrs}>${i.label}</a>`;
          }).join("")}
        </div>`).join("");

  // Sibling brands under the same group — dofollow cross-links (brand-name
  // anchors) so the network passes link equity to each domain. Ollagraph
  // itself is intentionally omitted (this IS ollagraph.com). Keep in sync
  // with the group's live zones; add a brand only once its site is live.
  const groupBrands = [
    { label: "Ollabear",     href: "https://ollabear.com" },
    { label: "OllaDNS",      href: "https://olladns.com" },
    { label: "OllaLink",     href: "https://ollalink.com" },
    { label: "OllaNode",     href: "https://ollanode.com" },
    { label: "OllaSoftware", href: "https://ollasoftware.com" },
    { label: "OllaStack",    href: "https://ollastack.com" },
    { label: "OllaSuper",    href: "https://ollasuper.com" },
    { label: "OllaSync",     href: "https://ollasync.com" },
    { label: "OllaVPN",      href: "https://ollavpn.com" },
    { label: "OllaWrite",    href: "https://ollawrite.com" },
  ];
  const brandsHTML = `
            <div class="footer-brands">
              <h4>Ollagraph Group</h4>
              <div class="footer-brands-links">
                ${groupBrands.map((b) =>
                  `<a href="${b.href}" target="_blank" rel="noopener">${b.label}</a>`
                ).join("")}
              </div>
            </div>`;

  return `
        </main>
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
            ${brandsHTML}
            <div class="footer-bottom">
              <div>© 2026 Ollagraph</div>
              <div style="color:var(--text-muted); font-size:12.5px;">
                Built for AI agents.
              </div>
            </div>
          </div>
        </footer>`;
}
