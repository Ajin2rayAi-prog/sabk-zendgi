"use client";

import Link from "next/link";
import { ShoppingCart, Trash2, Minus, Plus, ArrowLeft } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { ProductThumb } from "@/components/product-thumb";
import { formatPrice, toFa } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export default function CartPage() {
  const { items, total, count, setQty, remove, ready } = useCart();

  if (!ready) {
    return <div className="container-lux py-20 text-center text-muted">در حال بارگذاری…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-lux py-20">
        <div className="card mx-auto max-w-md p-10 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-black">سبد خرید شما خالی است</h1>
          <p className="mt-2 text-sm text-muted">محصولات موردنظرتان را به سبد اضافه کنید.</p>
          <Link href="/products" className="btn-primary mt-6 inline-flex">
            مشاهدهٔ محصولات <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-lux py-8">
      <h1 className="mb-6 text-2xl font-black">سبد خرید ({toFa(count)} قلم)</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* اقلام */}
        <div className="card divide-y overflow-hidden">
          {items.map((it) => (
            <div key={it.sku} className="flex items-center gap-4 p-4">
              <Link href={`/product/${it.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border">
                <ProductThumb categorySlug="" image={it.image} alt={it.title} />
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={`/product/${it.slug}`} className="line-clamp-2 text-sm font-bold hover:text-primary">
                  {it.title}
                </Link>
                <div className="mt-1 text-xs text-muted">{it.sku}</div>
                <div className="mt-1 text-sm font-black text-primary">{formatPrice(it.price)}</div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center rounded-xl border">
                  <button
                    onClick={() => setQty(it.sku, it.qty - 1)}
                    className="grid h-8 w-8 place-items-center text-muted hover:text-primary"
                    aria-label="کاهش"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-9 text-center text-sm font-bold tabular-nums">{toFa(it.qty)}</span>
                  <button
                    onClick={() => setQty(it.sku, it.qty + 1)}
                    className="grid h-8 w-8 place-items-center text-muted hover:text-primary"
                    aria-label="افزایش"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => remove(it.sku)}
                  className="flex items-center gap-1 text-xs text-rose-500 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* خلاصه */}
        <div className="card h-fit p-5">
          <h2 className="mb-4 text-sm font-black">خلاصهٔ سفارش</h2>
          <div className="flex items-center justify-between border-b pb-3 text-sm">
            <span className="text-muted">جمع کل</span>
            <span className="font-black text-primary">{formatPrice(total)}</span>
          </div>
          <p className="mt-3 text-xs text-muted">
            هزینهٔ ارسال و تخفیف احتمالی هنگام تأیید سفارش توسط کارشناسان اعمال می‌شود.
          </p>
          <Link href="/checkout" className="btn-primary mt-5 w-full justify-center">
            ادامهٔ فرآیند سفارش <ArrowLeft className="h-4 w-4" />
          </Link>
          <a href={`tel:${siteConfig.contact.phone}`} className="btn-ghost mt-2 w-full justify-center">
            سفارش تلفنی
          </a>
        </div>
      </div>
    </div>
  );
}
