// Best-effort Cloudflare edge-cache purge, run after `wrangler pages deploy`.
// We set the HTML edge TTL to 1 day for a high cache-hit ratio, so we purge on
// deploy to keep pages fresh. This NEVER fails the deploy: if no token is
// available it just logs and exits 0.
//
// Token: reuse CLOUDFLARE_API_TOKEN (the same var wrangler uses) — make sure it
// also has the "Cache Purge" permission on the ollagraph.com zone — or set a
// dedicated CF_PURGE_TOKEN. If neither is set, pages still refresh within the
// 1-day edge TTL.
const ZONE = "6b393cc38ae95c8c7bcbf1e3d56d4b30";
const tok = process.env.CF_PURGE_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

if (!tok) {
  console.log("[purge] no CLOUDFLARE_API_TOKEN / CF_PURGE_TOKEN — skipping edge purge (pages refresh within the 1-day TTL).");
  process.exit(0);
}
try {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`, {
    method: "POST",
    headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify({ purge_everything: true }),
  });
  const j = await res.json();
  if (j.success) console.log("[purge] edge cache purged ✓");
  else console.log("[purge] purge failed (continuing):", JSON.stringify(j.errors || []).slice(0, 200));
} catch (e) {
  console.log("[purge] purge error (continuing):", String(e).slice(0, 160));
}
process.exit(0);
