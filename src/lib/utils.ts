import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { siteConfig } from "@/config/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** اعداد فارسی */
export function toFa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
}

/** قیمت با واحد پول تنظیم‌شده؛ null → «استعلام» */
export function formatPrice(value: number | null): string {
  if (value == null) return siteConfig.features.inquiryLabel;
  return toFa(new Intl.NumberFormat("en-US").format(value)) + " " + siteConfig.currency.unit;
}

/** درصد تخفیف بین قیمت قبل و فعلی */
export function discountPercent(before: number, now: number): number {
  if (!before || before <= now) return 0;
  return Math.round(((before - now) / before) * 100);
}

/** تولید رنگ پایدار از یک رشته (برای تصویر تولیدشدهٔ محصول) */
export function hashHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}
