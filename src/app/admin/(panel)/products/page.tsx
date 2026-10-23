import Link from "next/link";
import { Plus, Pencil, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getPricesVisible } from "@/lib/settings";
import { toFa } from "@/lib/utils";
import { deleteProduct, quickUpdateProduct } from "../../actions";
import { DeleteButton } from "../delete-button";
import { EyeToggle } from "./eye-toggle";
import { sections, groups, categories as staticCategories } from "@/data/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "مدیریت محصولات" };

// گروه هر دسته از روی کاتالوگ ثابت؛ دسته‌های ساخته‌شده از پنل می‌روند زیر «سایر»
const groupOf = new Map(staticCategories.map((c) => [c.slug, c.group ?? ""]));
const sectionOf = new Map(staticCategories.map((c) => [c.slug, c.section]));

function QuickRow({
  p,
  pricesVisible,
}: {
  p: {
    id: string;
    sku: string;
    title: string;
    brand: string;
    price: number | null;
    inStock: boolean;
    visible: boolean;
    featured: boolean;
  };
  pricesVisible: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 border-b px-4 py-2.5 text-sm last:border-0 hover:bg-primary-soft/20 ${p.visible ? "" : "opacity-55"}`}>
      <span className="w-20 shrink-0 font-mono text-xs text-muted" dir="ltr">{p.sku}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold">{p.title}</div>
        <div className="text-xs text-muted">{p.brand}{p.featured ? " · منتخب" : ""}</div>
      </div>
      <form action={quickUpdateProduct} className="flex shrink-0 items-center gap-1.5">
        <input type="hidden" name="id" value={p.id} />
        <input
          type="text"
          inputMode="numeric"
          name="price"
          defaultValue={p.price ?? ""}
          placeholder="استعلام"
          disabled={!pricesVisible}
          title={pricesVisible ? "قیمت به ریال" : "نمایش قیمت‌ها غیرفعال است"}
          className="w-24 rounded-lg border bg-elev px-2 py-1.5 text-xs tabular-nums outline-none focus:border-primary disabled:opacity-40"
        />
        <label className="hidden items-center gap-1 text-[11px] text-muted sm:flex">
          <input type="checkbox" name="inStock" defaultChecked={p.inStock} className="accent-[rgb(var(--c-primary))]" />
          موجود
        </label>
        <button
          className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-primary-fg disabled:opacity-40"
          title="ذخیره"
          disabled={!pricesVisible}
        >
          <Save className="h-3.5 w-3.5" />
        </button>
      </form>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.inStock ? "bg-emerald-500" : "bg-rose-400"}`} />
      <div className="flex shrink-0 items-center gap-1.5">
        <EyeToggle id={p.id} visible={p.visible} />
        <Link href={`/admin/products/${p.id}`} className="grid h-8 w-8 place-items-center rounded-lg border hover:border-primary hover:text-primary" title="ویرایش">
          <Pencil className="h-4 w-4" />
        </Link>
        <DeleteButton action={deleteProduct} id={p.id} message="این محصول حذف شود؟" />
      </div>
    </div>
  );
}

export default async function AdminProducts({
  searchParams,
}: {
  searchParams: { section?: string };
}) {
  const section =
    searchParams.section === "men" || searchParams.section === "kids"
      ? searchParams.section
      : "women";
  const [products, pricesVisible] = await Promise.all([
    prisma.product.findMany({
      orderBy: { sku: "asc" },
      include: { category: true },
    }),
    getPricesVisible(),
  ]);

  const inSection = (slug: string) => (sectionOf.get(slug) ?? "women") === section;
  const sectionProducts = products.filter((p) => inSection(p.categorySlug));
  const otherProducts = products.filter((p) => !sectionOf.has(p.categorySlug));
  const sectionGroups = groups.filter((g) => g.section === section);

  const tab = (id: string, label: string, count: number, active: boolean) => (
    <Link
      key={id}
      href={`/admin/products?section=${id}`}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
        active ? "bg-brand-grad text-primary-fg" : "border hover:border-primary hover:text-primary"
      }`}
    >
      {label} ({toFa(count)})
    </Link>
  );

  const countOf = (sec: string) => products.filter((p) => (sectionOf.get(p.categorySlug) ?? "women") === sec).length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">محصولات</h1>
          <p className="mt-1 text-sm text-muted">{toFa(products.length)} محصول — قیمت‌ها به ریال</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> محصول جدید
        </Link>
      </div>

      {!pricesVisible && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          <span>
            ⚠ نمایش قیمت‌ها در سایت غیرفعال است — محصول‌ها «استعلام قیمت» نشان می‌دهند.
          </span>
          <Link href="/admin/settings" className="link-primary text-sm">فعال‌سازی از تنظیمات</Link>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {sections.map((s) => tab(s.id, s.title, countOf(s.id), section === s.id))}
      </div>

      <div className="grid gap-3">
        {sectionGroups.map((g, gi) => {
          const cats = staticCategories.filter((c) => c.group === g.id);
          const items = sectionProducts.filter((p) =>
            cats.some((c) => c.slug === p.categorySlug)
          );
          if (!items.length) return null;
          return (
            <details key={g.id} open={gi === 0} className="card overflow-hidden">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black transition-colors hover:text-primary">
                {g.title} <span className="text-xs font-normal text-muted">({toFa(items.length)} محصول)</span>
              </summary>
              <div className="border-t">
                {cats.map((c) => {
                  const list = items.filter((p) => p.categorySlug === c.slug);
                  if (!list.length) return null;
                  return (
                    <div key={c.slug} className="border-b last:border-0">
                      <div className="bg-primary-soft/40 px-4 py-2 text-xs font-bold text-muted">
                        {c.title} ({toFa(list.length)})
                      </div>
                      {list.map((p) => (
                        <QuickRow key={p.id} p={p} pricesVisible={pricesVisible} />
                      ))}
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}

        {section === "women" && otherProducts.length > 0 && (
          <details className="card overflow-hidden">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black transition-colors hover:text-primary">
              سایر دسته‌ها <span className="text-xs font-normal text-muted">({toFa(otherProducts.length)} محصول)</span>
            </summary>
            <div className="border-t">
              {otherProducts.map((p) => (
                <QuickRow key={p.id} p={p} pricesVisible={pricesVisible} />
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
