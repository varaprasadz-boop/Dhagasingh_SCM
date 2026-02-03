#!/usr/bin/env bash
# Deploy script for VPS: pull, install, build, db push, restart PM2
# Usage: ./deploy.sh [pm2-app-name]
#   pm2-app-name: optional, e.g. "dhagasin" or "all" (default: dhagasin)

set -e

PM2_APP="${1:-dhagasin}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Deploying from $SCRIPT_DIR"
echo "==> PM2 app target: $PM2_APP"
echo ""

echo "==> git pull"
git pull

echo ""
echo "==> npm install"
npm install

echo ""
echo "==> npm run build"
npm run build

echo ""
echo "==> npm run db:push"
npm run db:push

echo ""
echo "==> pm2 restart $PM2_APP"
pm2 restart "$PM2_APP" --update-env

echo ""
echo "==> Deploy done."
pm2 list
