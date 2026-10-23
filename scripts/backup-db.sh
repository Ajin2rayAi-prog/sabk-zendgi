#!/bin/sh
# scripts/backup-db.sh — بکاپ روزانهٔ دیتابیس + آپلودها
#
# این اسکریپت را به cron سرور اضافه کنید:
#   0 3 * * * /opt/stack/projects/hassani-yadak/backup-db.sh >> /var/log/arun-backup.log 2>&1
#
# بکاپ‌ها ۳۰ روز نگه داشته می‌شوند (قابل تغییر: KEEP_DAYS)
set -e

APP_DIR=/opt/stack/projects/hassani-yadak
BACKUP_DIR=/opt/stack/backups
KEEP_DAYS=30
CONTAINER=hassani-yadak-db

mkdir -p "$BACKUP_DIR"

STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/db-$STAMP.sql.gz"

echo "[$(date)] ==> dump دیتابیس"
docker exec "$CONTAINER" pg_dump -U hassani_yadak hassani_yadak | gzip -9 > "$OUT"
echo "[$(date)] ✓ $OUT ($(du -h "$OUT" | cut -f1))"

echo "[$(date)] ==> بکاپ آپلودها"
if [ -d "$APP_DIR/uploads-data" ]; then
  tar czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$APP_DIR" uploads-data 2>/dev/null && \
    echo "[$(date)] ✓ uploads-$STAMP.tar.gz"
fi

echo "[$(date)] ==> پاک‌سازی بکاپ‌های قدیمی‌تر از $KEEP_DAYS روز"
find "$BACKUP_DIR" -name 'db-*.sql.gz' -mtime +$KEEP_DAYS -delete
find "$BACKUP_DIR" -name 'uploads-*.tar.gz' -mtime +$KEEP_DAYS -delete

echo "[$(date)] ==> لیست بکاپ‌ها"
ls -lh "$BACKUP_DIR" | tail -10
echo "[$(date)] ✓ تمام"
