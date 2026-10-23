import "server-only";

/**
 * این ماژول صرفاً برای سازگاری با کدهای قدیمی است که از
 * توابع wrapper استفاده می‌کنند. منطق اصلی در `@/lib/auth` است.
 *
 * نکتهٔ امنیتی مهم: ورود دیگر با رمز ثابت env انجام نمی‌شود.
 * حساب‌ها در دیتابیس (مدل AdminUser) با نقش OWNER/MANAGER ذخیره
 * می‌شوند و سشن بر اساس کوکی امضاشده است.
 */
export {
  isAdmin,
  isOwner,
  getRole,
  getCurrentAdmin,
  requireAdmin,
  requireOwner,
  signInWithPassword as signIn,
  signOut,
  hashPassword,
  verifyPassword,
  SESSION_COOKIE,
} from "@/lib/auth";
