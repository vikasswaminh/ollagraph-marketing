#!/bin/bash
set -e
cd /Users/ollima/Documents/ollagraph.com

echo "=== Git Status ==="
git status

echo ""
echo "=== Adding files ==="
git add src/pages/blog/extract-structured-data-api-guide.astro src/data/posts.ts

echo ""
echo "=== Committing ==="
git commit -m "Add blog post: Extract Structured Data from Any Website API Guide"

echo ""
echo "=== Pushing ==="
git push origin main

echo ""
echo "=== Done! ==="
echo "Post will be live at: https://ollagraph.com/blog/extract-structured-data-api-guide/"
