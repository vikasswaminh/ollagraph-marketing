// Guardrail: keep the design-system migration from regressing.
//
// The migration pulled repeated inline styles into classes in public/styles.css
// and normalized values to the type/spacing/measure scales. This check counts
// inline `style="..."` attributes in the marketing bodies/pages and fails the
// build if the count climbs back above MAX.
//
// Fixing a failure: use an existing class (or add one) in public/styles.css
// instead of an inline style. If an increase is genuinely intentional (a real
// one-off), bump MAX below — a deliberate, reviewable acknowledgement.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const MAX = 1004; // baseline after slices 1-4 + normalization (2026-07)
const ROOTS = ["src/bodies", "src/pages"];

let count = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(astro|html)$/.test(name)) {
      count += (readFileSync(p, "utf8").match(/style="/g) || []).length;
    }
  }
}
for (const r of ROOTS) walk(r);

if (count > MAX) {
  console.error(`\n✗ inline-style guardrail: ${count} inline style="" attributes (max ${MAX}).`);
  console.error(`  Use a class in public/styles.css instead of an inline style.`);
  console.error(`  If this increase is intentional, bump MAX in scripts/check-inline-styles.mjs.\n`);
  process.exit(1);
}
console.log(`✓ inline-style guardrail: ${count}/${MAX}`);
