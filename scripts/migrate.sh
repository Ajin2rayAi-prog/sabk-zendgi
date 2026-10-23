#!/bin/sh
# scripts/migrate.sh — اجرای migration (+ optionally seed) روی سرور
#
# روش کار: schema و migrations از خودِ ایمیجِ جدید استخراج می‌شوند
# (docker create + docker cp) پس همیشه با کدی که دیپلوی شده هم‌خوان‌اند.
# چون ایمیج runtime سبک است و @prisma/config وابستگی‌هایی مثل effect
# ندارد، migration داخل یک کانتینر کمکیِ node:22-alpine اجرا می‌شود
# که prisma را تازه نصب می‌کند و کلاینت musl را تولید می‌کند.
#
# اجرا (روی سرور، از دایرکتوری پروژه):
#   bash migrate.sh             # فقط migration
#   bash migrate.sh --seed      # migration + seed (بدون حذف رکوردهای قدیمی)
#   bash migrate.sh --seed-prune # migration + seed + حذف دسته/محصولات منسوخ
# نکته: --seed-prune فقط برای برش نسخهٔ کاتالوگ است؛ محصولات ساخته‌شده
# از پنل که SKU آن‌ها در کاتالوگ نیست حذف می‌شوند. با احتیاط اجرا شود.
set -e

APP_DIR="${APP_DIR:-/opt/stack/projects/hassani-yadak}"
IMAGE="${IMAGE:-ghcr.io/ajin2rayai-prog/hassani-yadak:latest}"

if [ ! -f "$APP_DIR/.env" ]; then
  echo "خطا: $APP_DIR/.env پیدا نشد"
  exit 1
fi
DATABASE_URL="$(grep '^DATABASE_URL=' "$APP_DIR/.env" | head -1 | cut -d= -f2-)"
if [ -z "$DATABASE_URL" ]; then
  echo "خطا: DATABASE_URL در .env ست نشده"
  exit 1
fi

SEED=0
PRUNE=0
if [ "$1" = "--seed" ]; then SEED=1; fi
if [ "$1" = "--seed-prune" ]; then SEED=1; PRUNE=1; fi

echo "==> استخراج schema + migrations از ایمیج $IMAGE"
WORK=/tmp/prisma-work
rm -rf "$WORK"
mkdir -p "$WORK/prisma" "$WORK/src/data"
CID="$(docker create "$IMAGE")"
docker cp "$CID:/app/prisma/." "$WORK/prisma/"
if [ "$SEED" = "1" ]; then
  # seed.ts و catalog.ts: اول از ایمیج جدید (هم‌خوان با کد دیپلوی‌شده)،
  # و اگر نبود از migrations-src روی سرور.
  docker cp "$CID:/app/prisma/seed.ts" "$WORK/prisma/seed.ts" 2>/dev/null || \
    cp "$APP_DIR/migrations-src/seed.ts" "$WORK/prisma/seed.ts" 2>/dev/null || true
  docker cp "$CID:/app/src/data/catalog.ts" "$WORK/src/data/catalog.ts" 2>/dev/null || \
    cp "$APP_DIR/migrations-src/src-data/catalog.ts" "$WORK/src/data/catalog.ts" 2>/dev/null || true
  cp "$APP_DIR/migrations-src/tsconfig.json" "$WORK/tsconfig.json" 2>/dev/null || true
fi
docker rm "$CID" >/dev/null
echo "migrations: $(ls "$WORK/prisma/migrations" 2>/dev/null | wc -l) پوشه"
cat > "$WORK/package.json" <<'PJ'
{ "name": "prisma-work", "private": true }
PJ

echo "==> نصب prisma + تولید کلاینت musl"
if [ "$SEED" = "1" ]; then
  docker run --rm -v "$WORK":/work -w /work node:22-alpine sh -c '
    npm install --no-audit --no-fund prisma@6.19.3 @prisma/client@6.19.3 tsx@4.23.12 typescript@5 >/dev/null 2>&1
    npx prisma generate >/dev/null 2>&1
  '
else
  docker run --rm -v "$WORK":/work -w /work node:22-alpine sh -c '
    npm install --no-audit --no-fund prisma@6.19.3 @prisma/client@6.19.3 >/dev/null 2>&1
    npx prisma generate >/dev/null 2>&1
  '
fi

# migration‌هایی که قبلاً به‌صورت دستی apply شده‌اند را علامت بزن
# (baseline) تا migrate deploy فقط migration‌های جدید را اجرا کند.
echo "==> NOTE: auto-baseline removed (2026-09-21)."
echo "    It used to mark NEW migrations as applied without running them."
echo "    migrate deploy below is the source of truth." 
echo "    If a migration was applied manually, mark it once by hand:"
echo "    prisma migrate resolve --applied <name>"

echo "==> migrate deploy"
docker run --rm -e DATABASE_URL="$DATABASE_URL" --network hassani-yadak_internal \
  -v "$WORK":/work -w /work node:22-alpine \
  sh -c 'cd /work/prisma && npx prisma migrate deploy' 2>&1 | tail -15

if [ "$SEED" = "1" ]; then
  echo "==> seed"
  SEED_PRUNE_REMOVED="$([ "$PRUNE" = "1" ] && echo 1 || echo 0)"
  ADMIN_USERNAME="$(grep '^ADMIN_USERNAME=' "$APP_DIR/.env" | head -1 | cut -d= -f2-)"
  ADMIN_PASSWORD="$(grep '^ADMIN_PASSWORD=' "$APP_DIR/.env" | head -1 | cut -d= -f2-)"
  ADMIN_SECRET="$(grep '^ADMIN_SECRET=' "$APP_DIR/.env" | head -1 | cut -d= -f2-)"
  docker run --rm -e DATABASE_URL="$DATABASE_URL" -e SEED_PRUNE_REMOVED="$SEED_PRUNE_REMOVED" \
    -e ADMIN_USERNAME="$ADMIN_USERNAME" -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    -e ADMIN_SECRET="$ADMIN_SECRET" --network hassani-yadak_internal \
    -v "$WORK":/work -w /work node:22-alpine \
    sh -c 'cd /work/prisma && npx tsx seed.ts' 2>&1 | tail -10
fi

echo "✓ تمام"
