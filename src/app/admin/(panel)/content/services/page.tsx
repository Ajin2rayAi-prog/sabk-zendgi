import Link from "next/link";
import { Save, CheckCircle2 } from "lucide-react";
import { getPageContent, toPairedLines } from "@/lib/site-content";
import { saveSiteContent } from "../../../actions";
import { ContentNav, H, L, field } from "../_nav";

export const dynamic = "force-dynamic";
export const metadata = { title: "محتوای سایت — خدمات" };

export default async function AdminContentServices({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const pages = await getPageContent();

  return (
    <div className="max-w-3xl">
      <ContentNav current="/admin/content/services" />

      {searchParams.saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4.5 w-4.5" /> محتوا ذخیره و روی سایت اعمال شد.
        </div>
      )}

      <form action={saveSiteContent} className="space-y-6">
        <input type="hidden" name="returnTo" value="/admin/content/services" />
        <div className="card space-y-4 p-6">
          <H>خدمات</H>
          <L label="خدمات زنانه — ۴ مورد (هر خط: عنوان | توضیح)">
            <textarea name="servicesFanni" rows={5} defaultValue={toPairedLines(pages.services.women)} className={field} />
          </L>
          <L label="خدمات مردانه — ۴ مورد (هر خط: عنوان | توضیح)">
            <textarea name="servicesBadaneh" rows={5} defaultValue={toPairedLines(pages.services.men)} className={field} />
          </L>
          <L label="مزایا — ۳ مورد (هر خط: عنوان | توضیح)">
            <textarea name="servicesPerks" rows={4} defaultValue={toPairedLines(pages.services.perks)} className={field} />
          </L>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary">
            <Save className="h-4 w-4" /> ذخیره و اعمال روی سایت
          </button>
          <Link href="/services" target="_blank" className="btn-ghost">مشاهدهٔ صفحه</Link>
        </div>
      </form>
    </div>
  );
}
