"use server";

import { revalidatePath } from "next/cache";
import { createReview } from "@/lib/reviews";
import { getProductBySlug } from "@/lib/shop";
import { currentCustomerId, getCustomerName } from "@/lib/customer";

/** نام کاربر واردشده (برای پیش‌نمایش در فرم نظر) — بدون دیینامیک کردن صفحه. */
export async function getCustomerNameAction(): Promise<string> {
  const id = currentCustomerId();
  if (!id) return "";
  return (await getCustomerName(id)) ?? "";
}

/** ثبت نظر از فرم صفحهٔ محصول. خروجی برای نمایش پیام به کاربر. */
export async function submitReviewAction(
  _prev: { ok: boolean; message: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const slug = String(formData.get("slug") ?? "").trim();
  const product = await getProductBySlug(slug);
  if (!product) return { ok: false, message: "محصول یافت نشد." };

  const rating = parseInt(String(formData.get("rating") ?? "0"), 10);
  const authorName = String(formData.get("authorName") ?? "");
  const comment = String(formData.get("comment") ?? "");

  if (!rating || rating < 1 || rating > 5) return { ok: false, message: "لطفاً امتیاز (۱ تا ۵ ستاره) را انتخاب کنید." };
  if (!comment.trim()) return { ok: false, message: "لطفاً متن نظر را بنویسید." };

  try {
    await createReview({
      productSlug: slug,
      authorName,
      rating,
      comment,
      customerId: currentCustomerId(),
    });
    revalidatePath(`/product/${slug}`);
    return { ok: true, message: "نظر شما ثبت شد و پس از تأیید مدیر نمایش داده می‌شود. سپاسگزاریم! 🌷" };
  } catch {
    return { ok: false, message: "ثبت نظر ممکن نشد. لطفاً دوباره تلاش کنید." };
  }
}
