# Olanode — Marketing site

Public marketing site for Ollagraph. Static Astro build, deploys to Cloudflare Pages.

Pages (8 routes):

- `/`           — homepage (was `Ollagraph.html`)
- `/mcp`        — MCP product page
- `/aeo`        — AEO product page
- `/docs`       — docs landing
- `/pricing`    — pricing + calculator
- `/enterprise` — enterprise overview + contact form
- `/login`      — log in (form submit → `https://app.ollanode.com`)
- `/signup`     — sign up (form submit → `https://app.ollanode.com`)

The dashboard app (`observability`) lives in a separate repo: `vikasswaminh/olanode-dashboard`.

## Local dev

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output → ./dist
npm run preview  # serve the built dist locally
```

## Cloudflare Pages settings

| Setting             | Value           |
| ------------------- | --------------- |
| Framework preset    | Astro           |
| Build command       | `npm run build` |
| Build output dir    | `dist`          |
| Root dir            | `/`             |
| Node version        | `20` (env var `NODE_VERSION=20`) |

No `wrangler.toml` is required — Pages auto-detects Astro.

### Custom domain

Point your apex (e.g. `ollanode.com`) at the marketing Pages project. The dashboard subdomain `app.ollanode.com` should point at the dashboard repo's Pages project.

## Structure

```
public/
  styles.css            # shared design system (byte-identical to original)
  scripts/
    index.js            # home page inline scripts (tab switcher, KPI fade-in)
    pricing.js          # pricing calculator + monthly/annual toggle
    docs.js             # docs interactive bits
src/
  chrome.ts             # nav + footer HTML strings (build-time port of shared.js, observability link removed)
  layouts/BaseLayout.astro
  components/Nav.astro
  components/Footer.astro
  bodies/*.body.html    # verbatim per-page markup (imported via Vite ?raw)
  pages/                # 8 .astro routes
```

## Editing content

Each page lives as a verbatim body fragment under `src/bodies/<slug>.body.html` plus
(optionally) `src/bodies/<slug>.head.html` for page-specific styles. The corresponding
Astro route is `src/pages/<slug>.astro` and just stitches body + head + nav + footer
together. Edit the `.html` fragment for content/copy; the route file rarely needs to change.
