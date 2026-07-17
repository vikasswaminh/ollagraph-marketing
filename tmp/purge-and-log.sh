#!/bin/bash
cd /root/site
echo "=== Running deploy ===" > /tmp/deploy-log.txt 2>&1
npm run deploy >> /tmp/deploy-log.txt 2>&1
echo "=== Done ===" >> /tmp/deploy-log.txt 2>&1
