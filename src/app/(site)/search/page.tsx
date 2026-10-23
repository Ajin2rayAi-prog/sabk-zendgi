import Link from "next/link";
import { ChevronLeft, Search as SearchIcon, Sparkles } from "lucide-react";
import { searchProducts } from "@/lib/search";
import { arePricesVisible } from "@/lib/settings";
import { ProductCard } from "@/components/product-card";
import { SearchBox } from "@/components/search-box";
import { siteConfig } from "@/config/site";
import { toFa } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "جستجو" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const { products, aiUsed } = q
    ? await searchProducts(q)
    : { products: [], aiUsed: false };
  const priceHidden = !(await arePricesVisible());

  return (
    <div className="container-lux py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="text-fg">جستجو</span>
      </nav>

      <SearchBox defaultValue={q} autoFocus className="mb-6" />

      {q === "" ? (
        <p className="text-sm text-muted">برای جستجو عبارتی وارد کنید.</p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-black">
              نتایج جستجو برای «{q}»
            </h1>
            <span className="text-sm text-muted">{toFa(products.length)} محصول</span>
            {aiUsed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> بهبودیافته با هوش مصنوعی
              </span>
            )}
          </div>

          {products.length === 0 ? (
            <div className="card p-12 text-center">
              <SearchIcon className="mx-auto mb-3 h-9 w-9 text-muted opacity-40" />
              <p className="text-sm text-muted">
                محصولی مطابق جستجوی شما یافت نشد. می‌توانید عبارت دیگری را امتحان کنید یا برای مشاوره با
                شمارهٔ {siteConfig.contact.phone} تماس بگیرید.
              </p>
              <Link href="/products" className="link-primary mt-4 inline-block text-sm">
                مشاهدهٔ همهٔ محصولات
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.sku} product={p} index={i} priceHidden={priceHidden} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
