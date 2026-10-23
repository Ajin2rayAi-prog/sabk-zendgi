"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Ticket, Loader2, Check, X } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { placeOrderAction } from "@/app/(site)/checkout/actions";
import { formatPrice, toFa } from "@/lib/utils";

/** فرم ثبت سفارش؛ اقلام سبد در فیلد مخفی JSON برای اکشن سرور سریالایز می‌شوند */
export function CheckoutForm({ defaultName, mobile }: { defaultName: string; mobile: string }) {
  const { items, total, count, ready } = useCart();
  const [submitting, setSubmitting] = useState(false);

  // کد تخفیف
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);

  // اگر سبد خالی است به صفحهٔ سبد برگرد
  useEffect(() => {
    if (ready && items.length === 0) window.location.href = "/cart";
  }, [ready, items.length]);

  // اگر مبلغ سبد تغییر کرد، تخفیف اعمال‌شده باطل شود تا دوباره اعتبارسنجی گردد
  useEffect(() => {
    setApplied(null);
    setCouponMsg(null);
  }, [total]);

  if (!ready) return <div className="py-20 text-center text-muted">در حال بارگذاری…</div>;
  if (items.length === 0) return null;

  const itemsJson = JSON.stringify(items.map((i) => ({ slug: i.slug, qty: i.qty })));
  const discount = applied?.discount ?? 0;
  const payable = Math.max(0, total - discount);

  async function applyCoupon() {
    if (!code.trim() || checking) return;
    setChecking(true);
    setCouponMsg(null);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, total }),
      });
      const data = await res.json();
      if (data.ok) {
        setApplied({ code: data.code, discount: data.discount });
        setCouponMsg({ ok: true, text: data.message });
      } else {
        setApplied(null);
        setCouponMsg({ ok: false, text: data.message });
      }
    } catch {
      setCouponMsg({ ok: false, text: "بررسی کد ممکن نشد." });
    } finally {
      setChecking(false);
    }
  }

  return (
    <form
      action={placeOrderAction}
      onSubmit={() => setSubmitting(true)}
      className="grid gap-6 lg:grid-cols-[1fr_320px]"
    >
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="coupon" value={applied?.code ?? ""} />

      <div className="card p-6">
        <h2 className="mb-4 text-sm font-black">اطلاعات گیرنده</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">نام و نام خانوادگی</label>
            <input
              name="name"
              defaultValue={defaultName}
              required
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="نام کامل"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">شمارهٔ موبایل</label>
            <input
              value={toFa(mobile)}
              readOnly
              dir="ltr"
              className="w-full rounded-xl border bg-primary-soft/40 px-4 py-2.5 text-right text-sm text-muted outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">نشانی</label>
            <textarea
              name="address"
              rows={3}
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="نشانی کامل برای ارسال"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">توضیحات (اختیاری)</label>
            <textarea
              name="note"
              rows={2}
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="یادداشت برای کارشناس فروش"
            />
          </div>
        </div>
      </div>

      <div className="card h-fit p-5">
        <h2 className="mb-4 text-sm font-black">خلاصهٔ سفارش ({toFa(count)} قلم)</h2>
        <ul className="mb-3 space-y-2 border-b pb-3 text-xs">
          {items.map((it) => (
            <li key={it.sku} className="flex items-center justify-between gap-2">
              <span className="line-clamp-1 text-muted">
                {it.title} × {toFa(it.qty)}
              </span>
              <span className="shrink-0 tabular-nums">{formatPrice(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">جمع کل</span>
          <span className="tabular-nums">{formatPrice(total)}</span>
        </div>

        {/* کد تخفیف */}
        <div className="mt-4 border-t pt-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Ticket className="h-4 w-4" /> کد تخفیف
          </label>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              dir="ltr"
              placeholder="مثلاً OFF20"
              className="min-w-0 flex-1 rounded-xl border bg-elev px-3 py-2 text-left text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={checking || !code.trim()}
              className="shrink-0 rounded-xl border px-3 py-2 text-sm font-semibold hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "اعمال"}
            </button>
          </div>
          {couponMsg && (
            <p
              className={`mt-1.5 flex items-center gap-1 text-xs ${
                couponMsg.ok ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
              }`}
            >
              {couponMsg.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
              {couponMsg.text}
            </p>
          )}
        </div>

        {discount > 0 && (
          <div className="mt-3 flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
            <span>تخفیف</span>
            <span className="tabular-nums">− {formatPrice(discount)}</span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted">قابل پرداخت</span>
          <span className="font-black text-primary">{formatPrice(payable)}</span>
        </div>
        <p className="mt-3 text-xs text-muted">
          سفارش شما پس از ثبت، توسط کارشناسان بررسی و برای هماهنگی پرداخت و ارسال با شما تماس گرفته می‌شود.
        </p>
        <button disabled={submitting} className="btn-primary mt-5 w-full justify-center disabled:opacity-60">
          <ShoppingBag className="h-5 w-5" /> {submitting ? "در حال ثبت…" : "ثبت سفارش"}
        </button>
        <Link href="/cart" className="btn-ghost mt-2 w-full justify-center">
          بازگشت به سبد
        </Link>
      </div>
    </form>
  );
}
