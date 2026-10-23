import Link from "next/link";
import * as Icons from "lucide-react";
import { ChevronLeft, SlidersHorizontal, X, Flower2, Shirt, Baby } from "lucide-react";
import { getCategories, getProducts, getBrands } from "@/lib/shop";
import { arePricesVisible } from "@/lib/settings";
import { ProductCard } from "@/components/product-card";
import { toFa } from "@/lib/utils";
import type { Product, Section } from "@/data/catalog";
import { groups } from "@/data/catalog";

export const revalidate = 120; // کش کوتاه + بیطلسی مجدد با تغییرات پنل (فعلاً نگه داشته شده، پوش نشده)

export const metadata = { title: "همهٔ محصولات" };

type SP = {
  cat?: string;
  brand?: string;
  sort?: string;
  stock?: string;
  section?: string;
  group?: string;
};

const SORTS: Record<string, (a: Product, b: Product) => number> = {
  "price-asc": (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
  "price-desc": (a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity),
  name: (a, b) => a.title.localeCompare(b.title, "fa"),
};

const SECTION_META: Record<Section, { title: string; subtitle: string; icon: any }> = {
  women: {
    title: "پوشاک زنانه",
    subtitle: "مانتو، شومیز، پیراهن، شلوار، دامن و ست",
    icon: Flower2,
  },
  men: {
    title: "پوشاک مردانه",
    subtitle: "تی‌شرت، پیراهن، شلوار، هودی و کت",
    icon: Shirt,
  },
  kids: {
    title: "پوشاک بچگانه",
    subtitle: "دخترانه، پسرانه، نوزادی و ست بچگانه",
    icon: Baby,
  },
};

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const [categories, allProducts, brands, pricesVisible] = await Promise.all([
    getCategories(),
    getProducts(),
    getBrands(),
    arePricesVisible(),
  ]);
  const priceHidden = !pricesVisible;

  const { cat, brand, sort, stock, section, group } = searchParams;
  const sectionFilter =
    section === "women" || section === "men" || section === "kids" ? (section as Section) : undefined;
  // فیلتر گروه (مثلاً نوزادان) — فقط گروه معتبرِ همان بخش قبول است
  const groupObj = groups.find((g) => g.id === group && (!sectionFilter || g.section === sectionFilter));
  const groupFilter = groupObj?.id;
  const hasFilters = Boolean(cat || brand || sort || stock);
  const selectCls =
    "min-w-40 rounded-xl border bg-elev px-3 py-2 text-sm outline-none focus:border-primary";

  // فیلتر بر اساس بخش (women/men/kids) و گروه (اختیاری)
  const scopedCategories = categories.filter(
    (c) =>
      (!sectionFilter || c.section === sectionFilter) &&
      (!groupFilter || c.group === groupFilter)
  );
  const scopedProducts = sectionFilter
    ? allProducts.filter((p) => scopedCategories.some((c) => c.slug === p.categorySlug))
    : allProducts;

  // اگر فقط یک بخش انتخاب شده، آن را نشان بده؛ در غیر این‌صورت دو کارت بخش
  const showSections = !sectionFilter && !groupFilter;

  // گروه‌های اصلی هر بخش + زیرشاخه‌های هر گروه
  const visibleGroups = groups
    .filter((g) => !sectionFilter || g.section === sectionFilter)
    .map((g) => ({ ...g, cats: scopedCategories.filter((c) => c.group === g.id) }))
    .filter((g) => g.cats.length > 0);

  return (
    <div className="container-lux py-8">
      <nav className="mb-4 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/" className="hover:text-primary">خانه</Link>
        <ChevronLeft className="h-3.5 w-3.5" />
        {groupObj ? (
          <>
            <Link href="/products" className="hover:text-primary">محصولات</Link>
            <ChevronLeft className="h-3.5 w-3.5" />
            <Link href={`/products?section=${groupObj.section}`} className="hover:text-primary">
              {SECTION_META[groupObj.section as Section].title}
            </Link>
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="text-fg">{groupObj.title}</span>
          </>
        ) : (
          <span className="text-fg">
            {sectionFilter ? SECTION_META[sectionFilter].title : "همهٔ محصولات"}
          </span>
        )}
      </nav>

      <h1 className="mb-6 text-3xl font-black">
        {groupObj ? groupObj.title : sectionFilter ? SECTION_META[sectionFilter].title : "همهٔ محصولات"}
      </h1>

      {/* انتخاب بخش (زنانه / مردانه / بچگانه) */}
      {showSections ? (
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {(Object.keys(SECTION_META) as Section[]).map((id) => {
            const meta = SECTION_META[id];
            const secCats = categories.filter((c) => c.section === id);
            const count = allProducts.filter((p) => secCats.some((c) => c.slug === p.categorySlug)).length;
            return (
              <Link
                key={id}
                href={`/products?section=${id}`}
                className="card glass-frame flex items-center gap-4 p-6 transition-all hover:border-primary hover:shadow-lg"
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <meta.icon className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-black">{meta.title}</h2>
                  <p className="mt-1 text-sm text-muted">{meta.subtitle}</p>
                  <span className="mt-2 inline-block text-xs font-semibold text-primary">
                    {toFa(count)} محصول
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mb-8">
          <Link
            href={groupObj ? `/products?section=${groupObj.section}` : "/products"}
            className="btn-ghost flex items-center gap-1 text-sm"
          >
            <ChevronLeft className="h-4 w-4" /> {groupObj ? "بازگشت به بخش" : "همهٔ بخش‌ها"}
          </Link>
        </div>
      )}

      {/* نوار فیلتر و مرتب‌سازی */}
      <form method="get" className="card glass-frame mb-8 flex flex-wrap items-end gap-3 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <SlidersHorizontal className="h-4 w-4" /> فیلترها
        </div>

        {sectionFilter && <input type="hidden" name="section" value={sectionFilter} />}
        {groupFilter && <input type="hidden" name="group" value={groupFilter} />}

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">دسته‌بندی</span>
          <select name="cat" defaultValue={cat ?? ""} className={selectCls}>
            <option value="">همه</option>
            {scopedCategories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.title}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">برند</span>
          <select name="brand" defaultValue={brand ?? ""} className={selectCls}>
            <option value="">همه</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted">مرتب‌سازی</span>
          <select name="sort" defaultValue={sort ?? ""} className={selectCls}>
            <option value="">پیش‌فرض</option>
            <option value="price-asc">ارزان‌ترین</option>
            <option value="price-desc">گران‌ترین</option>
            <option value="name">نام (الفبا)</option>
          </select>
        </label>

        <label className="flex items-center gap-2 pb-2 text-xs">
          <input type="checkbox" name="stock" value="1" defaultChecked={stock === "1"} className="h-4 w-4 accent-primary" />
          <span>فقط موجودها</span>
        </label>

        <button type="submit" className="btn-primary text-sm">اعمال</button>
        {hasFilters && (
          <Link
            href={groupFilter ? `/products?section=${sectionFilter ?? ""}&group=${groupFilter}` : sectionFilter ? `/products?section=${sectionFilter}` : "/products"}
            className="btn-ghost flex items-center gap-1 text-sm"
          >
            <X className="h-4 w-4" /> حذف فیلتر
          </Link>
        )}
      </form>

      {hasFilters ? (
        <FilteredView allProducts={scopedProducts} sp={searchParams} priceHidden={priceHidden} />
      ) : (
        <div className="space-y-12">
          {visibleGroups.map((g) => (
            <div key={g.id}>
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-xl font-black">{g.title}</h2>
                <span className="text-xs text-muted">
                  {toFa(g.cats.length)} دسته
                </span>
              </div>
              {g.cats.map((c) => {
            const list = scopedProducts.filter((p) => p.categorySlug === c.slug);
            const Icon = (Icons as any)[c.icon] ?? Icons.Package;
            return (
              <section key={c.slug}>
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="text-xl font-black">{c.title}</h2>
                      <span className="text-xs text-muted">{toFa(list.length)} کالا</span>
                    </div>
                  </div>
                  <Link href={`/category/${c.slug}`} className="link-primary flex items-center gap-1 text-sm">
                    مشاهدهٔ دسته <ChevronLeft className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {list.map((p, i) => (
                    <ProductCard key={p.sku} product={p} index={i} priceHidden={priceHidden} />
                  ))}
                </div>
              </section>
            );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FilteredView({ allProducts, sp, priceHidden = false }: { allProducts: Product[]; sp: SP; priceHidden?: boolean }) {
  let list = allProducts;
  if (sp.cat) list = list.filter((p) => p.categorySlug === sp.cat);
  if (sp.brand) list = list.filter((p) => p.brand === sp.brand);
  if (sp.stock === "1") list = list.filter((p) => p.inStock);
  if (sp.sort && SORTS[sp.sort]) list = [...list].sort(SORTS[sp.sort]);

  return (
    <div>
      <p className="mb-5 text-sm text-muted">{toFa(list.length)} کالا یافت شد</p>
      {list.length === 0 ? (
        <div className="card p-8 text-center text-muted">
          محصولی با این فیلترها یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {list.map((p, i) => (
            <ProductCard key={p.sku} product={p} index={i} priceHidden={priceHidden} />
          ))}
        </div>
      )}
    </div>
  );
}
