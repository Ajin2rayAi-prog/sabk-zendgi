# راهنمای دیپلوی — سبک زندگی

> ⚠ **PLACEHOLDER** — دامنهٔ `hassani-yadak.ir` در این راهنما فرضی است؛
> دامنهٔ واقعی را کارفرما اعلام می‌کند. همچنین `docker-compose.yml` فعلی
> ایمیج را **محلی** بیلد می‌کند (`build: .`) و به GHCR وابسته نیست؛
> بخش GHCR این راهنما مربوط به قالب اصلی است و در صورت نیاز فعال می‌شود.

این راهنما پروژه را روی **سرور ایران** بالا می‌آورد بدون اینکه مشکل کندی npm/next build
روی VPS پیش بیاید. کلید اصلی: **build روی GitHub Actions (رانر خارجی سریع)** انجام می‌شود
و سرور فقط ایمیج آماده را pull می‌کند.

## معماری

```
GitHub (main push)
   ↓ build ایمیج روی رانر سریع خارجی
GHCR (ghcr.io/ajin2rayai-prog/hassani-yadak)
   ↓ SSH + docker compose pull (سرور ایران)
سرور ایران: app + postgres + volume آپلود
   ↑ Caddy (SSL خودکار، شبکهٔ web)
```

چرا این روش؟ روی سرور ایران، `npm ci` و `next build` بسیار کند هستند و گاهی
به‌خاطر قطعی رجیستری‌ها شکست می‌خورند. با این روش، سرور **هیچ‌وقت** npm/next را
اجرا نمی‌کند — فقط یک ایمیج آمادهٔ سبک (~۱۰۰MB) را دانلود و اجرا می‌کند.

## ۱) پیش‌نیازهای سرور (یک‌بار)

اطمینان حاصل کنید که `server-ops` قبلاً روی سرور اجرا شده (Docker + Caddy).
سپس روی سرور:

```bash
# network مشترک Caddy (یک‌بار)
docker network create web
```

## ۲) فایل‌های دیپلوی را روی سرور بگذارید

```bash
sudo mkdir -p /opt/stack/projects/hassani-yadak
sudo cp docker-compose.yml /opt/stack/projects/hassani-yadak/
```

## ۳) تنظیمات محیط (.env)

اسکریپت راه‌اندازی خودکار رمزهای تصادفی می‌سازد:

```bash
cd /opt/stack/projects/hassani-yadak
sudo bash -c "$(curl -fsSL https://raw.githubusercontent.com/Ajin2rayAi-prog/hassani-yadak/main/scripts/setup-server.sh)"
```

یا دستی `.env` بسازید (الگوی `.env.example` را ببینید). **حتماً** این‌ها را عوض کنید:

- `NEXT_PUBLIC_SITE_URL` → آدرس واقعی (`https://hassani-yadak.ir`)
- `ADMIN_PASSWORD` → رمز قوی پنل ادمین
- `CUSTOMER_SECRET`, `ADMIN_SECRET` → رشته‌های تصادفی بلند
- `DB_PASSWORD` → رمز قوی دیتابیس (با `docker-compose.yml` هم‌خوانی دارد)

### ⚠️ هوش مصنوعی روی سرور ایران
Anthropic و OpenAI **IPهای ایرانی را مسدود می‌کنند**. دو راه دارید:

۱. **پروکسی خارجی (توصیه‌شده):** یک روتر خارجی (مثلاً `https://gorouter.app/v1`)
   را در `.env` به‌عنوان `AI_BASE_URL` ست کنید. کد از همان ابتدا از این متغیر
   پشتیبانی می‌کند.

۲. **از پنل ادمین:** `/admin/settings` → بخش هوش مصنوعی → Base URL را وارد کنید.

بدون این تنظیم، دستیار هوش مصنوعی و جستجوی هوشمند کار نخواهند کرد.

## ۴) Secrets را در GitHub تنظیم کنید

ریپو → Settings → Secrets and variables → Actions → New repository secret:

| نام | مقدار |
|---|---|
| `SSH_HOST` | IP سرور |
| `SSH_USER` | کاربر ادمین (عضو گروه docker) |
| `SSH_KEY` | کلید خصوصی SSH (کل فایل) |

