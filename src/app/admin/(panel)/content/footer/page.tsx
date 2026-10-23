import Link from "next/link";
import { Save, CheckCircle2 } from "lucide-react";
import { getSiteConfig } from "@/lib/site-content";
import { saveSiteContent } from "../../../actions";
import { ContentNav, H, L, field } from "../_nav";

export const dynamic = "force-dynamic";
export const metadata = { title: "محتوای سایت — فوتر" };

export default async function AdminContentFooter({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const cfg = await getSiteConfig();

  return (
    <div className="max-w-3xl">
      <ContentNav current="/admin/content/footer" />

      {searchParams.saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4.5 w-4.5" /> محتوا ذخیره و روی سایت اعمال شد.
        </div>
      )}

      <form action={saveSiteContent} className="space-y-6">
        <input type="hidden" name="returnTo" value="/admin/content/footer" />
        <div className="card space-y-4 p-6">
          <H>فوتر</H>
          <L label="مجوزها (هر خط: عنوان | آدرس)">
            <textarea
              name="certs"
              rows={3}
              defaultValue={cfg.footer.certifications.map((c) => `${c.label} | ${c.href}`).join("\n")}
              className={field}
              dir="ltr"
            />
          </L>
          <L label="نوار اعتبار بالای فوتر — ۴ خط">
            <textarea
              name="trust"
              rows={4}
              defaultValue={cfg.footer.trust.map((t) => t.title).join("\n")}
              className={field}
            />
          </L>
          <L label="لینک‌های فوتر (هر خط: عنوان | آدرس)">
            <textarea
              name="footerLinks"
              rows={3}
              defaultValue={cfg.footer.links.map((l) => `${l.label} | ${l.href}`).join("\n")}
              className={field}
              dir="ltr"
            />
          </L>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary">
            <Save className="h-4 w-4" /> ذخیره و اعمال روی سایت
          </button>
          <Link href="/" target="_blank" className="btn-ghost">مشاهدهٔ سایت</Link>
        </div>
      </form>
    </div>
  );
}
