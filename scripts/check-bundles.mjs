#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const bundles = JSON.parse(readFileSync(join(root, 'src/content/bundles.json'), 'utf-8'));
const spec    = JSON.parse(readFileSync(join(root, 'src/openapi.json'),       'utf-8'));
const livePaths = new Set(Object.keys(spec.paths || {}));
const errors = [];
const seenSlugs = new Set();
for (const b of bundles) {
  if (seenSlugs.has(b.slug)) errors.push(`duplicate slug: ${b.slug}`);
  seenSlugs.add(b.slug);
  if (!b.endpoints?.length) errors.push(`bundle ${b.slug} has no endpoints`);
  for (const ep of (b.endpoints || [])) {
    if (!livePaths.has(ep.path)) {
      errors.push(`bundle ${b.slug}: endpoint path not in openapi.json → ${ep.method} ${ep.path}`);
    }
    const method = (ep.method || '').toLowerCase();
    if (method && spec.paths[ep.path] && !spec.paths[ep.path][method]) {
      errors.push(`bundle ${b.slug}: method mismatch for ${ep.path} → expected ${method.toUpperCase()} but spec has [${Object.keys(spec.paths[ep.path]).join(',')}]`);
    }
  }
}
if (errors.length) {
  console.error('[check-bundles] FAIL — bundles.json is out of sync with src/openapi.json:');
  for (const e of errors) console.error('  - ' + e);
  console.error(`[check-bundles] ${errors.length} error(s). Edit src/content/bundles.json or regenerate src/openapi.json from the live spec.`);
  process.exit(1);
}
const totalEndpoints = bundles.reduce((s, b) => s + (b.endpoints?.length || 0), 0);
const uniquePaths = new Set(bundles.flatMap(b => (b.endpoints || []).map(e => e.path)));
console.log(`[check-bundles] OK — ${bundles.length} bundles, ${totalEndpoints} endpoint refs, ${uniquePaths.size} unique paths.`);
