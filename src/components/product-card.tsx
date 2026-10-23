"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Plus, Check, GitCompare } from "lucide-react";
import { type Product } from "@/data/catalog";
import { ProductThumb } from "@/components/product-thumb";
import { useCart } from "@/components/cart-provider";
import { useCompare } from "@/components/compare-provider";
import { siteConfig } from "@/config/site";
import { formatPrice, discountPercent, toFa } from "@/lib/utils";

export function ProductCard({ product, index = 0, priceHidden = false }: { product: Product; index?: number; priceHidden?: boolean }) {
  const off = product.priceBefore && product.price ? discountPercent(product.priceBefore, product.price) : 0;
  // priceHidden=true یعنی قیمت‌ها موقتاً مخفی‌اند (نوسانات ارز) → استعلام
  const isInquiry = product.price == null || priceHidden;
  const { add } = useCart();
  const { has, toggle, ready: cmpReady } = useCompare();
  const [added, setAdded] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const inCompare = cmpReady && has(product.slug);

  function handleAdd() {
    add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3) }}
      className="card glass-frame group flex flex-col overflow-hidden hover:-translate-y-1 hover:border-primary/40 hover:shadow-lux"
    >
      <Link href={`/product/${product.slug}`} className="relative block">
        <div className="glass-frame-img relative aspect-[4/3] overflow-hidden">
          <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
            <ProductThumb categorySlug={product.categorySlug} image={product.image} alt={product.title} seed={index} />
          </div>
          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            {product.featured && (
              <span className="rounded-full bg-brand-grad px-2.5 py-1 text-[11px] font-bold text-primary-fg">
                منتخب
              </span>
            )}
            {off > 0 && (
              <span className="rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white">
                {toFa(off)}٪-
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(product.slug);
            }}
            aria-label={inCompare ? "حذف از مقایسه" : "افزودن به مقایسه"}
            title={inCompare ? "حذف از مقایسه" : "افزودن به مقایسه"}
            className={`absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full border backdrop-blur transition-colors ${
              inCompare
                ? "border-primary bg-primary text-primary-fg"
                : "border-white/60 bg-white/70 text-fg hover:border-primary hover:text-primary dark:bg-black/40"
            }`}
          >
            <GitCompare className="h-4 w-4" />
          </button>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted">
          <span className="rounded-md bg-primary-soft px-1.5 py-0.5 font-medium text-primary-deep dark:text-primary">
            {product.brand}
          </span>
          <span className="opacity-60">{product.sku}</span>
        </div>

        <Link href={`/product/${product.slug}`} className="flex-1">
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-relaxed transition-colors group-hover:text-primary">
            {product.title}
          </h3>
        </Link>

        <div className="mt-3 flex items-end justify-between border-t pt-3">
          <div>
            {!priceHidden && product.priceBefore && (
              <span className="block text-xs text-muted line-through">
                {formatPrice(product.priceBefore)}
              </span>
            )}
            {!isInquiry && (
              <span className="text-sm font-black text-primary">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          {isInquiry ? (
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => setShowPhone((v) => !v)}
                aria-label="استعلام قیمت"
                className="flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary"
              >
                <Phone className="h-4 w-4" /> استعلام قیمت
              </button>
              {showPhone && (
                <a
                  href={`tel:${siteConfig.contact.phone}`}
                  dir="ltr"
                  className="text-xs font-bold text-primary"
                >
                  {siteConfig.contact.phone}
                </a>
              )}
            </div>
          ) : (
            <button
              onClick={handleAdd}
              aria-label="افزودن به سبد"
              className={`grid h-10 w-10 place-items-center rounded-xl text-primary-fg shadow-brand transition-transform hover:scale-105 active:scale-95 ${
                added ? "bg-emerald-500" : "bg-brand-grad"
              }`}
            >
              {added ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
