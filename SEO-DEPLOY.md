# راهنمای سئو — قبل از دیپلوی (Sabk Zendgi — سبک زندگی)

این فایل را من (Claude) موقع اضافه‌کردن سئوی پایه ساختم. قبل از انتشار سایت این چند قدم را انجام بده.

## ۱) آدرس واقعی سایت را ست کن
لینک‌های canonical و Open Graph و sitemap از این متغیر خوانده می‌شوند. اگر ست نشود، همه روی `localhost` می‌مانند و گوگل درست ایندکس نمی‌کند.

```bash
NEXT_PUBLIC_SITE_URL=https://hassani-yadak.ir
```

- روی **Vercel/سرور**: این را در بخش Environment Variables اضافه کن.
- برای تست محلی: در فایل `.env` بگذار.

## ۲) دیتابیس و بیلد
```bash
npx prisma generate   # کلاینت Prisma را می‌سازد (روی نسخه‌ی تازه لازم است)
npm run build         # اگر سبز شد، آماده‌ی دیپلوی است
```

> اگر `npm run build` خطای تایپ داد و خطاها مربوط به فایل‌های سئو نبود (مثل `PrismaClient` یا `PageProps`)، معمولاً با اجرای `npx prisma generate` و یک بیلد کامل حل می‌شود.

## ۳) بعد از دیپلوی چک کن
```bash
curl -s -o /dev/null -w "%{http_code}\n" https://hassani-yadak.ir/robots.txt
curl -s -o /dev/null -w "%{http_code}\n" https://hassani-yadak.ir/sitemap.xml
```
هر دو باید `200` بدهند. بعد آدرس `https://hassani-yadak.ir/sitemap.xml` را در **Google Search Console** ثبت کن.

## چه چیزهایی اضافه شد
- `src/app/robots.ts` — سیاست خزیدن (پنل‌ها و `/api` از ایندکس خارج‌اند)
- `src/app/sitemap.ts` — نقشه‌ی صفحات عمومی
- `src/lib/seo.ts` — ثابت‌های سئو (آدرس، نام، تصویر)
- `src/components/seo/StructuredData.tsx` — داده‌ی ساختاریافته JSON-LD
- متادیتا/OpenGraph/Twitter در `src/app/layout.tsx`

## تصویر اشتراک‌گذاری (اختیاری ولی توصیه‌شده)
یک عکس `1200×630` با نام `og.png` در پوشه‌ی `public/` بگذار تا موقع اشتراک لینک در شبکه‌های اجتماعی تصویر زیبا نشان داده شود.
