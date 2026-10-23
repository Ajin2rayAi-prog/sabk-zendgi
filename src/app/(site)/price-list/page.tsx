import Link from "next/link";
import { ChevronLeft, Phone, Printer } from "lucide-react";
import { getCategories, getProducts } from "@/lib/shop";
import { arePricesVisible } from "@/lib/settings";
import { getSiteConfig } from "@/lib/site-content";
import { formatPrice, toFa } from "@/lib/utils";

export const revalidate = 120;

export const metadata = { title: "لیست قیمت محصولات" };

export default async function PriceListPage() {
  const siteCfg = await getSiteConfig();
  const { brand, contact, currency } = siteCfg;
  const [categories, allProducts, pricesVisible] = await Promise.all([
    getCategories(),
    getProducts(),
    arePricesVisible(),
  ]);
  const priceHidden = !pricesVisible;

  return (
    <div className="container-lux py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="text-fg">لیست قیمت</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">لیست قیمت محصولات</h1>
          <p className="mt-1 text-sm text-muted">لیست قیمت محصولات شرکت {brand.name}</p>
        </div>
        <a href={`tel:${contact.phone}`} className="btn-primary">
          <Phone className="h-4 w-4" /> استعلام قیمت نهایی
        </a>
      </div>

      <div className="space-y-8">
        {categories.map((cat, idx) => {
          const list = allProducts.filter((p) => p.categorySlug === cat.slug);
          return (
            <section key={cat.slug} className="card overflow-hidden">
              {/* سربرگ سبز به سبک سند برند */}
              <div className="flex items-center justify-between bg-brand-grad px-5 py-3.5 text-primary-fg">
                <div className="flex items-center gap-2 font-bold">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 text-xs">
                    {toFa(idx + 1)}
                  </span>
                  {cat.title}
                </div>
                <span className="text-sm opacity-90">
                  {priceHidden ? "استعلام قیمت" : `قیمت (${currency.unit})`}
                </span>
              </div>

              {/* سطر عنوان جدول */}
              <div className="flex items-center justify-between border-b px-5 py-2 text-xs font-semibold text-muted">
                <span>نام محصول</span>
                <span>{priceHidden ? "استعلام قیمت" : `قیمت (${currency.unit})`}</span>
              </div>

              <ul>
                {list.map((p, i) => (
                  <li
                    key={p.sku}
                    className={`flex items-center justify-between gap-4 px-5 py-3 text-sm ${i % 2 ? "bg-primary-soft/40" : ""}`}
                  >
                    <Link href={`/product/${p.slug}`} className="flex items-center gap-3 font-medium hover:text-primary">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-fg">
                        {toFa(i + 1)}
                      </span>
                      <span>
                        {p.title}
                        {p.brand !== "سبک زندگی" && <span className="mr-1 text-xs text-muted">({p.brand})</span>}
                      </span>
                    </Link>
                    {priceHidden ? (
                      <span className="shrink-0 font-black text-muted">استعلام قیمت</span>
                    ) : (
                      <span className={`shrink-0 font-black tabular-nums ${p.price == null ? "text-muted" : "text-primary"}`}>
                        {formatPrice(p.price)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* بلوک تماس پایانی (مطابق سند برند) */}
      <div className="card mt-10 bg-brand-soft p-8 text-center">
        <p className="text-lg font-bold">برای استعلام قیمت نهایی و ثبت سفارش تماس بگیرید</p>
        <a href={`tel:${contact.phone}`} className="mt-3 inline-block text-2xl font-black text-primary">
          {contact.phone}
        </a>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
          {contact.sales.map((s) => (
            <span key={s.phone} className="flex items-center gap-2">
              <span className="font-semibold">{s.name}</span>
              <span dir="ltr" className="text-primary">{s.phone}</span>
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">{contact.address}</p>
      </div>
    </div>
  );
}
