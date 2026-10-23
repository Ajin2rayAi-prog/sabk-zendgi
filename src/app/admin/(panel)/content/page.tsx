import Link from "next/link";
import { FileText, Save, CheckCircle2 } from "lucide-react";
import { getSiteConfig } from "@/lib/site-content";
import { saveSiteContent } from "../../actions";
import { ContentNav, H, L, field } from "./_nav";

export const dynamic = "force-dynamic";
export const metadata = { title: "محتوای سایت — عمومی" };

export default async function AdminContentGeneral({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const cfg = await getSiteConfig();
  const ig = cfg.social.find((s) => s.icon === "Instagram")?.href ?? "";
  const wa = cfg.social.find((s) => s.icon === "MessageCircle")?.href ?? "";
  const tg = cfg.social.find((s) => s.icon === "Send")?.href ?? "";

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <FileText className="h-6 w-6 text-primary" /> محتوای سایت
        </h1>
        <p className="mt-1 text-sm text-muted">
          هر خانه‌ای که خالی بماند، مقدار پیش‌فرض خودش را نشان می‌دهد.
        </p>
      </div>

      <ContentNav current="/admin/content" />

      {searchParams.saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4.5 w-4.5" /> محتوا ذخیره و روی سایت اعمال شد.
        </div>
      )}

      <form action={saveSiteContent} className="space-y-6">
        <input type="hidden" name="returnTo" value="/admin/content" />
        <div className="card space-y-4 p-6">
          <H>نام و شعار</H>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="نام برند"><input name="brandName" defaultValue={cfg.brand.name} className={field} /></L>
            <L label="شعار کوتاه"><input name="tagline" defaultValue={cfg.brand.tagline} className={field} /></L>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <H>تلفن و آدرس</H>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="تلفن ثابت اصلی"><input name="phone" defaultValue={cfg.contact.phone} className={field} dir="ltr" /></L>
            <L label="لینک مسیریابی (گوگل‌مپ)"><input name="mapUrl" defaultValue={cfg.contact.mapUrl ?? ""} className={field} dir="ltr" placeholder="https://maps.app.goo.gl/..." /></L>
          </div>
          <L label="آدرس"><input name="address" defaultValue={cfg.contact.address} className={field} /></L>
          <div className="grid gap-4 sm:grid-cols-2">
            <L label="فروشنده ۱ — نام"><input name="sales1name" defaultValue={cfg.contact.sales[0]?.name ?? ""} className={field} /></L>
            <L label="فروشنده ۱ — موبایل"><input name="sales1phone" defaultValue={cfg.contact.sales[0]?.phone ?? ""} className={field} dir="ltr" /></L>
            <L label="فروشنده ۲ — نام"><input name="sales2name" defaultValue={cfg.contact.sales[1]?.name ?? ""} className={field} /></L>
            <L label="فروشنده ۲ — موبایل"><input name="sales2phone" defaultValue={cfg.contact.sales[1]?.phone ?? ""} className={field} dir="ltr" /></L>
          </div>
        </div>

        <div className="card space-y-4 p-6">
          <H>اینستاگرام / واتساپ / تلگرام</H>
          <L label="لینک اینستاگرام"><input name="instagram" defaultValue={ig} className={field} dir="ltr" /></L>
          <L label="لینک واتساپ"><input name="whatsapp" defaultValue={wa} className={field} dir="ltr" /></L>
          <L label="لینک تلگرام"><input name="telegram" defaultValue={tg} className={field} dir="ltr" /></L>
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
