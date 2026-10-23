#!/usr/bin/env bash
# fix-uploads.sh — تعمیر سرو فایل‌های آپلودشده (/uploads/*) برای پروژه‌های Next.js standalone
#
# مشکل: عکس/ویدیوی آپلودشده از پنل 404 می‌خورد (یا فقط با ری‌استارت اپ دیده می‌شد).
# راه‌حل: بایند پوشهٔ هاست + سرو مستقیم از Caddy (بدون عبور از برنامه).
#
# استفاده:
#   bash fix-uploads.sh /opt/stack/projects/PROJ [domain.tld]
# مثال:
#   bash fix-uploads.sh /opt/stack/projects/hassani-yadak hassani-yadak.ir
#
# فرض‌ها (مثل همهٔ پروژه‌های ما):
#   - سرویس اپ در کامپوز پروژه `app` نام دارد و داخل کانتینر به پورت 3000 گوش می‌دهد
#   - Caddy در /opt/stack/caddy با فایل Caddyfile و سرویس `caddy` است
#   - آپلودها داخل کانتینر در /app/public/uploads ذخیره می‌شوند
#
# اسکریپت idempotent است: اگر چیزی از قبل درست باشد رد می‌شود.
set -euo pipefail

PROJ="${1:-/opt/stack/projects/hassani-yadak}"
DOMAIN="${2:-}"
CADDY_DIR="/opt/stack/caddy"
APP="app"

green() { echo -e "\e[32m[OK]\e[0m $*"; }
warn()  { echo -e "\e[33m[--]\e[0m $*"; }
die()   { echo -e "\e[31m[ERR]\e[0m $*" >&2; exit 1; }

command -v docker >/dev/null || die "docker پیدا نشد"
[ -d "$PROJ" ] || die "پوشهٔ پروژه پیدا نشد: $PROJ"
[ -f "$CADDY_DIR/Caddyfile" ] || die "Caddyfile پیدا نشد: $CADDY_DIR/Caddyfile"
docker compose -p "__probe__" version >/dev/null 2>&1 || die "docker compose plugin لازم است"

cd "$PROJ"
CID="$(docker compose ps -q "$APP" 2>/dev/null || true)"
[ -n "$CID" ] || die "کانتینر $APP روشن نیست (اول docker compose up -d)"

echo "== ۱) پیدا کردن محل آپلودها =="
MOUNT="$(docker inspect "$CID" --format '{{range .Mounts}}{{if eq .Destination "/app/public/uploads"}}{{.Type}}:{{.Name}}|{{.Source}}{{end}}{{end}}')"
echo "   mount: $MOUNT"

echo "== ۲) انتقال فایل‌ها به پوشهٔ هاست (uploads-data) =="
mkdir -p uploads-data
if [ -n "$MOUNT" ]; then
  docker cp "$CID:/app/public/uploads/." ./uploads-data/ 2>/dev/null || true
fi
COUNT="$(ls -1 uploads-data 2>/dev/null | wc -l | tr -d ' ')"
green "فایل‌ها در uploads-data: $COUNT"

echo "== ۳) بایند در docker-compose پروژه =="
COMPOSE="docker-compose.yml"
[ -f "$COMPOSE" ] || COMPOSE="docker-compose.yaml"
[ -f "$COMPOSE" ] || die "docker-compose.yml پیدا نشد"
if grep -q '\./uploads-data:/app/public/uploads' "$COMPOSE"; then
  warn "بایند از قبل هست — رد شد"
else
  # هر والیومی که به /app/public/uploads وصل است با بایند جایگزین می‌شود
  sed -i 's#^\(\s*\)- [A-Za-z0-9_.-]*:/app/public/uploads\s*$#\1- ./uploads-data:/app/public/uploads#' "$COMPOSE"
  grep -q '\./uploads-data:/app/public/uploads' "$COMPOSE" \
    && green "کامپوز اصلاح شد" \
    || die "خط volumes در کامپوز پیدا نشد — دستی چک شود"
fi

echo "== ۴) بایند در کامپوز Caddy =="
# مسیر یکتا برای هر پروژه (تا چند پروژه روی یک سرور قاطی نشوند)
SRVDIR="/srv/$(basename "$PROJ")-uploads"
CADDY_COMPOSE="$CADDY_DIR/docker-compose.yml"
[ -f "$CADDY_COMPOSE" ] || CADDY_COMPOSE="$CADDY_DIR/docker-compose.yaml"
BIND_LINE="      - ${PROJ}/uploads-data:${SRVDIR}:ro"
if grep -qF "$SRVDIR" "$CADDY_COMPOSE"; then
  warn "بایند Caddy از قبل هست — رد شد"
else
  if grep -q './Caddyfile:/etc/caddy/Caddyfile:ro' "$CADDY_COMPOSE"; then
    # درج بعد از خط Caddyfile
    awk -v line="$BIND_LINE" '{print} $0 ~ /Caddyfile:\/etc\/caddy\/Caddyfile:ro/ {print line}' \
      "$CADDY_COMPOSE" > "$CADDY_COMPOSE.tmp" && mv "$CADDY_COMPOSE.tmp" "$CADDY_COMPOSE"
    green "بایند Caddy اضافه شد"
  else
    die "جای volumes در کامپوز Caddy پیدا نشد — دستی اضافه شود: $BIND_LINE"
  fi
fi

echo "== ۵) بلوک Caddyfile =="
CADDYFILE="$CADDY_DIR/Caddyfile"
if grep -q 'handle_path /uploads/' "$CADDYFILE"; then
  warn "بلوک Caddyfile از قبل هست — رد شد"
else
  # درج قبل از اولین @static شامل uploads، و حذف uploads فقط از همان خط
  awk -v srv="$SRVDIR" '
    !done && /@static path/ && /\/uploads\/\*/ {
      print "        handle_path /uploads/* {"
      print "                root * " srv
      print "                file_server"
      print "                header Cache-Control \"public, max-age=86400\""
      print "        }"
      done = 1
      gsub(/\/uploads\/\*/, "")
      gsub(/  +/, " ")
      print
      next
    }
    { print }
  ' "$CADDYFILE" > "$CADDYFILE.tmp" && mv "$CADDYFILE.tmp" "$CADDYFILE"
  grep -q 'handle_path /uploads/' "$CADDYFILE" \
    && green "بلوک Caddyfile اضافه شد" \
    || die "خط @static پیدا نشد — بلوک را دستی اضافه کنید"
fi

echo "== ۶) بالا آوردن مجدد =="
(cd "$CADDY_DIR" && docker compose up -d) | tail -1
(cd "$PROJ" && docker compose up -d) | tail -2
sleep 8

echo "== ۷) تست =="
NEWEST="$(ls -t uploads-data 2>/dev/null | head -1 || true)"
if [ -n "$NEWEST" ] && [ -n "$DOMAIN" ]; then
  CODE="$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN/uploads/$NEWEST" || true)"
  echo "   $NEWEST -> $CODE"
  [ "$CODE" = "200" ] && green "سرو مستقیم کار می‌کند" || warn "کد $CODE — لاگ Caddy چک شود"
elif [ -n "$NEWEST" ]; then
  warn "دامنه داده نشده؛ تست دستی: https://DOMAIN/uploads/$NEWEST"
else
  warn "فایلی برای تست نیست؛ یک عکس از پنل آپلود کنید"
fi

echo ""
echo "=============================="
echo " تمام شد ✅  تست کن:"
echo " یه عکس/ویدیو از پنل آپلود کن و بدون ری‌استارت بازش کن"
echo "=============================="
