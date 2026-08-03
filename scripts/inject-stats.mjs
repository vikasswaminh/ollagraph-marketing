#!/usr/bin/env node
// Replace %%ENDPOINT_COUNT%% tokens in the built dist/ with the value from
// src/data/api-stats.json — the single source of truth for the API operation
// count. This kills the old drift where the count was hardcoded across ~20
// pages. To change the count, edit src/data/api-stats.json ONLY.
//
// Runs after `astro build` (wired into the "build" script), like gen-sitemap.
// FAILS the build if any token survives, so a stray %%…%% can never ship.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const stats = JSON.parse(readFileSync(new URL('../src/data/api-stats.json', import.meta.url), 'utf-8'));
const TOKENS = { '%%ENDPOINT_COUNT%%': String(stats.endpointCount) };
const DIST = 'dist';
const TEXT_EXT = new Set(['.html', '.txt', '.xml', '.json', '.js', '.css']);

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

const isText = (f) => { const i = f.lastIndexOf('.'); return i >= 0 && TEXT_EXT.has(f.slice(i)); };

let files = 0, hits = 0;
for (const f of walk(DIST)) {
  if (!isText(f)) continue;
  let t = readFileSync(f, 'utf-8'), changed = false;
  for (const [tok, val] of Object.entries(TOKENS)) {
    if (t.includes(tok)) { t = t.split(tok).join(val); changed = true; hits += 1; }
  }
  if (changed) { writeFileSync(f, t); files += 1; }
}
console.log(`[inject-stats] endpointCount=${stats.endpointCount} → rewrote ${files} files`);

// Safety net: no token may survive into the shipped build.
let leftover = 0;
for (const f of walk(DIST)) {
  if (isText(f) && readFileSync(f, 'utf-8').includes('%%ENDPOINT_COUNT%%')) {
    leftover += 1; console.error(`  LEFTOVER token in ${f}`);
  }
}
if (leftover) { console.error(`[inject-stats] FAILED: ${leftover} file(s) still contain the token`); process.exit(1); }
if (files === 0) console.warn('[inject-stats] note: no %%ENDPOINT_COUNT%% tokens found (nothing to inject).');
