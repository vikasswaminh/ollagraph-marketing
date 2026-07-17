#!/bin/bash
set -e
cd /workspace

echo "=== git status before ===" > /tmp/deploy_result.txt
git status --porcelain >> /tmp/deploy_result.txt 2>&1

echo "=== git add ===" >> /tmp/deploy_result.txt
git add src/pages/blog/extract-structured-data-api-guide.astro src/data/posts.ts >> /tmp/deploy_result.txt 2>&1

echo "=== git status after add ===" >> /tmp/deploy_result.txt
git status --porcelain >> /tmp/deploy_result.txt 2>&1

echo "=== git commit ===" >> /tmp/deploy_result.txt
git commit -m "Add blog post: Extract Structured Data from Any Website API Guide" >> /tmp/deploy_result.txt 2>&1

echo "=== git push ===" >> /tmp/deploy_result.txt
git push origin main >> /tmp/deploy_result.txt 2>&1

echo "=== done ===" >> /tmp/deploy_result.txt
echo "SUCCESS" >> /tmp/deploy_result.txt