> `GITHUB_TOKEN` خودکار برای push به GHCR استفاده می‌شود (نیازی به تنظیم دستی نیست).

## ۵) دیپلوی روزمره (اتوماتیک)

هر `git push` به `main` کافی است. GitHub Actions خودکار این مراحل را اجرا می‌کند:

۱. ساخت ایمیج روی رانر GitHub (~۳ دقیقه)
۲. push به GHCR
۳. SSH به سرور → `docker compose pull`
۴. اجرای `scripts/migrate.sh` (migration دیتابیس — از داخل کانتینر کمکی)
۵. `docker compose up -d`

بعد از push، حدود ۳-۴ دقیقه بعد تغییرات روی سایت زنده‌اند. نیازی به کار
دستی روی سرور نیست.

> مهاجرت‌های دیتابیس (`prisma/migrations/`) به‌صورت خودکار اعمال می‌شوند.
> فقط کافیست فایل migration جدید را با `prisma migrate dev` بسازید و commit کنید.

### rollback (اگر دیپلوی خراب شد)

```bash
cd /opt/stack/projects/hassani-yadak
docker tag hassani-yadak:previous hassani-yadak:latest
docker compose up -d
```

یا در گیت‌هاب: تب Actions → روی workflow قبلی **Re-run** بزنید.

## ۶) Caddy — دامنه و SSL

در Caddyfile سرور، یک رکورد برای دامنه اضافه کنید:

```caddyfile
hassani-yadak.ir {
    reverse_proxy hassani-yadak:3000
}
```

سپس `docker exec caddy caddy reload --config /etc/caddy/Caddyfile`.

DNS: یک رکورد A به IP سرور (اگر پشت Cloudflare است، **DNS-only** انتخاب کنید،
نه پروکسی — پروکسی Cloudflare با SSL خودکار Caddy تداخل دارد).

## ۷) عکس‌های محصولات (مهم!)

- **عکس‌های کاتالوگ** (مثل `circuits-1.jpg`): داخل ایمیج پخته شده‌اند و همیشه
  سرجایشان می‌مانند — نیاز به کاری ندارند.

- **عکس‌های آپلودشده از پنل ادمین**: در `/app/public/uploads` ذخیره می‌شوند که
  روی یک **Docker volume** سوار است. به این ترتیب با دیپلوی بعدی **پاک نمی‌شوند**.

> ⚠️ اگر قبلاً عکس‌هایی را در `public/products` آپلود کرده بودید (نسخه‌های قدیمی)،
> آن‌ها هنوز در فایلسیستم موقت کانتینر هستند. به مسیر دائمی منتقل کنید:
> ```bash
> docker cp <container>:/app/public/products/. /tmp/old-uploads/
> # سپس در /app/public/uploads کپی کنید
> ```

## ۸) بعد از دیپلوی چک کنید

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://hassani-yadak.ir/
curl -s -o /dev/null -w "%{http_code}\n" https://hassani-yadak.ir/robots.txt
curl -s -o /dev/null -w "%{http_code}\n" https://hassani-yadak.ir/sitemap.xml
```

همه باید `200` باشند. سپس `https://hassani-yadak.ir/sitemap.xml` را در Google Search Console ثبت کنید.

## ۹) rollback (اگر سایت خراب شد)

```bash
cd /opt/stack/projects/hassani-yadak
docker tag hassani-yadak:previous hassani-yadak:latest
docker compose up -d
```

یا با GitHub: روی workflow قبلی **Re-run** بزنید.

## خلاصهٔ اینکه چه چیزی کجا اجرا می‌شود

| کار | کجا | چرا |
|---|---|---|
| `npm ci` | رانر GitHub (خارج) | سریع، بدون تحریم |
| `next build` | رانر GitHub (خارج) | سریع |
| `prisma migrate deploy` | سرور (داخل کانتینر) | به دیتابیس محلی دسترسی دارد |
| `prisma db seed` | سرور (یک‌بار دستی) | فقط بار اول |
| اجرای سایت | سرور ایران | به کاربران ایرانی نزدیک |
| تماس با AI | از طریق پروکسی خارجی | IP ایرانی مسدود است |

<!-- redeploy trigger: clean restart -->
<!-- rebuild latest: full search dropdown 2026-09-21T05:58:17.795Z -->
