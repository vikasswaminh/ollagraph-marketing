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
                <a class="btn btn-ghost" href="/login">Log in</a>
                <a class="btn btn-secondary" href="/signup">Sign up</a>
                <a class="btn btn-primary" href="/signup">
                  Start free
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>`;
}

export function footerHtml(): string {
  const cols = [
    { h: "Product",     items: ["Capabilities", "MCP", "AEO", "Intel", "Convert", "Audit"] },
    { h: "Developers",  items: ["Docs", "API reference", "Changelog", "OpenAPI spec", "Postman collection"] },
    { h: "For",         items: ["AI agents", "SEO consultants", "Security teams", "Pricing", "Enterprise"] },
    { h: "Company",     items: ["About", "Blog", "Contact"] },
  ];
  const colsHTML = cols.map((c) => `
        <div class="footer-col">
          <h4>${c.h}</h4>
          ${c.items.map((i) => `<a href="#">${i}</a>`).join("")}
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
                <div style="display:flex; gap:10px; margin-top:22px;">
                  <a href="#" aria-label="GitHub" style="width:32px;height:32px;border:1px solid var(--border-2);border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23.96-.27 1.98-.4 3-.41 1.02 0 2.04.14 3 .41 2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.56 21.79 24 17.3 24 12 24 5.37 18.63 0 12 0z"/></svg>
                  </a>
                  <a href="#" aria-label="X" style="width:32px;height:32px;border:1px solid var(--border-2);border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                  <a href="#" aria-label="Discord" style="width:32px;height:32px;border:1px solid var(--border-2);border-radius:7px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.07.07 0 0 0-.078.038c-.21.39-.444.882-.608 1.282a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.282.07.07 0 0 0-.079-.038A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .084-.029 14.2 14.2 0 0 0 1.226-1.994.07.07 0 0 0-.041-.099 13.1 13.1 0 0 1-1.872-.892.07.07 0 0 1-.007-.118c.126-.094.252-.192.372-.291a.07.07 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.07.07 0 0 1 .078.009c.12.099.246.198.373.292a.07.07 0 0 1-.006.118 12.3 12.3 0 0 1-1.873.891.07.07 0 0 0-.04.1c.36.698.772 1.362 1.225 1.993a.08.08 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.08.08 0 0 0 .032-.056c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                  </a>
                </div>
              </div>
              ${colsHTML}
            </div>
            <div class="footer-bottom">
              <div>© 2026 Ollagraph</div>
              <div style="display:flex; gap:24px;">
                <a href="#" style="color:inherit;">Terms</a>
                <a href="#" style="color:inherit;">Privacy</a>
                <a href="#" style="color:inherit;">DPA</a>
                <span style="display:inline-flex;align-items:center;gap:6px;">
                  <span style="width:6px;height:6px;border-radius:999px;background:var(--green);box-shadow:0 0 8px var(--green);"></span>
                  All systems normal
                </span>
              </div>
            </div>
          </div>
        </footer>`;
}
