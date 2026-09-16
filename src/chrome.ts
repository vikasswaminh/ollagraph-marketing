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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L3 7.5V16.5L12 22L21 16.5V7.5L12 2Z" stroke="#2563EB" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M12 7L7 10V14L12 17L17 14V10L12 7Z" fill="#2563EB" stroke="#2563EB" stroke-width="1.2" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="1.4" fill="#0F172A"/>
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
                <span class="nav-brand-name">Ollagraph</span>
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
                <a class="btn btn-primary" href="/contactus">Request access <span class="btn-arrow">&rarr;</span></a>
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
  const primaryCols = [
    {
      h: "Product",
      items: [
        { label: "Capabilities",   href: "/capabilities" },
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
  ];

  const secondaryCols = [
    {
      h: "Resources",
      items: [
        { label: "Free tools", href: "/tools" },
        { label: "Recipes",    href: "/recipes" },
        { label: "Blog",       href: "/blog" },
      ],
    },
    {
      h: "Account",
      items: [
        { label: "Log in",         href: "https://app.ollagraph.com/login" },
        { label: "Request access", href: "/contactus" },
        { label: "Contact",        href: "mailto:hello@ollagraph.com" },
      ],
    },
    {
      h: "Legal",
      items: [
        { label: "Privacy",        href: "/legal/privacy" },
        { label: "Cookies",        href: "/legal/cookies" },
        { label: "Terms",          href: "/legal/terms" },
        { label: "Acceptable Use", href: "/legal/acceptable-use" },
        { label: "Subprocessors",  href: "/legal/subprocessors" },
      ],
    },
  ];

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

  const primaryHTML = primaryCols.map((c) => `
              <div class="footer-col">
                <div class="footer-col-header">${c.h}</div>
                <ul class="footer-links-list">
                  ${c.items.map((i) => {
                    const ext = i.href.startsWith("http");
                    const dl = i.href.endsWith(".json") ? " download" : "";
                    const attrs = ext ? ` target="_blank" rel="noopener"` : "";
                    return `<li><a class="footer-link" href="${i.href}"${attrs}${dl}>${i.label}</a></li>`;
                  }).join("")}
                </ul>
              </div>`).join("");

  const secondaryHTML = secondaryCols.map((c) => `
              <div class="footer-sec-group">
                <span class="footer-sec-title">${c.h}</span>
                <div class="footer-sec-links">
                  ${c.items.map((i) => {
                    const ext = i.href.startsWith("http");
                    const attrs = ext ? ` target="_blank" rel="noopener"` : "";
                    return `<a class="footer-sec-link" href="${i.href}"${attrs}>${i.label}</a>`;
                  }).join("")}
                </div>
              </div>`).join("");

  const brandsHTML = groupBrands.map((b) => `
                <a class="footer-brand-chip" href="${b.href}" target="_blank" rel="noopener">${b.label}</a>
              `).join("");

  return `
        </main>
        <footer class="footer">
          <div class="footer-container">
            <div class="footer-primary-grid">
              <div class="footer-brand-col">
                <a class="footer-brand-logo" href="/">
                  ${LOGO_SVG}
                  <span class="footer-brand-name">Ollagraph</span>
                  <span class="footer-brand-badge">BETA</span>
                </a>
                <p class="footer-brand-desc">
                  Web infrastructure for AI agents. Fetch, extract, audit, and reason about the live web through one API.
                </p>
              </div>
              ${primaryHTML}
            </div>
            <div class="footer-secondary-row">
              ${secondaryHTML}
            </div>
            <div class="footer-brands-row">
              <span class="footer-brands-label">Ollagraph Group</span>
              <div class="footer-brands-list">
                ${brandsHTML}
              </div>
            </div>
            <div class="footer-bottom-row">
              <div class="footer-tagline">
                Autonomous web infrastructure designed for the agentic web.
              </div>
              <div class="footer-status-pill">
                <span class="footer-status-pulse"></span>
                <span class="footer-status-text">All systems operational</span>
              </div>
              <div class="footer-copyright">
                <span>© 2026 Ollagraph</span>
                <span class="footer-bottom-dot">•</span>
                <span class="footer-copyright-sub">Built for AI agents.</span>
              </div>
            </div>
          </div>
        </footer>`;
}
