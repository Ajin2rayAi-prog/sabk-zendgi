import "server-only";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

/**
 * ساخت خودکار حساب مالک (OWNER) در اولین اجرا.
 * username/رمز از env خوانده می‌شود:
 *   ADMIN_USERNAME (پیش‌فرض: owner)
 *   ADMIN_PASSWORD (الزامی)
 * اگر از قبل ادمینی وجود داشته باشد، کاری نمی‌کند.
 * این تابع idempotent است و در هر بوت امن است.
 */
export async function ensureOwnerUser(): Promise<void> {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length === 0) {
    // بدون رمز، حساب پیش‌فرض ساخته نمی‌شود. در production fail-fast
    // از طریق requireAdmin/signInWithPassword به‌جا می‌آید.
    return;
  }
  const username = (process.env.ADMIN_USERNAME || "owner").trim().toLowerCase();

  const existing = await prisma.adminUser.findFirst({
    where: { OR: [{ username }, { role: "OWNER" }] },
  });
  if (existing) return;

  await prisma.adminUser.create({
    data: {
      username,
      name: "مالک سایت",
      passwordHash: hashPassword(password),
      role: "OWNER",
      active: true,
    },
  });
}
