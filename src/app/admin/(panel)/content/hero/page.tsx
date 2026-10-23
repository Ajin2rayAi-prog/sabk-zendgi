import Link from "next/link";
import { Save, CheckCircle2 } from "lucide-react";
import { getSiteConfig } from "@/lib/site-content";
import { saveSiteContent } from "../../../actions";
import { ContentNav, H, L, field } from "../_nav";

export const dynamic = "force-dynamic";
export const metadata = { title: "محتوای سایت — بنر اول" };

export default async function AdminContentHero({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const cfg = await getSiteConfig();

  return (
    <div className="max-w-3xl">
      <ContentNav current="/admin/content/hero" />

      {searchParams.saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4.5 w-4.5" /> محتوا ذخیره و روی سایت اعمال شد.
        </div>
      )}

      <form action={saveSiteContent} className="space-y-6">
        <input type="hidden" name="returnTo" value="/admin/content/hero" />
        <div className="card space-y-4 p-6">
          <H>بنر متنی صفحه اول</H>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="برچسب بالا"><input name="heroEyebrow" defaultValue={cfg.hero.eyebrow} className={field} /></L>
            <L label="تیتر"><input name="heroTitle" defaultValue={cfg.hero.title} className={field} /></L>
          </div>
          <L label="تیتر رنگی"><input name="heroHighlight" defaultValue={cfg.hero.highlight} className={field} /></L>
          <L label="زیرعنوان"><textarea name="heroSubtitle" rows={3} defaultValue={cfg.hero.subtitle} className={field} /></L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="دکمه اول — متن"><input name="cta1label" defaultValue={cfg.hero.ctaPrimary.label} className={field} /></L>
            <L label="دکمه اول — لینک"><input name="cta1href" defaultValue={cfg.hero.ctaPrimary.href} className={field} dir="ltr" /></L>
            <L label="دکمه دوم — متن"><input name="cta2label" defaultValue={cfg.hero.ctaSecondary.label} className={field} /></L>
            <L label="دکمه دوم — لینک"><input name="cta2href" defaultValue={cfg.hero.ctaSecondary.href} className={field} dir="ltr" /></L>
          </div>
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
