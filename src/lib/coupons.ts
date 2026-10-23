import "server-only";
import { prisma } from "@/lib/prisma";

// ============================================================
//  کد تخفیف / کوپن. اعتبارسنجی همیشه سمت سرور انجام می‌شود؛
//  مقدار تخفیف هرگز از کلاینت پذیرفته نمی‌شود.
// ============================================================

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export type CouponResult =
  | { ok: true; code: string; discount: number; message: string }
  | { ok: false; discount: 0; message: string };

/** اعتبارسنجی کد تخفیف برای یک مبلغ سبد مشخص و محاسبهٔ مقدار تخفیف. */
export async function validateCoupon(rawCode: string, cartTotal: number): Promise<CouponResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, discount: 0, message: "کد تخفیف را وارد کنید." };

  const c = await prisma.coupon.findUnique({ where: { code } });
  if (!c || !c.active) return { ok: false, discount: 0, message: "کد تخفیف نامعتبر است." };
  if (c.expiresAt && c.expiresAt.getTime() < Date.now())
    return { ok: false, discount: 0, message: "این کد تخفیف منقضی شده است." };
  if (c.maxUses != null && c.usedCount >= c.maxUses)
    return { ok: false, discount: 0, message: "ظرفیت استفاده از این کد پر شده است." };
  if (c.minTotal != null && cartTotal < c.minTotal)
    return {
      ok: false,
      discount: 0,
      message: `این کد برای خرید بالای ${c.minTotal.toLocaleString("fa-IR")} قابل استفاده است.`,
    };

  let discount =
    c.type === "PERCENT" ? Math.floor((cartTotal * Math.min(100, c.value)) / 100) : c.value;
  discount = Math.min(discount, cartTotal); // تخفیف بیشتر از مبلغ سبد نشود

  return { ok: true, code, discount, message: "کد تخفیف اعمال شد." };
}

/** پس از ثبت موفق سفارش، شمارندهٔ استفاده را زیاد می‌کند. */
export async function consumeCoupon(code: string): Promise<void> {
  await prisma.coupon.updateMany({
    where: { code: normalizeCode(code) },
    data: { usedCount: { increment: 1 } },
  });
}

/* ---------- مدیریت ---------- */
export async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
}
