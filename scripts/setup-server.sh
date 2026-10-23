# scripts/setup-server.sh — راه‌اندازی یک‌بارهٔ پروژه روی سرور
# روی سرور ایران یک‌بار اجرا شود (با کاربری که عضو گروه docker است):
#   sudo bash setup-server.sh
#
# پیش‌نیازها: Docker، Caddy (network وب) از قبل توسط server-ops نصب شده‌اند.
set -euo pipefail

APP_DIR=/opt/stack/projects/hassani-yadak
echo "==> ساخت پوشهٔ پروژه"
sudo mkdir -p "$APP_DIR"

echo "==> کپی فایل‌های دیپلوی"
# این فایل‌ها از ریپو روی سرور هستند (یا دستی کپی شوند)
sudo cp docker-compose.yml "$APP_DIR/docker-compose.yml"

echo "==> ساخت فایل .env (حتماً مقادیر را بررسی و تغییر دهید!)"
if [ ! -f "$APP_DIR/.env" ]; then
  DB_PASS=$(openssl rand -hex 24)
  ADMIN_SECRET=$(openssl rand -hex 32)
  CUSTOMER_SECRET=$(openssl rand -hex 32)
  # رمز ادمین تصادفی و قوی — در خروجی چاپ می‌شود تا کاربر یادداشت کند
  ADMIN_PASSWORD=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)
  sudo tee "$APP_DIR/.env" > /dev/null <<EOF
# --- آدرس سایت (سئو) ---
NEXT_PUBLIC_SITE_URL=https://hassani-yadak.ir

# --- دیتابیس (داخل شبکهٔ داخلی compose) ---
DATABASE_URL=postgresql://hassani_yadak:${DB_PASS}@db:5432/hassani_yadak?schema=public
DB_PASSWORD=${DB_PASS}

# --- احراز هویت مشتری ---
CUSTOMER_SECRET=${CUSTOMER_SECRET}

# --- پنل ادمین ---
# نام کاربری و رمز مالک اولیه. رمز بالا تصادفی ساخته شد؛ همین حالا ذخیره کنید.
ADMIN_USERNAME=owner
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_SECRET=${ADMIN_SECRET}

# --- هوش مصنوعی ---
# روی سرور ایران، APIهای AI IP ایرانی را مسدود می‌کنند.
# یک پروکسی/روتر خارجی (مثلاً https://gorouter.app/v1) اینجا ست کنید،
# یا کلید را از پنل ادمین (تنظیمات → هوش مصنوعی) وارد کنید.
AI_PROVIDER=anthropic
AI_API_KEY=
AI_BASE_URL=
AI_MODEL=
EOF
  echo "✓ .env ساخته شد."
  echo ""
  echo "⚠️  رمز عبور ادمین (یک‌بار نمایش داده می‌شود — همین حالا ذخیره کنید):"
  echo "    ADMIN_PASSWORD=${ADMIN_PASSWORD}"
  echo ""
  echo "  اگر گم کردید: sudo nano $APP_DIR/.env و مقدار را عوض کنید."
else
  echo "✓ .env از قبل وجود دارد، دست نخورده"
fi

echo "==> network مشترک Caddy (اگر نیست)"
docker network create web 2>/dev/null || echo "✓ network وب وجود دارد"

echo "==> login به GHCR"
echo "نیاز به Personal Access Token با دسترسی read:packages"
echo "دستور: echo YOUR_TOKEN | docker login ghcr.io -u Ajin2rayAi-prog --password-stdin"

echo ""
echo "راه‌اندازی اولیه تمام ✅"
echo "حالا اولین دیپلوی را با push به main انجام دهید (یا workflow_dispatch)."
echo "برای تست دستی: cd $APP_DIR && docker compose up -d"
