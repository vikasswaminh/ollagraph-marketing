#!/bin/bash
set -e
LOGFILE="$(dirname "$0")/deploy_output.log"
exec > >(tee -a "$LOGFILE") 2>&1

echo "=== DEPLOY START $(date) ==="
echo "PWD: $(pwd)"

echo ""
echo "=== git status ==="
git status --porcelain

echo ""
echo "=== git push ==="
git push origin main

echo ""
echo "=== npm run deploy ==="
PURGE_URLS="https://ollagraph.com/blog/,https://ollagraph.com/blog/extract-structured-data-api-guide/" npm run deploy

echo ""
echo "=== DEPLOY COMPLETE ==="
echo "EXIT_CODE=0"
