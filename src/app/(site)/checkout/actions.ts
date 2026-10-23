"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { assertCustomer } from "@/lib/customer";
import { getProductBySlug } from "@/lib/shop";
import { validateCoupon, consumeCoupon } from "@/lib/coupons";

type IncomingItem = { slug: string; qty: number };

/** تولید شمارهٔ سفارش قابل‌نمایش */
function makeOrderCode() {
  return "AMT-" + Date.now().toString(36).toUpperCase();
}

/**
 * ثبت سفارش. اقلام سبد از سمت کلاینت می‌آیند ولی قیمت/عنوان
 * دوباره از دیتابیس خوانده می‌شود (ضدِ دستکاری) و جمع سمت سرور
 * محاسبه می‌گردد. پرداخت آنلاین در این فاز وجود ندارد.
 */
export async function placeOrderAction(formData: FormData) {
  const customer = await assertCustomer();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  let incoming: IncomingItem[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("items") ?? "[]"));
    if (Array.isArray(parsed)) incoming = parsed;
  } catch {}

  // اعتبارسنجی و اسنپ‌شات هر قلم از روی دیتابیس
  const items: {
    productSku: string; slug: string; title: string; price: number | null; image: string | null; qty: number;
  }[] = [];
  let total = 0;

  for (const it of incoming) {
    const qty = Math.max(1, Math.floor(Number(it.qty) || 0));
    const product = await getProductBySlug(String(it.slug));
    if (!product || product.price == null) continue; // اقلام استعلامی/ناموجود رد می‌شوند
    items.push({
      productSku: product.sku,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.image ?? null,
      qty,
    });
    total += product.price * qty;
  }

  if (items.length === 0) redirect("/cart");

  // اعتبارسنجی مجدد کد تخفیف سمت سرور (مقدار تخفیف هرگز از کلاینت گرفته نمی‌شود)
  let couponCode: string | null = null;
  let discount = 0;
  const rawCoupon = String(formData.get("coupon") ?? "").trim();
  if (rawCoupon) {
    const res = await validateCoupon(rawCoupon, total);
    if (res.ok) {
      couponCode = res.code;
      discount = res.discount;
    }
  }
  const payable = Math.max(0, total - discount);

  // به‌روزرسانی نام مشتری در صورت ورود مقدار جدید
  if (name && name !== customer.name) {
    await prisma.customer.update({ where: { id: customer.id }, data: { name } });
  }

  const order = await prisma.order.create({
    data: {
      code: makeOrderCode(),
      customerId: customer.id,
      customerName: name || customer.name || "",
      customerMobile: customer.mobile,
      address: address || null,
      note: note || null,
      couponCode,
      discount,
      total: payable,
      items: { create: items },
    },
  });

  if (couponCode) await consumeCoupon(couponCode);

  revalidatePath("/admin/orders");
  revalidatePath("/account");
  redirect(`/checkout/success?code=${order.code}`);
}
