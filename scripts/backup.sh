#!/usr/bin/env bash
# Earthy Stays — nightly backup of data/ + public/uploads/
#
# Run on the VPS via cron:
#   crontab -e
#   0 3 * * *  /var/www/earthystays/scripts/backup.sh >> /var/log/earthystays-backup.log 2>&1
#
# Keeps 14 days of rolling backups in /var/backups/earthystays/

set -euo pipefail

APP_DIR="/var/www/earthystays"
BACKUP_DIR="/var/backups/earthystays"
STAMP="$(date +%Y-%m-%d_%H-%M)"
KEEP_DAYS=14

mkdir -p "$BACKUP_DIR"

tar -czf "$BACKUP_DIR/earthystays-${STAMP}.tar.gz" \
  -C "$APP_DIR" \
  data public/uploads 2>/dev/null || true

# Prune backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "earthystays-*.tar.gz" -mtime +${KEEP_DAYS} -delete

echo "[$(date -Iseconds)] backup complete → $BACKUP_DIR/earthystays-${STAMP}.tar.gz"
