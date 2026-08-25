// Best-effort Cloudflare edge-cache purge, run after `wrangler pages deploy`.
// We set the HTML edge TTL to 1 day for a high cache-hit ratio, so we purge on
// deploy to keep pages fresh. This NEVER fails the deploy: if no token is
// available it just logs and exits 0.
//
// Token: reuse CLOUDFLARE_API_TOKEN (the same var wrangler uses) — make sure it
// also has the "Cache Purge" permission on the ollagraph.com zone — or set a
// dedicated CF_PURGE_TOKEN. If neither is set, pages still refresh within the
// 1-day edge TTL.
//
// TARGETED PURGE: instead of purge_everything (which evicts the entire edge
// cache and can cause origin spikes), we only purge the URLs that actually
// changed. Add paths to the list below or set the PURGE_URLS env var as a
// comma-separated list. Falls back to purge_everything only if neither is set.
const ZONE = "6b393cc38ae95c8c7bcbf1e3d56d4b30";
const tok = process.env.CF_PURGE_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

if (!tok) {
  console.log("[purge] no CLOUDFLARE_API_TOKEN / CF_PURGE_TOKEN — skipping edge purge (pages refresh within the 1-day TTL).");
  process.exit(0);
}

// Default targeted URLs — add new pages here when deploying content updates.
const DEFAULT_PURGE_URLS = [
  "https://ollagraph.com/blog/",
  "https://ollagraph.com/blog/ai-search-visibility-score-practical-framework-measuring-brand-presence/",
  "https://ollagraph.com/blog/how-to-measure-ai-search-visibility-chatgpt-gemini-claude-perplexity/",
  "https://ollagraph.com/blog/aeo-audit-tool-what-should-answer-engine-optimization-audit-measure/",
  "https://ollagraph.com/blog/langgraph-mcp-web-tools-integration/",
  "https://ollagraph.com/blog/connect-cursor-ide-to-web-search-mcp-server/",
  "https://ollagraph.com/blog/extract-structured-data-api-guide/",
];

const purgeUrls = process.env.PURGE_URLS
  ? process.env.PURGE_URLS.split(",").map(s => s.trim()).filter(Boolean)
  : DEFAULT_PURGE_URLS;

try {
  // Use targeted purge by URL list to avoid evicting the entire edge cache.
  const body = purgeUrls.length > 0
    ? JSON.stringify({ files: purgeUrls })
    : JSON.stringify({ purge_everything: true });

  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`, {
    method: "POST",
    headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body,
  });
  const j = await res.json();
  if (j.success) {
    console.log("[purge] edge cache purged ✓", purgeUrls.length > 0 ? `(targeted: ${purgeUrls.join(", ")})` : "(everything)");
  } else {
    console.log("[purge] purge failed (continuing):", JSON.stringify(j.errors || []).slice(0, 200));
  }
} catch (e) {
  console.log("[purge] purge error (continuing):", String(e).slice(0, 160));
}
process.exit(0);
