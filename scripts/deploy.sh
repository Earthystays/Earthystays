#!/usr/bin/env bash
# Earthy Stays — one-command deploy.
#
# Run on the VPS from /var/www/earthystays:
#   ./scripts/deploy.sh
#
# What it does:
#   1. Pulls the latest code
#   2. Installs only NEW dependencies (skips if package.json unchanged)
#   3. Builds the production bundle
#   4. Restarts the PM2 process (zero-downtime reload)
#
# Data (data/*.json) and uploads (public/uploads/*) are NEVER touched —
# they're gitignored and live only on the VPS.

set -euo pipefail

echo "→ Pulling latest code..."
git pull --ff-only

# Only run npm install if package.json or package-lock.json changed.
if git diff --quiet HEAD@{1} HEAD -- package.json package-lock.json; then
  echo "→ Dependencies unchanged, skipping npm install"
else
  echo "→ package.json changed — installing dependencies..."
  npm install --omit=dev
fi

echo "→ Building production bundle..."
npm run build

echo "→ Reloading PM2 (zero downtime)..."
pm2 reload earthystays --update-env

echo "✓ Deploy complete."
