"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as Icons from "lucide-react";
import { Search, ShoppingCart, Menu, X, Phone, LayoutGrid, User, ChevronDown } from "lucide-react";
import type { Category } from "@/data/catalog";
import { sections, groups, categories as staticCategories } from "@/data/catalog";
import { siteConfig, type SiteConfig } from "@/config/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { useCart } from "@/components/cart-provider";
import { SearchBox } from "@/components/search-box";
import { toFa } from "@/lib/utils";

type Section = "women" | "men" | "kids";

export function Header({ categories, cfg = siteConfig }: { categories: Category[]; cfg?: SiteConfig }) {
  const [mobile, setMobile] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const { count } = useCart();

  // منوی درختی محصولات: بخش ← گروه ← دسته (با هاور یا کلیک)
  const [selSection, setSelSection] = useState<Section>("women");
  const [selGroup, setSelGroup] = useState<string>("women-outer");
  // گروه هر دسته از روی کاتالوگ ثابت (دسته‌های ساخته‌شده از پنل زیر گروه اول بخش می‌روند)
  const groupOf = new Map(staticCategories.map((c) => [c.slug, c.group ?? c.section]));
  const firstGroupOf = (s: Section) => groups.find((g) => g.section === s)?.id ?? "";
  const selectSection = (s: Section) => {
    setSelSection(s);
    setSelGroup(firstGroupOf(s));
  };
  const groupsOfSel = groups.filter((g) => g.section === selSection);
  const catsOfGroup = categories.filter((c) => (groupOf.get(c.slug) ?? "") === selGroup);

  // آکاردئون موبایل: اول بخش زنانه باز است
  const [openSection, setOpenSection] = useState<Section | null>("women");
  const toggleSection = (sId: Section) => {
    setOpenSection(openSection !== sId ? sId : null);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* نوار بالایی */}
      <div className="hidden bg-primary-deep text-primary-fg md:block">
        <div className="container-lux flex h-9 items-center justify-between text-xs">
          <span className="opacity-90">{cfg.brand.tagline} — ارسال به سراسر کشور</span>
          <div className="flex items-center gap-4">
            <a href={`tel:${cfg.contact.phone}`} className="flex items-center gap-1 font-semibold hover:opacity-80">
              <Phone className="h-3.5 w-3.5" /> {cfg.contact.phone}
            </a>
            <Link href="/price-list" className="opacity-90 hover:opacity-100">لیست قیمت</Link>
          </div>
        </div>
      </div>

      {/* نوار اصلی */}
      <div className="glass border-b">
        <div className="container-lux flex h-16 items-center gap-4">
          <button className="md:hidden" onClick={() => setMobile(true)} aria-label="منو">
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt={cfg.brand.name}
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
            <span className="hidden text-lg font-black leading-tight sm:block">
              {cfg.brand.name}
            </span>
          </Link>

          {/* جستجو */}
          <SearchBox className="hidden flex-1 lg:block" />

          <div className="mr-auto flex items-center gap-1.5 lg:mr-0">
            <ThemeToggle />
            <IconLink href="/account" label="حساب کاربری">
              <User className="h-5 w-5" />
            </IconLink>
            <IconLink href="/cart" label="سبد خرید" count={count}>
              <ShoppingCart className="h-5 w-5" />
            </IconLink>
            <a href={`tel:${cfg.contact.phone}`} className="btn-primary hidden !py-2.5 sm:inline-flex">
              <Phone className="h-4 w-4" /> استعلام و سفارش
            </a>
          </div>
        </div>

        {/* منوی اصلی هدر */}
        <nav className="container-lux hidden items-center gap-1 border-t py-1 md:flex">
          {siteConfig.nav.map((item) =>
            item.href === "/products" ? (
              <div
                key="products"
                className="relative"
                onMouseEnter={() => setProductsOpen(true)}
                onMouseLeave={() => setProductsOpen(false)}
              >
                <button
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-bold text-primary"
                  onClick={() => setProductsOpen((v) => !v)}
                >
                  <LayoutGrid className="h-4 w-4" /> محصولات
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${productsOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {productsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full z-50 w-[720px] max-w-[92vw] p-4 shadow-2xl surface border rounded-2xl"
                    >
                      <div className="grid grid-cols-[180px_220px_1fr] gap-2">
                        {/* ستون ۱: دو بخش اصلی */}
                        <div className="grid content-start gap-1 border-l pl-2">
                          {sections.map((s) => {
                            const SecIcon = (Icons as any)[s.icon] ?? Icons.Package;
                            const active = selSection === s.id;
                            return (
                              <Link
                                key={s.id}
                                href={`/products?section=${s.id}`}
                                onMouseEnter={() => selectSection(s.id)}
                                onClick={() => selectSection(s.id)}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-bold transition-colors ${
                                  active ? "bg-primary-soft text-primary" : "hover:bg-primary-soft/60"
                                }`}
                              >
                                <SecIcon className="h-4 w-4 shrink-0 opacity-70" />
                                {s.title}
                              </Link>
                            );
                          })}
                        </div>
                        {/* ستون ۲: گروه‌های بخش */}
                        <div className="grid content-start gap-1 border-l pl-2">
                          {groupsOfSel.map((g) => {
                            const active = selGroup === g.id;
                            return (
                              <Link
                                key={g.id}
                                href={`/products?section=${selSection}&group=${g.id}`}
                                onMouseEnter={() => setSelGroup(g.id)}
                                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2.5 text-right text-sm font-semibold transition-colors ${
                                  active ? "bg-primary-soft text-primary" : "hover:bg-primary-soft/60"
                                }`}
                              >
                                {g.title}
                                <ChevronDown className="h-3.5 w-3.5 -rotate-90 opacity-50" />
                              </Link>
                            );
                          })}
                        </div>
                        {/* ستون ۳: دسته‌های گروه */}
                        <div className="grid content-start gap-0.5">
                          {catsOfGroup.map((c) => {
                            const Icon = (Icons as any)[c.icon] ?? Icons.Package;
                            return (
                              <Link
                                key={c.slug}
                                href={`/category/${c.slug}`}
                                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-primary-soft hover:text-primary"
                              >
                                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                                {c.title}
                              </Link>
                            );
                          })}
                          {catsOfGroup.length === 0 && (
                            <p className="px-2 py-4 text-xs text-muted">دسته‌ای ثبت نشده است.</p>
                          )}
                          <Link
                            href={`/products?section=${selSection}`}
                            className="mt-1 rounded-lg px-2 py-2 text-sm font-bold text-primary hover:underline"
                          >
                            مشاهدهٔ همه ←
                          </Link>
                        </div>
                      </div>
                      <div className="mt-3 border-t pt-3">
                        <Link href="/products" className="text-sm font-bold text-primary hover:underline">
                          مشاهدهٔ همهٔ محصولات →
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>

      {/* منوی موبایل */}
      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
            onClick={() => setMobile(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="surface absolute right-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="text-lg font-black">{cfg.brand.name}</span>
                <button onClick={() => setMobile(false)} aria-label="بستن">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <SearchBox onNavigate={() => setMobile(false)} />

              {/* لینک‌های اصلی */}
              <div className="grid gap-1">
                {siteConfig.nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobile(false)}
                    className="rounded-lg px-3 py-3 text-sm font-bold hover:bg-primary-soft hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* محصولات به‌صورت آکاردئون: بخش ← گروه ← دسته */}
              <div className="mt-5 space-y-3">
                {sections.map((s) => {
                  const sOpen = openSection === s.id;
                  return (
                    <div key={s.id} className="rounded-xl bg-elev/60 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => toggleSection(s.id)}
                          className={`flex flex-1 items-center justify-between rounded-lg px-1 py-1 text-right text-xs font-black ${sOpen ? "text-primary" : ""}`}
                        >
                          {s.title}
                          <ChevronDown className={`h-4 w-4 transition-transform ${sOpen ? "rotate-180" : ""}`} />
                        </button>
                        <Link
                          href={`/products?section=${s.id}`}
                          onClick={() => setMobile(false)}
                          className="shrink-0 text-[11px] font-bold text-primary hover:underline"
                        >
                          همه
                        </Link>
                      </div>
                      {sOpen &&
                        groups
                          .filter((g) => g.section === s.id)
                          .map((g) => {
                            return (
                              <div key={g.id} className="mt-2 rounded-lg bg-elev/60 p-2">
                                <Link
                                  href={`/products?section=${s.id}&group=${g.id}`}
                                  onClick={() => setMobile(false)}
                                  className="flex w-full items-center justify-between rounded px-1 py-1.5 text-right text-xs font-bold"
                                >
                                  {g.title}
                                  <ChevronDown className="h-3.5 w-3.5 -rotate-90 opacity-60" />
                                </Link>
                                <div className="mt-1 grid gap-0.5">
                                  {categories
                                    .filter((c) => (groupOf.get(c.slug) ?? "") === g.id)
                                    .map((c) => (
                                      <Link
                                        key={c.slug}
                                        href={`/category/${c.slug}`}
                                        onClick={() => setMobile(false)}
                                        className="rounded-lg px-2 py-2 text-sm font-medium hover:text-primary"
                                      >
                                        {c.title}
                                      </Link>
                                    ))}
                                </div>
                              </div>
                            );
                          })}
                    </div>
                  );
                })}
              </div>

              <a href={`tel:${cfg.contact.phone}`} className="btn-primary mt-6 w-full">
                <Phone className="h-4 w-4" /> {cfg.contact.phone}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function IconLink({
  href,
  label,
  count,
  children,
}: {
  href: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative grid h-10 w-10 place-items-center rounded-xl border transition-colors hover:border-primary hover:text-primary"
    >
      {children}
      {count ? (
        <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-fg">
          {toFa(count)}
        </span>
      ) : null}
    </Link>
  );
}
