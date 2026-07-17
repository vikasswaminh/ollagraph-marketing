#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "=== Working dir: $(pwd) ==="

echo "=== git status before ==="
git status --porcelain

echo ""
echo "=== git add (blog post + posts manifest) ==="
git add src/pages/blog/extract-structured-data-api-guide.astro src/data/posts.ts

echo ""
echo "=== git status after add ==="
git status --porcelain

echo ""
echo "=== git commit ==="
git commit -m "Add blog post: Extract Structured Data from Any Website API Guide"

echo ""
echo "=== git push ==="
git push origin main

echo ""
echo "=== npm run deploy (build + wrangler + targeted cache purge) ==="
# PURGE_URLS env var tells purge-cache.mjs to only purge the blog URLs,
# avoiding a full purge_everything that would evict the entire edge cache.
PURGE_URLS="https://ollagraph.com/blog/,https://ollagraph.com/blog/extract-structured-data-api-guide/" npm run deploy

echo ""
echo "=== DONE ==="
echo "Blog post deployed successfully with targeted CDN purge only."
