// Best-effort Cloudflare edge-cache purge, run after `wrangler pages deploy`.
// We set the HTML edge TTL to 1 day for a high cache-hit ratio, so we purge on
// deploy to keep pages fresh. This NEVER fails the deploy: if no token is
// available it just logs and exits 0.
//
// Token: CF_PURGE_TOKEN (Cache-Purge scoped on the ollagraph.com zone), or
// CLOUDFLARE_API_TOKEN if that one also carries Cache Purge.
//
// WHAT GETS PURGED (first match wins):
//   1. PURGE_URLS env (comma-separated) — explicit override.
//   2. PURGE_BASE_SHA env (the workflow passes github.event.before): the URLs of
//      every page whose source changed between that commit and HEAD, derived
//      from `git diff --name-only`. A change to anything shared (layouts,
//      components, data/*, styles, config) purges everything, because every
//      page may have changed.
//   3. Otherwise purge everything. (A fixed URL list used to live here; it left
//      every other edited page stale for up to a day.)
//
// Dry run (prints the URLs, purges nothing):
//   PURGE_DRY_RUN=1 CF_PURGE_TOKEN=x PURGE_BASE_SHA=<sha> node scripts/purge-cache.mjs
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ZONE = "6b393cc38ae95c8c7bcbf1e3d56d4b30";
const ORIGIN = "https://ollagraph.com";
const tok = process.env.CF_PURGE_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

if (!tok) {
  console.log("[purge] no CLOUDFLARE_API_TOKEN / CF_PURGE_TOKEN — skipping edge purge (pages refresh within the 1-day TTL).");
  process.exit(0);
}

const EVERYTHING = Symbol("everything");

/** Both URL spellings of a route path ("/pricing" -> /pricing and /pricing/). */
function urlsFor(route) {
  const bare = route.replace(/\/+$/, "");
  if (bare === "") return [ORIGIN + "/"];
  if (/\.[a-z0-9]+$/i.test(bare)) return [ORIGIN + bare]; // a file, e.g. /sitemap.xml
  return [ORIGIN + bare, ORIGIN + bare + "/"];
}

/** src/pages/foo/bar.astro -> /foo/bar ; index.astro -> parent dir. */
function routeForPage(rel) {
  let r = rel.replace(/^src\/pages\//, "").replace(/\.astro$/, "");
  if (r.includes("[")) return null; // dynamic route: handled by its data source
  if (r === "index") return "/";
  r = r.replace(/\/index$/, "");
  return "/" + r;
}

/** Pages that import a given src/bodies/*.html fragment. */
function pagesImporting(bodyFile) {
  const base = bodyFile.replace(/^src\/bodies\//, "");
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".astro") && readFileSync(p, "utf8").includes("bodies/" + base)) {
        out.push(p.replace(/\\/g, "/"));
      }
    }
  };
  if (existsSync("src/pages")) walk("src/pages");
  return out;
}

function routesForChangedFile(rel) {
  if (rel.startsWith("src/pages/")) {
    const r = routeForPage(rel);
    return r === null ? EVERYTHING : [r];
  }
  if (rel.startsWith("src/content/blog/")) {
    return ["/blog/" + rel.replace(/^src\/content\/blog\//, "").replace(/\.mdx?$/, "")];
  }
  if (rel.startsWith("src/bodies/")) {
    const pages = pagesImporting(rel);
    if (pages.length === 0) return EVERYTHING;
    return pages.map(routeForPage).map((r) => (r === null ? EVERYTHING : r));
  }
  if (rel.startsWith("public/")) {
    const r = "/" + rel.replace(/^public\//, "");
    return [r === "/index.html" ? "/" : r];
  }
  if (/^(README|CLAUDE|\.github\/|docs\/|scripts\/)/.test(rel)) return []; // not served
  return EVERYTHING; // layouts, components, data/*, styles, utils, config, package.json…
}

function changedRoutes(baseSha) {
  if (!baseSha || /^0+$/.test(baseSha)) return EVERYTHING; // first push / force-push
  let files;
  try {
    files = execSync(`git diff --name-only ${baseSha} HEAD`, { encoding: "utf8" })
      .split("\n").map((s) => s.trim()).filter(Boolean);
  } catch (e) {
    console.log("[purge] git diff failed, purging everything:", String(e).slice(0, 160));
    return EVERYTHING;
  }
  const routes = new Set(["/", "/blog", "/sitemap.xml"]); // index pages + sitemap are rebuilt every deploy
  for (const f of files) {
    const r = routesForChangedFile(f);
    if (r === EVERYTHING) {
      console.log(`[purge] ${f} is shared → purging everything`);
      return EVERYTHING;
    }
    for (const x of r) {
      if (x === EVERYTHING) return EVERYTHING;
      routes.add(x);
    }
  }
  return [...routes];
}

let purgeUrls; // array of URLs, or EVERYTHING
if (process.env.PURGE_URLS) {
  purgeUrls = process.env.PURGE_URLS.split(",").map((s) => s.trim()).filter(Boolean);
} else if (process.env.PURGE_BASE_SHA) {
  const routes = changedRoutes(process.env.PURGE_BASE_SHA);
  purgeUrls = routes === EVERYTHING ? EVERYTHING : routes.flatMap(urlsFor);
} else {
  purgeUrls = EVERYTHING;
}

if (process.env.PURGE_DRY_RUN) {
  console.log(purgeUrls === EVERYTHING ? "[purge] dry run: everything" : "[purge] dry run:\n  " + purgeUrls.join("\n  "));
  process.exit(0);
}

async function purge(body) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`, {
    method: "POST",
    headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!j.success) console.log("[purge] purge failed (continuing):", JSON.stringify(j.errors || []).slice(0, 200));
  return !!j.success;
}

try {
  if (purgeUrls === EVERYTHING) {
    if (await purge({ purge_everything: true })) console.log("[purge] edge cache purged ✓ (everything)");
  } else {
    let ok = 0;
    for (let i = 0; i < purgeUrls.length; i += 30) { // Cloudflare caps a URL purge at 30 files per call
      const chunk = purgeUrls.slice(i, i + 30);
      if (await purge({ files: chunk })) ok += chunk.length;
    }
    console.log(`[purge] edge cache purged ✓ (${ok}/${purgeUrls.length} URLs)`);
    for (const u of purgeUrls) console.log("  " + u);
  }
} catch (e) {
  console.log("[purge] purge error (continuing):", String(e).slice(0, 160));
}
process.exit(0);
