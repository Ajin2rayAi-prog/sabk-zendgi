import Link from "next/link";
import { ChevronLeft, GitCompare, X, Check, Minus } from "lucide-react";
import { getProductBySlug, getCategories } from "@/lib/shop";
import { arePricesVisible } from "@/lib/settings";
import { ProductThumb } from "@/components/product-thumb";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "مقایسهٔ محصولات" };

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { ids?: string };
}) {
  const slugs = (searchParams.ids ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const [cats, pricesVisible, ...maybe] = await Promise.all([
    getCategories(),
    arePricesVisible(),
    ...slugs.map((s) => getProductBySlug(s)),
  ]);
  const products = maybe.filter((p): p is NonNullable<typeof p> => Boolean(p));
  const catTitle = (slug: string) => cats.find((c) => c.slug === slug)?.title ?? "—";
  const priceHidden = !pricesVisible;

  function removeHref(slug: string) {
    const rest = products.filter((p) => p.slug !== slug).map((p) => p.slug);
    return rest.length ? `/compare?ids=${encodeURIComponent(rest.join(","))}` : "/compare";
  }

  return (
    <div className="container-lux py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="text-fg">مقایسهٔ محصولات</span>
      </nav>

      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
          <GitCompare className="h-6 w-6" />
        </span>
        <h1 className="text-3xl font-black">مقایسهٔ محصولات</h1>
      </div>

      {products.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="mb-4 text-muted">هیچ محصولی برای مقایسه انتخاب نشده است.</p>
          <Link href="/products" className="btn-primary inline-flex">
            مشاهدهٔ محصولات
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-2">
            <tbody>
              <tr>
                <th className="w-32 text-right align-bottom text-sm text-muted">مشخصه</th>
                {products.map((p) => (
                  <td key={p.slug} className="align-top">
                    <div className="card relative p-3">
                      <Link
                        href={removeHref(p.slug)}
                        aria-label="حذف از مقایسه"
                        className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                      >
                        <X className="h-4 w-4" />
                      </Link>
                      <Link href={`/product/${p.slug}`} className="block">
                        <div className="relative aspect-square overflow-hidden rounded-xl">
                          <ProductThumb categorySlug={p.categorySlug} image={p.image} alt={p.title} />
                        </div>
                        <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-relaxed hover:text-primary">
                          {p.title}
                        </h3>
                      </Link>
                    </div>
                  </td>
                ))}
              </tr>

              <CompareRow label="برند" cells={products.map((p) => p.brand)} />
              <CompareRow label="دسته‌بندی" cells={products.map((p) => catTitle(p.categorySlug))} />
              <CompareRow label="کد کالا" cells={products.map((p) => p.sku)} />
              <CompareRow
                label="قیمت"
                cells={products.map((p) => (
                  <span className={p.price == null || priceHidden ? "text-muted" : "font-black text-primary"}>
                    {priceHidden ? "استعلام قیمت" : formatPrice(p.price)}
                  </span>
                ))}
              />
              <CompareRow
                label="قیمت پیشین"
                cells={products.map((p) =>
                  p.priceBefore && !priceHidden ? (
                    <span className="text-muted line-through">{formatPrice(p.priceBefore)}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )
                )}
              />
              <CompareRow
                label="موجودی"
                cells={products.map((p) =>
                  p.inStock ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-4 w-4" /> موجود
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-500">
                      <Minus className="h-4 w-4" /> ناموجود
                    </span>
                  )
                )}
              />
              <CompareRow
                label="ویژگی‌ها"
                cells={products.map((p) =>
                  p.tags && p.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {p.tags.map((t) => (
                        <span key={t} className="chip text-xs text-muted">{t}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )
                )}
              />
              <tr>
                <th className="text-right text-sm text-muted">اقدام</th>
                {products.map((p) => (
                  <td key={p.slug} className="align-top">
                    <Link href={`/product/${p.slug}`} className="btn-primary w-full justify-center text-sm">
                      مشاهده و خرید
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompareRow({ label, cells }: { label: string; cells: React.ReactNode[] }) {
  return (
    <tr>
      <th className="text-right align-top text-sm text-muted">{label}</th>
      {cells.map((c, i) => (
        <td key={i} className="card p-3 align-top text-sm">
          {c}
        </td>
      ))}
    </tr>
  );
}
