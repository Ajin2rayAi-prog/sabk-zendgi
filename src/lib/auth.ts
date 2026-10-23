import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { ensureOwnerUser } from "@/lib/ensure-owner";
import type { AdminRole, AdminUser } from "@prisma/client";

export const SESSION_COOKIE = "va_admin";
const TOKEN_SEPARATOR = ".";

/** کلید امضای کوکی سشن — در production الزامی است (fail-fast). */
function sessionSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (secret && secret.length > 0) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ADMIN_SECRET is not set. Refusing to sign admin sessions without a secret."
    );
  }
  return "hassani-dev-secret";
}

/* ----------------------------- هش رمز عبور ----------------------------- */

function slowHash(password: string, salt: Buffer): string {
  // N=2^16 را که برای امنیت کافی اما سبک برای ورود است استفاده می‌کنیم.
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

/** هش یک رمز عبور (نمونهٔ قابل ذخیره در دیتابیس). */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return slowHash(password, salt);
}

/** تطبیق رمز عبور با هش ذخیره‌شده (مقاوم در برابر timing attack). */
export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  try {
    const salt = Buffer.from(saltHex, "hex");
    const candidate = Buffer.from(slowHash(password, salt).split(":")[1], "hex");
    const known = Buffer.from(hashHex, "hex");
    return candidate.length === known.length && timingSafeEqual(candidate, known);
  } catch {
    return false;
  }
}

/* ------------------------------- سشن ------------------------------- */

/** امضای HMAC مقدار کوکی برای جلوگیری از جعل. */
function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

/** ساخت کوکی سشن: `userId.signature` — شناسه قابل‌خواندن + امضا. */
function buildSessionCookie(userId: string): string {
  return `${userId}${TOKEN_SEPARATOR}${sign(userId)}`;
}

/** اعتبارسنجی کوکی سشن و بازگرداندن شناسهٔ کاربر. */
function parseSessionCookie(raw: string | undefined): string | null {
  if (!raw) return null;
  const sepIndex = raw.lastIndexOf(TOKEN_SEPARATOR);
  if (sepIndex <= 0) return null;
  const userId = raw.slice(0, sepIndex);
  const signature = raw.slice(sepIndex + 1);
  if (!userId || !signature) return null;
  // امضای موردانتظار را دوباره محاسبه و با safe-compare مقایسه می‌کنیم
  const expected = sign(userId);
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  const ok = a.length === b.length && timingSafeEqual(a, b);
  return ok ? userId : null;
}

/** کاربر فعلی احراز‌شده ( یا null ). */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const userId = parseSessionCookie(cookies().get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user || !user.active) return null;
  return user;
}

export async function isAdmin(): Promise<boolean> {
  return !!(await getCurrentAdmin());
}

export async function getRole(): Promise<AdminRole | null> {
  return (await getCurrentAdmin())?.role ?? null;
}

export async function isOwner(): Promise<boolean> {
  return (await getRole()) === "OWNER";
}

/** تضمین ورود کاربر؛ در غیر این صورت به صفحهٔ ورود می‌رود. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

/** تضمین نقش مالک؛ در غیر این صورت به داشبورد می‌رود. */
export async function requireOwner(): Promise<AdminUser> {
  const user = await requireAdmin();
  if (user.role !== "OWNER") redirect("/admin");
  return user;
}

/* ----------------------------- ورود/خروج ----------------------------- */

/**
 * ورود با نام کاربری + رمز عبور. در صورت موفقیت کوکی سشن ست می‌شود.
 * @returns کاربر احراز‌شده یا null
 */
export async function signInWithPassword(username: string, password: string): Promise<AdminUser | null> {
  // تضمین وجود حساب مالک اولیه (از env) در دیتابیس خالی
  await ensureOwnerUser();
  const user = await prisma.adminUser.findUnique({
    where: { username: username.trim().toLowerCase() },
  });
  if (!user || !user.active) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  cookies().set(SESSION_COOKIE, buildSessionCookie(user.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // ۱۲ ساعت
  });
  return user;
}

export function signOut() {
  cookies().delete(SESSION_COOKIE);
}
