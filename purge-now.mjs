// Quick purge script — writes result to ./purge-result.txt
import { writeFileSync } from 'fs';

const ZONE = "6b393cc38ae95c8c7bcbf1e3d56d4b30";
const tok = process.env.CF_PURGE_TOKEN || process.env.CLOUDFLARE_API_TOKEN;

const log = (msg) => {
  console.log(msg);
  writeFileSync('./purge-result.txt', msg + '\n', { flag: 'a' });
};

if (!tok) {
  log("[purge] no token — skipping");
  process.exit(0);
}

try {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`, {
    method: "POST",
    headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify({ purge_everything: true }),
  });
  const j = await res.json();
  if (j.success) log("[purge] SUCCESS ✓");
  else log("[purge] FAIL: " + JSON.stringify(j.errors || []).slice(0, 300));
} catch (e) {
  log("[purge] ERROR: " + String(e).slice(0, 200));
}
