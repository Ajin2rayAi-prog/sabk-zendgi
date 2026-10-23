import "server-only";

/**
 * حالت بدون دیتابیس — وقتی DATABASE_URL ست نشده باشد (مثل بیلد/دموی محلی
 * بدون postgres)، خواندن‌های فروشگاه به دادهٔ ثابت کاتالوگ برمی‌گردند تا
 * سایت بالا بیاید و بیلد موفق شود.
 *
 * در پروداکشن (DATABASE_URL واقعی) رفتار دقیقاً مثل قبل است و خطای واقعی
 * دیتابیس بالا می‌آید (پنهان نمی‌شود).
 */
export const NO_DB = !process.env.DATABASE_URL;

/** اجرای کوئری خواندنی با برگشت به مقدار پیش‌فرض در حالت بدون دیتابیس. */
export async function dbRead<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (NO_DB) return fallback;
  return fn();
}
