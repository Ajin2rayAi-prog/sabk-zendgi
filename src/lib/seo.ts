import { siteConfig } from "@/config/site";

/** آدرس پایهٔ سایت (بدون اسلش انتهایی) */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4320"
).replace(/\/$/, "");

/** نام برند برای عنوان‌ها و متادیتا */
export const SITE_NAME = siteConfig.brand.name;

/** توضیح کوتاه پیش‌فرض سایت */
export const SITE_DESCRIPTION = siteConfig.hero.subtitle;

/** تصویر Open Graph پیش‌فرض (۱۲۰۰×۶۳۰) */
export const OG_IMAGE = "/og.png";

/** ساخت آدرس مطلق از یک مسیر نسبی */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
