#!/usr/bin/env bash
# ============================================================
# بیلد پیش‌نمایش استاتیک GitHub Pages (شاخهٔ gh-pages)
# نکته: این اسکریپت فایل‌های سورس را «موقتاً» پچ می‌کند (حذف
# Server Actions و API routes که در export پشتیبانی نمی‌شوند)،
# بیلد می‌گیرد و سپس «همه‌چیز را دقیقاً برمی‌گرداند».
# شاخهٔ main همیشه نسخهٔ کامل (Docker/standalone) می‌ماند.
# اجرا از ریشهٔ ریپو:  bash scripts/build-pages-preview.sh
# خروجی: پوشهٔ out/  — سپس به gh-pages پوش شود.
# ============================================================
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BK="/tmp/hassani-pages-bk-$$"
mkdir -p "$BK"

restore() {
  echo "→ بازگردانی فایل‌ها…"
  cp "$BK/next.config.mjs" next.config.mjs
  mv "$BK/api" src/app/api
  mv "$BK/admin" src/app/admin
  mv "$BK/blog" "src/app/(site)/blog"
  mv "$BK/account" "src/app/(site)/account"
  while IFS= read -r line; do
    src="$BK/files/$(echo "$line" | cut -d'|' -f1)"
    dst="$(echo "$line" | cut -d'|' -f2)"
    cp "$src" "$dst"
  done < "$BK/filelist.txt"
  # راستی‌آزمایی بازگشت
  diff -q "$BK/next.config.mjs" next.config.mjs >/dev/null && echo "  config OK"
  n=$(grep -rl 'export const dynamic = "force-dynamic"' "src/app/(site)" --include="*.tsx" | wc -l)
  echo "  force-dynamic files: $n (باید ۸ باشد)"
  grep -q '"use server"' "src/app/(site)/checkout/actions.ts" && echo "  server actions OK"
}
trap restore EXIT

# ---------- ۱) بکاپ ----------
cp next.config.mjs "$BK/next.config.mjs"
mv src/app/api "$BK/api"
mv src/app/admin "$BK/admin"
mv "src/app/(site)/blog" "$BK/blog"
mv "src/app/(site)/account" "$BK/account"
mkdir -p "$BK/files"
: > "$BK/filelist.txt"
bakfile() { # $1 = relative path
  safe="$(echo "$1" | tr '/' '_')"
  cp "$1" "$BK/files/$safe"
  echo "$safe|$1" >> "$BK/filelist.txt"
}
bakfile "src/app/(site)/checkout/actions.ts"
bakfile "src/app/(site)/login/actions.ts"
bakfile "src/app/(site)/partners/actions.ts"
bakfile "src/app/(site)/product/[slug]/actions.ts"
bakfile "src/app/(site)/products/page.tsx"
bakfile "src/app/(site)/search/page.tsx"
bakfile "src/app/(site)/compare/page.tsx"
bakfile "src/app/(site)/login/page.tsx"
bakfile "src/app/(site)/checkout/success/page.tsx"
bakfile "src/app/(site)/partners/page.tsx"
bakfile "src/app/(site)/checkout/page.tsx"

# ---------- ۲) کانفیگ export ----------
cat > next.config.mjs <<'EOF'
/** @type {import('next').NextConfig} */
// نسخهٔ GitHub Pages — فقط برای بیلد استاتیک شاخهٔ gh-pages.
const nextConfig = {
  output: "export",
  basePath: "/sabk-zendgi",
  reactStrictMode: true,
  images: { unoptimized: true },
};
export default nextConfig;
EOF

# ---------- ۳) استاب اکشن‌های سرور ----------
cat > "src/app/(site)/checkout/actions.ts" <<'EOF'
// استاب پیش‌نمایش GitHub Pages — ثبت سفارش واقعی نیاز به سرور دارد
export async function placeOrderAction(): Promise<never> {
  throw new Error("ثبت سفارش در پیش‌نمایش غیرفعال است");
}
EOF
cat > "src/app/(site)/login/actions.ts" <<'EOF'
// استاب پیش‌نمایش GitHub Pages — ورود نیاز به سرور دارد
export async function requestOtpAction(): Promise<never> {
  throw new Error("ورود در پیش‌نمایش غیرفعال است");
}
export async function verifyOtpAction(): Promise<never> {
  throw new Error("ورود در پیش‌نمایش غیرفعال است");
}
export async function logoutCustomerAction(): Promise<never> {
  throw new Error("در پیش‌نمایش غیرفعال است");
}
EOF
cat > "src/app/(site)/partners/actions.ts" <<'EOF'
// استاب پیش‌نمایش GitHub Pages — فرم نیاز به سرور دارد
export async function submitJobForm(): Promise<never> {
  throw new Error("ارسال فرم در پیش‌نمایش غیرفعال است");
}
EOF
cat > "src/app/(site)/product/[slug]/actions.ts" <<'EOF'
// استاب پیش‌نمایش GitHub Pages — ثبت نظر نیاز به سرور دارد
export async function getCustomerNameAction(): Promise<string> {
  return "";
}
export async function submitReviewAction(
  _prev: { ok: boolean; message: string } | null,
  _formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: "ثبت نظر در پیش‌نمایش غیرفعال است." };
}
EOF

