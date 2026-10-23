"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";
import type { Product } from "@/data/catalog";
import { useCart } from "@/components/cart-provider";
import { toFa } from "@/lib/utils";

/** دکمهٔ افزودن به سبد + انتخاب تعداد برای صفحهٔ محصول */
export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    add(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-1 items-stretch gap-3">
      <div className="flex items-center rounded-xl border">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="grid h-full w-10 place-items-center text-muted hover:text-primary"
          aria-label="کاهش تعداد"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-10 text-center text-sm font-bold tabular-nums">{toFa(qty)}</span>
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          className="grid h-full w-10 place-items-center text-muted hover:text-primary"
          aria-label="افزایش تعداد"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <button onClick={handleAdd} className="btn-primary flex-1">
        {added ? (
          <>
            <Check className="h-5 w-5" /> افزوده شد
          </>
        ) : (
          <>
            <ShoppingCart className="h-5 w-5" /> افزودن به سبد
          </>
        )}
      </button>

      <Link href="/cart" className="btn-ghost">
        سبد خرید
      </Link>
    </div>
  );
}
