#!/usr/bin/env node
// Auto-generate dist/sitemap.xml from the built HTML.
//
// Each <loc> is taken verbatim from the page's <link rel="canonical">, so the
// sitemap can never drift from canonicals. (The prior hand-curated sitemap used
// bare paths like /capabilities while canonicals use a trailing slash
// /capabilities/ — that mismatch is what this fixes.)
//
// Runs after `astro build` (wired into the "build" script). No deps.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
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
  urls.map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n') +
  '\n</urlset>\n';

writeFileSync(join(DIST, 'sitemap.xml'), xml);
console.log(`[sitemap] wrote ${urls.length} URLs to dist/sitemap.xml`);