# ---------- ۴) پچ صفحه‌ها ----------
python3 - <<'PYEOF'
import os
P = "src/app/(site)"
def patch(rel, old, new):
    p = os.path.join(P, rel)
    s = open(p, encoding="utf-8").read()
    assert old in s, f"pattern missing in {rel}"
    open(p, "w", encoding="utf-8").write(s.replace(old, new, 1))

# حذف force-dynamic
import subprocess
files = subprocess.check_output(
    ["grep", "-rl", 'export const dynamic = "force-dynamic"', P, "--include=*.tsx"],
    text=True).split()
for f in files:
    s = open(f, encoding="utf-8").read()
    s = s.replace('export const dynamic = "force-dynamic";\n', '')
    # حذف کامنت دنباله‌دار همان خط (اگر بود)
    lines = [l for l in s.split("\n") if 'force-dynamic' not in l]
    open(f, "w", encoding="utf-8").write("\n".join(lines))
print(f"stripped force-dynamic from {len(files)} files")

patch("products/page.tsx",
    "export default async function ProductsPage({ searchParams }: { searchParams: SP }) {",
    "export default async function ProductsPage() {\n  const searchParams: SP = {};")
patch("search/page.tsx",
    "export default async function SearchPage({\n  searchParams,\n}: {\n  searchParams: { q?: string };\n}) {",
    "export default async function SearchPage() {\n  const searchParams: { q?: string } = {};")
patch("compare/page.tsx",
    "export default async function ComparePage({\n  searchParams,\n}: {\n  searchParams: { ids?: string };\n}) {",
    "export default async function ComparePage() {\n  const searchParams: { ids?: string } = {};")
patch("checkout/success/page.tsx",
    "export default function CheckoutSuccessPage({ searchParams }: { searchParams: { code?: string } }) {",
    "export default function CheckoutSuccessPage() {\n  const searchParams: { code?: string } = {};")
patch("partners/page.tsx",
    "export default async function PartnersPage({ searchParams }: { searchParams: { sent?: string } }) {",
    "export default async function PartnersPage() {\n  const searchParams: { sent?: string } = {};")
patch("checkout/page.tsx",
    """export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/checkout");

  return (
    <div className="container-lux py-8">
      <h1 className="mb-6 text-2xl font-black">ثبت سفارش</h1>
      <CheckoutForm defaultName={customer.name ?? ""} mobile={customer.mobile} />""",
    """export default async function CheckoutPage() {
  // نسخه پیش‌نمایش استاتیک: بدون احراز هویت
  return (
    <div className="container-lux py-8">
      <h1 className="mb-6 text-2xl font-black">ثبت سفارش</h1>
      <CheckoutForm defaultName="" mobile="" />""")
print("pages patched")
PYEOF

# صفحهٔ ورود: پوستهٔ استاتیک ساده (فرم پیامکی به سرور نیاز دارد)
cat > "src/app/(site)/login/page.tsx" <<'EOF'
export const metadata = { title: "ورود / ثبت‌نام" };
// نسخه پیش‌نمایش استاتیک GitHub Pages — ورود واقعی نیاز به سرور دارد
export default function LoginPage() {
  return (
    <div className="container-lux grid min-h-[70vh] place-items-center py-10">
      <div className="card w-full max-w-sm p-8 text-center">
        <h1 className="text-xl font-black">ورود / ثبت‌نام</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          ورود با پیامک در پیش‌نمایش غیرفعال است.
          <br />
          در نسخهٔ نهایی سایت با شمارهٔ موبایل وارد می‌شوید.
        </p>
      </div>
    </div>
  );
}
EOF

# صفحهٔ همکاری: پوستهٔ استاتیک (فرم به سرور نیاز دارد)
cat > "src/app/(site)/partners/page.tsx" <<'EOF'
import { Handshake } from "lucide-react";
import { siteConfig } from "@/config/site";
export const metadata = { title: "همکاری با ما" };
// نسخه پیش‌نمایش استاتیک GitHub Pages — فرم همکاری در سایت نهایی فعال است
export default function PartnersPage() {
  return (
    <div className="container-lux py-12">
      <section className="card overflow-hidden bg-brand-soft p-8 text-center md:p-14">
        <Handshake className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-black sm:text-4xl">همکاری با ما</h1>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-muted">
          {siteConfig.brand.name} همواره در تلاش است تا با ایجاد روابط پایدار و سودآور،
          شبکهٔ فروش خود را گسترش دهد.
        </p>
        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-muted">
          فرم ثبت درخواست همکاری در پیش‌نمایش غیرفعال است و در نسخهٔ نهایی سایت فعال می‌شود.
        </p>
      </section>
    </div>
  );
}
EOF

# ---------- ۵) بیلد ----------
rm -rf .next
export NEXT_PUBLIC_SITE_URL=https://ajin2rayai-prog.github.io/sabk-zendgi
export NEXT_PUBLIC_BASE_PATH=/sabk-zendgi
npm run build

echo "✓ بیلد موفق — خروجی در out/"
