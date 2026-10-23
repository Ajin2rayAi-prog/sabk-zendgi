import Link from "next/link";
import { notFound } from "next/navigation";
import * as Icons from "lucide-react";
import { SlidersHorizontal, ChevronLeft } from "lucide-react";
import { getCategories, getCategoryBySlug, getProductsByCategory } from "@/lib/shop";
import { arePricesVisible } from "@/lib/settings";
import { ProductCard } from "@/components/product-card";
import { toFa } from "@/lib/utils";

export const revalidate = 120; // کش کوتاه + بیطلسی مجدد با تغییرات پنل

export async function generateStaticParams() {
  // در زمان build ممکناً دیتابیس در دسترس نباشد؛ صفحات با ISR ساخته می‌شوند.
  try {
    const categories = await getCategories();
    return categories.map((c) => ({ slug: c.slug }));
  } catch {
    return [];
  }
}

// متاهای بهینه‌شدهٔ ایجنت سئو برای این دسته (اگر ذخیره شده باشد).
import { seoAgentMetadata } from "@/lib/seo-agent";
export async function generateMetadata({ params }: { params: { slug: string } }) {
  return seoAgentMetadata(`/category/${params.slug}`);
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) notFound();

  const list = await getProductsByCategory(params.slug);
  const categories = await getCategories();
  const priceHidden = !(await arePricesVisible());
  const catBrands = Array.from(new Set(list.map((p) => p.brand)));
  const Icon = (Icons as any)[cat.icon] ?? Icons.Package;

  // گروه‌بندی محصولات بر اساس زیردسته (اولین تگ = نام زیردسته)
  const groups: { name: string; items: typeof list }[] = [];
  for (const p of list) {
    const g = p.tags?.[0] ?? "سایر";
    let bucket = groups.find((x) => x.name === g);
    if (!bucket) {
      bucket = { name: g, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(p);
  }

  // اسکیمای ایجنت سئو برای این دسته (اگر ذخیره شده باشد، وگرنه هیچی).
  const { seoAgentSchema } = await import("@/lib/seo-agent");
  const agentSchema = seoAgentSchema(`/category/${params.slug}`);

  return (
    <div className="container-lux py-8">
      {agentSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: agentSchema }}
        />
      ) : null}
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-primary">محصولات</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="text-muted">{(cat as any).groupTitle}</span>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span className="text-fg">{cat.title}</span>
      </nav>

      <div className="mb-6 flex items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Icon className="h-7 w-7" />
        </span>
        <div>
          {cat.sectionTitle && (
            <span className="chip bg-primary-soft text-primary">{cat.sectionTitle}</span>
          )}
          <h1 className="mt-1 text-2xl font-black sm:text-3xl">{cat.title}</h1>
          <p className="mt-1 text-sm text-muted">{cat.description} · {toFa(list.length)} کالا</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* فیلترها */}
        <aside className="card glass-frame h-fit p-5">
          <div className="mb-4 flex items-center gap-2 font-bold">
            <SlidersHorizontal className="h-5 w-5 text-primary" /> فیلترها
          </div>

          <FilterGroup title="سایر دسته‌ها">
            {categories.filter((c) => c.slug !== cat.slug).map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className="block rounded-lg px-2 py-1.5 text-sm text-muted hover:text-primary">
                {c.title}
              </Link>
            ))}
          </FilterGroup>

          <FilterGroup title="برند">
            {catBrands.map((b) => (
              <label key={b} className="flex cursor-pointer items-center gap-2 py-1 text-sm text-muted hover:text-fg">
                <input type="checkbox" className="accent-primary" /> {b}
              </label>
            ))}
          </FilterGroup>

          <FilterGroup title="وضعیت">
            <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-muted"><input type="checkbox" className="accent-primary" /> فقط موجود</label>
            <label className="flex cursor-pointer items-center gap-2 py-1 text-sm text-muted"><input type="checkbox" className="accent-primary" /> دارای قیمت</label>
          </FilterGroup>
        </aside>

        {/* شبکهٔ محصولات، گروه‌بندی‌شده بر اساس زیردسته */}
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.name}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                <span className="h-4 w-1.5 rounded-full bg-primary" />
                {g.name}
                <span className="text-xs font-normal text-muted">({toFa(g.items.length)} کالا)</span>
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {g.items.map((p, i) => (
                  <ProductCard key={p.sku} product={p} index={i} priceHidden={priceHidden} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t py-4 first:border-t-0 first:pt-0">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}
