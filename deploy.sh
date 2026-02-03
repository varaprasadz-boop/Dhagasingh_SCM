#!/usr/bin/env bash
# Deploy script: SSH to VPS and run pull, install, build, db push, restart PM2
# Usage: ./deploy.sh [pm2-app-name]
#   pm2-app-name: optional, e.g. "dhagasin" or "all" (default: dhagasin)
#
# Set VPS_APP_DIR if your app lives elsewhere on the server, e.g.:
#   VPS_APP_DIR=/root/dhagasingh-scm ./deploy.sh

set -e

# VPS connection and app path on server
VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-72.61.240.4}"
VPS_APP_DIR="${VPS_APP_DIR:-/var/www/Dhagasingh_SCM}"
PM2_APP="${1:-dhagasin}"

REMOTE="${VPS_USER}@${VPS_HOST}"

echo "==> Deploying to $REMOTE (app dir: $VPS_APP_DIR)"
echo "==> PM2 app target: $PM2_APP"
echo ""

ssh "$REMOTE" "set -e && cd $VPS_APP_DIR && \
  echo '==> git pull' && git pull && \
  echo '' && echo '==> npm install' && npm install && \
  echo '' && echo '==> npm run build' && npm run build && \
  echo '' && echo '==> npm run db:push' && npm run db:push && \
  echo '' && echo '==> pm2 restart $PM2_APP' && pm2 restart $PM2_APP --update-env && \
  echo '' && echo '==> Deploy done.' && pm2 list"
