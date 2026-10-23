#!/bin/sh
# scripts/backup-notify.sh — ارسال بکاپ به تلگرام و بله
#
# این اسکریپت بعد از backup-db.sh اجرا می‌شود. آخرین فایل بکاپ
# دیتابیس را می‌گیرد و به هر دو پیام‌رسان می‌فرستد.
#
# نیازمند متغیرهای محیطی در .env:
#   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
#   BALE_BOT_TOKEN, BALE_CHAT_ID
#
# اجرای دستی:
#   source /opt/stack/projects/hassani-yadak/.env  # یا export دستی
#   bash backup-notify.sh
set -e

BACKUP_DIR=${BACKUP_DIR:-/opt/stack/backups}
LATEST=$(ls -t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
  echo "خطا: فایل بکاپی پیدا نشد"
  exit 1
fi

SIZE=$(du -h "$LATEST" | cut -f1)
STAMP=$(date +"%Y-%m-%d %H:%M")
CAPTION="🗄 بکاپ دیتابیس — سبک زندگی
📅 $STAMP
📦 $(basename "$LATEST") ($SIZE)"

send() {
  # $1 = api base, $2 = token, $3 = chat_id
  local URL="$1/bot$2/sendDocument"
  echo "==> ارسال به $1"
  curl -s -X POST "$URL" \
    -F "chat_id=$3" \
    -F "document=@$LATEST" \
    -F "caption=$CAPTION" \
    -m 120 \
    -o /dev/null -w "  http=%{http_code}\n" || echo "  (خطا در ارسال)"
}

# تلگرام
if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
  send "https://api.telegram.org" "$TELEGRAM_BOT_TOKEN" "$TELEGRAM_CHAT_ID"
else
  echo "==> تلگرام: توکن/chat_id ست نشده — رد شد"
fi

# بله
if [ -n "${BALE_BOT_TOKEN:-}" ] && [ -n "${BALE_CHAT_ID:-}" ]; then
  send "https://tapi.bale.ai" "$BALE_BOT_TOKEN" "$BALE_CHAT_ID"
else
  echo "==> بله: توکن/chat_id ست نشده — رد شد"
fi

echo "✓ تمام"
