import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { saveBanner } from "../../actions";
import { SubmitButton } from "@/components/submit-button";
import { ImagePicker } from "@/components/image-picker";

export type BannerLike = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  imageMobile: string | null;
  link: string | null;
  order: number;
  active: boolean;
} | null;

const field = "w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary";

export function BannerForm({ banner }: { banner: BannerLike }) {
  const isEdit = !!banner;
  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center gap-1.5 text-xs text-muted">
        <Link href="/admin/banners" className="hover:text-primary">بنرها</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-fg">{isEdit ? "ویرایش" : "بنر جدید"}</span>
      </div>

      <h1 className="mb-6 text-2xl font-black">{isEdit ? "ویرایش بنر" : "افزودن بنر"}</h1>

      <form action={saveBanner} encType="multipart/form-data" className="card space-y-5 p-6">
        {isEdit && <input type="hidden" name="id" value={banner!.id} />}

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">عنوان بنر</span>
          <input name="title" required defaultValue={banner?.title ?? ""} className={field} placeholder="مثلاً: کالکشن تازهٔ بهاره" />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold">زیرعنوان (اختیاری)</span>
          <input name="subtitle" defaultValue={banner?.subtitle ?? ""} className={field} placeholder="یک جملهٔ کوتاه زیر عنوان" />
        </label>

        {/* عکس بنر: فقط یک عکس کافی است — سایت خودش آن را در موبایل و دسکتاپ کامل و بدون کشیدگی نمایش می‌دهد */}
        <div className="rounded-xl border bg-elev/40 p-4">
          <span className="mb-3 block text-sm font-semibold">عکس بنر (پیشنهادی: عریض ۱۹۲۰×۸۰۰ — حداقل عرض ۱۲۰۰ پیکسل برای کیفیت بهتر)</span>
          <ImagePicker name="imageFile" current={banner?.image ?? null} label="یک عکس از سیستم انتخاب کنید (jpg/png/webp، حداکثر ۵ مگابایت)" />
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs text-muted">یا مسیر عکس را دستی وارد کنید</span>
            <input name="image" defaultValue={banner?.image ?? ""} className={field} placeholder="/uploads/banner.jpg" dir="ltr" />
          </label>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            فقط همین یک عکس را آپلود کنید؛ در موبایل و دسکتاپ خودش کامل و بدون برش دیده می‌شود — نیازی به آپلود دوباره نیست.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">لینک مقصد کلیک (اختیاری)</span>
            <input name="link" defaultValue={banner?.link ?? ""} className={field} placeholder="/products" dir="ltr" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">ترتیب نمایش (کمتر = زودتر)</span>
            <input name="order" inputMode="numeric" defaultValue={banner?.order ?? 0} className={field} dir="ltr" />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="active" defaultChecked={banner?.active ?? true} className="accent-[rgb(var(--c-primary))]" />
          فعال — روی سایت دیده شود
        </label>

        <div className="flex gap-3 border-t pt-5">
          <SubmitButton>{isEdit ? "ذخیرهٔ تغییرات" : "افزودن بنر"}</SubmitButton>
          <Link href="/admin/banners" className="btn-ghost">انصراف</Link>
        </div>
      </form>
    </div>
  );
}
