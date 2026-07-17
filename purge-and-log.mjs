import { writeFileSync } from 'fs';

const ZONE = "6b393cc38ae95c8c7bcbf1e3d56d4b30";
const tok = process.env.CF_PURGE_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
const log = [];

log.push(`[${new Date().toISOString()}] Starting purge...`);
log.push(`Token present: ${tok ? "yes (len=" + tok.length + ")" : "NO"}`);

if (!tok) {
  log.push("No token — exiting.");
  writeFileSync("purge-log.txt", log.join("\n"));
  process.exit(0);
}

try {
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`, {
    method: "POST",
    headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json" },
    body: JSON.stringify({ purge_everything: true }),
  });
  const j = await res.json();
  log.push(`Response: ${JSON.stringify(j)}`);
  if (j.success) log.push("SUCCESS: edge cache purged!");
  else log.push("FAILED: " + JSON.stringify(j.errors || []));
} catch (e) {
  log.push("ERROR: " + String(e));
}

writeFileSync("purge-log.txt", log.join("\n"));
process.exit(0);
