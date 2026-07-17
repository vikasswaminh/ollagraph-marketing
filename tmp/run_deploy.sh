#!/bin/bash
set -e
LOG="/tmp/deploy_result.txt"
cd "$(dirname "$0")/.."
echo "=== Working dir: $(pwd) ===" > "$LOG"

echo "=== git status before ===" >> "$LOG"
git status --porcelain >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== git add ===" >> "$LOG"
git add src/pages/blog/extract-structured-data-api-guide.astro src/data/posts.ts >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== git commit ===" >> "$LOG"
git commit -m "Add blog post: Extract Structured Data from Any Website API Guide" >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== git push ===" >> "$LOG"
git push origin main >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== npm run build ===" >> "$LOG"
npm run build >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== npm run deploy ===" >> "$LOG"
PURGE_URLS="https://ollagraph.com/blog/,https://ollagraph.com/blog/extract-structured-data-api-guide/" npm run deploy >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== DONE ===" >> "$LOG"
echo "EXIT_CODE=0" >> "$LOG"
