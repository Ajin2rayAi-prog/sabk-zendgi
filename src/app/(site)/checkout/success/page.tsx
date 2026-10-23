"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/components/cart-provider";
import { toFa } from "@/lib/utils";

export default function CheckoutSuccessPage({ searchParams }: { searchParams: { code?: string } }) {
  const { clear } = useCart();
  const code = searchParams?.code ?? "";

  // خالی‌کردن سبد پس از ثبت موفق سفارش
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="container-lux py-20">
      <div className="card mx-auto max-w-md p-10 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-500">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-xl font-black">سفارش شما ثبت شد</h1>
        <p className="mt-2 text-sm text-muted">
          کارشناسان ما به‌زودی برای هماهنگی پرداخت و ارسال با شما تماس می‌گیرند.
        </p>
        {code && (
          <div className="mt-4 rounded-xl bg-primary-soft/50 py-3 text-sm">
            شمارهٔ سفارش: <span dir="ltr" className="font-black text-primary">{code}</span>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/account" className="btn-primary w-full justify-center">
            سفارش‌های من
          </Link>
          <Link href="/products" className="btn-ghost w-full justify-center">
            ادامهٔ خرید
          </Link>
        </div>
      </div>
    </div>
  );
}
