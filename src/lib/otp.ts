import "server-only";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { toFa } from "@/lib/utils";

// ============================================================
//  منطق کد یک‌بارمصرف (OTP) برای ورود مشتری.
//  فعلاً پیامکی ارسال نمی‌شود؛ در حالت توسعه کد روی صفحه نمایش
//  داده می‌شود. برای اتصال سامانهٔ پیامک واقعی، فقط sendSms را
//  پیاده‌سازی کنید.
// ============================================================

const OTP_TTL_MS = 2 * 60 * 1000; // ۲ دقیقه

/** تبدیل ارقام فارسی/عربی به لاتین و حذف کاراکترهای غیرعددی */
function toLatinDigits(s: string) {
  return s
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** نرمال‌سازی و اعتبارسنجی موبایل ایران؛ خروجی 09xxxxxxxxx یا null */
export function normalizeMobile(raw: string): string | null {
  let s = toLatinDigits(String(raw)).replace(/[^\d+]/g, "");
  if (s.startsWith("+98")) s = "0" + s.slice(3);
  else if (s.startsWith("0098")) s = "0" + s.slice(4);
  else if (s.startsWith("98") && s.length === 12) s = "0" + s.slice(2);
  if (/^9\d{9}$/.test(s)) s = "0" + s;
  return /^09\d{9}$/.test(s) ? s : null;
}

/** جای‌گاه اتصال سامانهٔ پیامک واقعی (فعلاً فقط لاگ در حالت توسعه) */
async function sendSms(mobile: string, text: string) {
  // TODO: اتصال سامانهٔ پیامک (مثلاً کاوه‌نگار/ملی‌پیامک) با متغیرهای SMS_*
  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP dev] → ${mobile}: ${text}`);
  }
}

/** ساخت و ارسال کد؛ خروجی خود کد است (فقط برای نمایش در حالت توسعه) */
export async function createOtp(mobile: string): Promise<string> {
  const code = String(randomInt(10000, 100000)); // ۵ رقمی، با RNG امن رمزنگاری
  await prisma.otpCode.create({
    data: { mobile, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  await sendSms(mobile, `کد ورود شما: ${toFa(code)}`);
  return code;
}

/**
 * بررسی کد. در صورت موفقیت کد مصرف‌شده علامت می‌خورد و مشتری
 * (بر اساس موبایل) upsert می‌شود. خروجی: مشتری یا null.
 */
export async function verifyOtp(mobile: string, code: string) {
  const clean = toLatinDigits(String(code)).replace(/\D/g, "");
  const row = await prisma.otpCode.findFirst({
    where: { mobile, code: clean, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;

  await prisma.otpCode.update({ where: { id: row.id }, data: { consumed: true } });
  const customer = await prisma.customer.upsert({
    where: { mobile },
    update: {},
    create: { mobile },
  });
  return customer;
}
