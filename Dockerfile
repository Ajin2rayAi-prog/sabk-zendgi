# Dockerfile — آرون مانا تجهیز (Next.js 14 standalone)
# فاز build روی GitHub Actions (رانر خارجی سریع) با یک postgres موقت انجام می‌شود
# و این ایمیج فقط خروجیِ آماده را اجرا می‌کند — یعنی سرور ایران هیچ‌وقت
# npm install / next build / prisma generate را اجرا نمی‌کند (مشکل کندی حل می‌شود).
#
# نحوهٔ استفاده (در CI):
#   1. npm ci
#   2. npx prisma generate
#   3. npm run build        (با DATABASE_URL به postgres موقت — برای prerender صفحات)
#   4. docker build ...     (این فایل فقط runtime می‌سازد)

# باینری sharp مخصوص alpine — tracing خروجی standalone جا می‌اندازد و
# image optimizer با «Could not load sharp» می‌میرد. این استیج روی
# GitHub Actions (اینترنت سریع) باینری درست را می‌سازد و فقط پوشهٔ
# لازم به ایمیج نهایی کپی می‌شود (سرور ایران هیچ npm اجرا نمی‌کند).
FROM node:22-alpine AS sharpfix
WORKDIR /tmp/sharpfix
RUN npm init -y >/dev/null 2>&1 && npm install --no-audit --no-fund sharp@0.34.5

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

# خروجی standalone سبک: فقط فایل‌های لازم برای اجرا
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public

# کلاینت + schema پرایسما برای اجرای migration موقع دیپلوی
COPY prisma ./prisma
# اسکریپت migrate هم داخل ایمیج تا سرور همیشه نسخهٔ تازه را از ایمیج بگیرد
COPY scripts/migrate.sh ./scripts/migrate.sh
# فایل seed و کاتالوگ برای seed دستی روی سرور (هم‌خوان با کد دیپلوی‌شده).
# seed داخل کانتینر کمکی اجرا می‌شود؛ tsx بدون tsconfig هم کار می‌کند.
COPY src/data/catalog.ts ./src/data/catalog.ts
# نکته: کلاینت پرایسما و engines در build روی رانر generate می‌شوند
# و در بالا کپی شده‌اند. migration از طریق یک کانتینر کمکی روی سرور
# اجرا می‌شود (scripts/migrate-server.sh) — این روش از شکار تک‌تک
# وابستگی‌های @prisma/config (effect, fast-check, ...) بی‌نیاز است.

# پوشهٔ آپلود (در تولید روی volume سوار می‌شود تا عکس‌ها دوام بیاورند)
RUN mkdir -p /app/public/uploads
# باینری sharp از استیج بالا (کنار خروجی traced نکست می‌نشیند)
COPY --from=sharpfix /tmp/sharpfix/node_modules/@img /app/node_modules/@img
COPY --from=sharpfix /tmp/sharpfix/node_modules/sharp /app/node_modules/sharp

EXPOSE 3000
# healthcheck: Next به / جواب ۲۰۰ می‌دهد
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1
CMD ["node", "server.js"]
