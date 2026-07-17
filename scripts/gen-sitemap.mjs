#!/usr/bin/env node
// Auto-generate dist/sitemap.xml from the built HTML.
//
// Each <loc> is taken verbatim from the page's <link rel="canonical">, so the
// sitemap can never drift from canonicals. (The prior hand-curated sitemap used
// bare paths like /capabilities while canonicals use a trailing slash
// /capabilities/ — that mismatch is what this fixes.)
//
// Runs after `astro build` (wired into the "build" script). No deps.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const DIST = 'dist';
const SITE = 'https://ollagraph.com';
const EXCLUDE_FILES = new Set(['404.html']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) out.push(...walk(p));
    else if (name.endsWith('.html') && !EXCLUDE_FILES.has(name)) out.push(p);
  }
  return out;
}

const today = new Date().toISOString().slice(0, 10);

// --- Per-page <lastmod> from the git history of each page's source. Stamping
// every URL with the build date (the old behaviour) tells Google "all 101 pages
// changed today" on every deploy — an inaccurate freshness signal it will learn
// to distrust. Instead we date each page by when its source last actually
// changed (max over its known source files), falling back to `today` only when
// a source can't be resolved (e.g. a brand-new, not-yet-committed page).
function gitDate(file) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${file}"`,
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  } catch { return null; }
}
function sourceCandidates(path) {
  if (path === '') return ['src/pages/index.astro', 'src/bodies/index.body.html'];
  const segs = path.split('/');
  const c = [
    `src/pages/${path}.astro`,
    `src/pages/${path}/index.astro`,
    `src/bodies/${path}.body.html`,
    `src/bodies/${path.replace(/\//g, '-')}.body.html`,
  ];
  // Data-driven sections: per-item content lives in one data file.
  if (segs[0] === 'actors' && segs.length > 1) c.push('src/data/actors.ts', 'src/pages/actors/[slug].astro');
  if (segs[0] === 'vs' && segs.length > 1) c.push('src/data/comparisons.ts', 'src/pages/vs/[slug].astro');
  if (segs[0] === 'bundles' && segs.length > 1) c.push('src/content/bundles.json', 'src/pages/bundles/[slug].astro');
  return c;
}
function lastmodFor(path) {
  let best = null;
  for (const f of sourceCandidates(path)) {
    if (!existsSync(f)) continue;
    const d = gitDate(f);
    if (d && (!best || d > best)) best = d;
  }
  return best || today;
}

const locs = new Set();
for (const f of walk(DIST)) {
  const html = readFileSync(f, 'utf8');
  const m = html.match(/<link rel="canonical" href="([^"]+)"/);
  // Only list pages that canonicalize to this domain. Pages that canonicalize
  // elsewhere (e.g. /login, /signup → app.ollagraph.com) are intentionally
  // excluded — they belong to another property's sitemap, not ours.
  if (m && m[1].startsWith(SITE + '/')) locs.add(m[1]);
}

const urls = [...locs].sort();
const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => {
    const path = u.slice(SITE.length).replace(/^\/|\/$/g, '');
    return `  <url>\n    <loc>${u}</loc>\n    <lastmod>${lastmodFor(path)}</lastmod>\n  </url>`;
  }).join('\n') +
  '\n</urlset>\n';

writeFileSync(join(DIST, 'sitemap.xml'), xml);
console.log(`[sitemap] wrote ${urls.length} URLs to dist/sitemap.xml`);
