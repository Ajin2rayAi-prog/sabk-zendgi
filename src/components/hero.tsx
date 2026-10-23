"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Truck, Headset, BadgeCheck } from "lucide-react";
import { siteConfig, type SiteConfig } from "@/config/site";
import type { Category, Product } from "@/data/catalog";
import { ProductThumb } from "@/components/product-thumb";
import { toFa } from "@/lib/utils";

export function Hero({ featured, categories, cfg = siteConfig }: { featured: Product[]; categories: Category[]; cfg?: SiteConfig }) {

  return (
    <section className="relative overflow-hidden border-b">
      {/* پس‌زمینهٔ برند */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-brand-soft" />
      <div className="pointer-events-none absolute -right-40 -top-40 -z-10 h-96 w-96 rounded-full bg-primary/20 blur-[130px]" />

      <div className="container-lux grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="chip border-primary/30 bg-elev text-primary"
          >
            <BadgeCheck className="h-4 w-4" /> {cfg.hero.eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 text-4xl font-black leading-[1.3] sm:text-5xl"
          >
            {cfg.hero.title}
            <br />
            <span className="bg-brand-grad bg-clip-text text-transparent">
              {cfg.hero.highlight}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-5 max-w-xl leading-relaxed text-muted"
          >
            {cfg.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link href={cfg.hero.ctaPrimary.href} className="btn-primary">
              {cfg.hero.ctaPrimary.label} <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href={cfg.hero.ctaSecondary.href} className="btn-ghost">
              {cfg.hero.ctaSecondary.label}
            </Link>
          </motion.div>

          <div className="mt-10 grid max-w-lg grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: ShieldCheck, k: "تضمین", v: "کیفیت و دوخت" },
              { icon: Truck, k: "ارسال", v: "سراسر کشور" },
              { icon: Headset, k: "پشتیبانی", v: "انتخاب سایز" },
              { icon: BadgeCheck, k: `+${toFa(40)}`, v: "قلم کالا" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <s.icon className="h-6 w-6 shrink-0 text-primary" />
                <div>
                  <div className="text-sm font-black leading-tight">{s.k}</div>
                  <div className="text-xs text-muted">{s.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* بصری: کارت‌های شناور محصولات منتخب */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="relative hidden lg:block"
        >
          <div className="grid grid-cols-2 gap-4">
            {featured.map((p, i) => {
              const cat = categories.find((c) => c.slug === p.categorySlug);
              return (
                <motion.div
                  key={p.sku}
                  animate={{ y: [0, i % 2 ? 8 : -8, 0] }}
                  transition={{ duration: 6 + i, repeat: Infinity }}
                  className={`card glass-frame overflow-hidden ${i % 2 ? "mt-8" : ""}`}
                >
                  <div className="aspect-[4/3] w-full">
                    <ProductThumb categorySlug={p.categorySlug} image={p.image} alt={p.title} seed={i} />
                  </div>
                  <div className="p-4">
                    <div className="line-clamp-2 text-sm font-bold leading-relaxed">{p.title}</div>
                    <div className="mt-1 text-xs text-muted">{cat?.title}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
