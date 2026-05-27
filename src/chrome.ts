// Marketing-site nav/footer renderer. Port of shared.js OG.renderNav / OG.renderFooter
// with one intentional change: the "Observability" link is removed because the
// observability surface is now the dashboard app (separate repo / separate Pages
// project). All other links, SVGs, badges, classes are byte-equivalent to the
// original.

const NAV_LINKS: { label: string; href: string; key: string }[] = [
  { label: "Capabilities", href: "/capabilities", key: "capabilities" },
  { label: "MCP",          href: "/mcp",          key: "mcp" },
  { label: "AEO",          href: "/aeo",          key: "aeo" },
  { label: "Docs",         href: "/docs",         key: "docs" },
  { label: "Pricing",      href: "/pricing",      key: "pricing" },
  { label: "Enterprise",   href: "/enterprise",   key: "enterprise" },
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
  const linksHTML = NAV_LINKS.map((l) => {
    const isActive = l.key === activeKey;
    return `<a class="nav-link ${isActive ? "active" : ""}" href="${l.href}">${l.label}</a>`;
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
              <nav class="nav-links">${linksHTML}</nav>
              <div class="nav-right">
                <a class="btn btn-ghost" href="https://app.ollagraph.com/login">Log in</a>
                <a class="btn btn-secondary" href="https://app.ollagraph.com/signup">Sign up</a>
                <a class="btn btn-primary" href="https://app.ollagraph.com/signup">
                  Start free
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </a>
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
        { label: "Capabilities",  href: "/capabilities" },
        { label: "MCP server",    href: "/mcp" },
        { label: "AEO",           href: "/aeo" },
        { label: "Pricing",       href: "/pricing" },
        { label: "Enterprise",    href: "/enterprise" },
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
