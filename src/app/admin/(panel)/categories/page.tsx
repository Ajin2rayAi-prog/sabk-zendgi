import { Save, Trash2, Plus } from "lucide-react";
import { ConfirmSubmitButton } from "../delete-button";
import { prisma } from "@/lib/prisma";
import { toFa } from "@/lib/utils";
import { saveCategory, deleteCategory } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "مدیریت دسته‌ها" };

const field = "rounded-lg border bg-elev px-3 py-2 text-sm outline-none focus:border-primary";

export default async function AdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="mb-6 text-2xl font-black">دسته‌بندی‌ها</h1>

      {/* افزودن دستهٔ جدید */}
      <form action={saveCategory} className="card mb-6 grid gap-3 p-5 sm:grid-cols-[1fr_1fr_130px_auto]">
        <input name="title" required placeholder="عنوان دسته" className={field} />
        <input name="slug" required placeholder="slug (لاتین)" dir="ltr" className={field} />
        <input name="icon" placeholder="آیکون (lucide)" defaultValue="Package" dir="ltr" className={field} />
        <button className="btn-primary justify-center"><Plus className="h-4 w-4" /> افزودن</button>
      </form>

      <div className="space-y-3">
        {categories.map((c) => (
          <form key={c.id} action={saveCategory} className="card grid items-center gap-3 p-4 sm:grid-cols-[1fr_1fr_120px_90px_auto]">
            <input type="hidden" name="id" value={c.id} />
            <input name="title" defaultValue={c.title} className={field} />
            <input name="slug" defaultValue={c.slug} dir="ltr" className={field} />
            <input name="icon" defaultValue={c.icon} dir="ltr" className={field} />
            <div className="text-xs text-muted">{toFa(c._count.products)} محصول</div>
            <div className="flex items-center gap-1.5">
              <button className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-primary-fg" title="ذخیره">
                <Save className="h-4 w-4" />
              </button>
              <ConfirmSubmitButton
                action={deleteCategory}
                message={`دستهٔ «${c.title}» حذف شود؟`}
                className="grid h-9 w-9 place-items-center rounded-lg border text-rose-500 hover:bg-rose-500/10 disabled:opacity-40"
                title={c._count.products ? "ابتدا محصولات این دسته را منتقل/حذف کنید" : "حذف"}
                disabled={c._count.products > 0}
              >
                <Trash2 className="h-4 w-4" />
              </ConfirmSubmitButton>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
