import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toFa } from "@/lib/utils";
import { deleteBanner } from "../../actions";
import { DeleteButton } from "../delete-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "بنرهای صفحهٔ اول" };

export default async function AdminBanners() {
  const banners = await prisma.bannerSlide.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">بنرهای صفحهٔ اول</h1>
          <p className="mt-1 text-sm text-muted">
            {toFa(banners.length)} بنر — بنرهای فعال به‌ترتیب در اسلایدر تمام‌صفحهٔ صفحهٔ اول نمایش داده می‌شوند.
          </p>
        </div>
        <Link href="/admin/banners/new" className="btn-primary">
          <Plus className="h-4 w-4" /> بنر جدید
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b bg-primary-soft/40 text-right text-xs text-muted">
              <th className="px-4 py-3 font-semibold">پیش‌نمایش</th>
              <th className="px-4 py-3 font-semibold">عنوان</th>
              <th className="px-4 py-3 font-semibold">ترتیب</th>
              <th className="px-4 py-3 font-semibold">وضعیت</th>
              <th className="px-4 py-3 font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id} className="border-b last:border-0 hover:bg-primary-soft/20">
                <td className="px-4 py-2.5">
                  <div className="h-12 w-28 overflow-hidden rounded-lg border bg-elev">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-semibold">{b.title}</div>
                  {b.subtitle && <div className="text-xs text-muted">{b.subtitle}</div>}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-muted">{toFa(b.order)}</td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  {b.active ? (
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      فعال
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted/10 px-2.5 py-1 text-xs font-bold text-muted">
                      غیرفعال
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/banners/${b.id}`}
                      className="grid h-8 w-8 place-items-center rounded-lg border hover:border-primary hover:text-primary"
                      title="ویرایش"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton action={deleteBanner} id={b.id} message="این بنر حذف شود؟" />
                  </div>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                  هنوز بنری ثبت نشده — با «بنر جدید» اولین بنر را بسازید. تا آن موقع هیروی فعلی سایت نمایش داده می‌شود.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
