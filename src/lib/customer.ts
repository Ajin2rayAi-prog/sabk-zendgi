import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

// ============================================================
//  احراز هویت مشتری (جدا از پنل ادمین).
//  کوکی امضاشده با HMAC؛ مقدار = `${customerId}.${hmac(customerId)}`.
//  رمزی ذخیره نمی‌شود؛ ورود فقط با موبایل + کد یک‌بارمصرف است.
// ============================================================

const COOKIE = "va_customer";

function secret() {
  return process.env.CUSTOMER_SECRET || "hassani-customer-dev-secret";
}

function sign(id: string) {
  return createHmac("sha256", secret()).update(id).digest("hex");
}

/** مقایسهٔ امن امضا (جلوگیری از timing attack) */
function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** ست‌کردن کوکی نشست مشتری */
export function signInCustomer(customerId: string) {
  const value = `${customerId}.${sign(customerId)}`;
  cookies().set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // ۳۰ روز
  });
}

export function signOutCustomer() {
  cookies().delete(COOKIE);
}

/** شناسهٔ مشتری معتبر از روی کوکی، یا null */
export function currentCustomerId(): string | null {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  const idx = raw.lastIndexOf(".");
  if (idx <= 0) return null;
  const id = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  return safeEqual(sig, sign(id)) ? id : null;
}

/** مشتری فعلی از دیتابیس، یا null */
export async function getCurrentCustomer() {
  const id = currentCustomerId();
  if (!id) return null;
  return prisma.customer.findUnique({ where: { id } });
}

/** برای اکشن‌های مخصوص مشتری؛ در صورت نبود نشست خطا می‌دهد */
export async function assertCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("unauthorized");
  return customer;
}

/** فقط نام مشتری واردشده (برای پیش‌نمایش در فرم‌ها) */
export async function getCustomerName(id: string): Promise<string | null> {
  const c = await prisma.customer.findUnique({ where: { id }, select: { name: true } });
  return c?.name ?? null;
}
