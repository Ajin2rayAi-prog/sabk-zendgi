import { Settings, Save, CheckCircle2, Info, Tag, Lock } from "lucide-react";
import { getAiConfig, hasStoredApiKey, getPricesVisible, getFeaturedVisible, getHomePriceListVisible } from "@/lib/settings";
import { getCurrentAdmin } from "@/lib/auth";
import { saveAiSettings, savePricesVisible, saveFeaturedVisible, saveHomePriceListVisible } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "تنظیمات" };

const PROVIDERS: { value: string; label: string }[] = [
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "openai", label: "OpenAI" },
  { value: "openai-compatible", label: "سازگار با OpenAI (سرویس سفارشی)" },
];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const cfg = await getAiConfig();
  const keySet = await hasStoredApiKey();
  const pricesVisible = await getPricesVisible();
  const featuredVisible = await getFeaturedVisible();
  const homePriceListVisible = await getHomePriceListVisible();
  // بخش هوش مصنوعی فقط برای مالک است (هزینهٔ سرویس با تأیید کارفرما فعال می‌شود)
  const me = await getCurrentAdmin();
  const isOwner = me?.role === "OWNER";

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-black">
          <Settings className="h-6 w-6 text-primary" /> تنظیمات
        </h1>
      </div>

      {searchParams.saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4.5 w-4.5" /> تنظیمات با موفقیت ذخیره شد.
        </div>
      )}

      {/* ---------------------------------------- */}
      {/*  نمایش قیمت‌ها — نوسانات ارز              */}
      {/* ---------------------------------------- */}
      <div className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
          <Tag className="h-5 w-5 text-primary" /> نمایش قیمت محصولات
        </h2>
        <form action={savePricesVisible} className="card space-y-4 p-6">
          <label className="flex items-start justify-between gap-3">
            <span>
              <span className="block text-sm font-bold">نمایش قیمت‌ها در سایت</span>
              <span className="mt-0.5 block text-xs text-muted">
                برای مدیریت نوسانات ارز. وقتی غیرفعال باشد، هر محصول فقط «استعلام قیمت»
                نشان می‌دهد و شماره تماس عرضه می‌شود.
              </span>
            </span>
            <input
              type="checkbox"
              name="pricesVisible"
              defaultChecked={pricesVisible}
              className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--primary))]"
            />
          </label>

          <div
            className={`rounded-xl border p-3 text-xs ${
              pricesVisible
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
                : "border-amber-400/40 bg-amber-400/10 text-amber-600 dark:text-amber-400"
            }`}
          >
            {pricesVisible
              ? "✅ قیمت‌های ذخیره‌شده نمایش داده می‌شوند. از جدول محصولات می‌توانید آن‌ها را ویرایش کنید."
              : "⛔ حالت استعلام: همهٔ محصول‌ها «استعلام قیمت» نشان می‌دهند و شماره تماس عرضه می‌شود."}
          </div>

          <button className="btn-primary w-full justify-center">
            <Save className="h-4 w-4" /> ذخیره
          </button>
        </form>
      </div>

      {/* ---------------------------------------- */}
      {/*  نمایش سکشن محصولات منتخب در صفحهٔ اول    */}
      {/* ---------------------------------------- */}
      <div className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
          <Tag className="h-5 w-5 text-primary" /> محصولات منتخب صفحهٔ اول
        </h2>
        <form action={saveFeaturedVisible} className="card space-y-4 p-6">
          <label className="flex items-start justify-between gap-3">
            <span>
              <span className="block text-sm font-bold">نمایش سکشن محصولات منتخب</span>
              <span className="mt-0.5 block text-xs text-muted">
                وقتی غیرفعال باشد، کل سکشن «محصولات منتخب» از صفحهٔ اول حذف می‌شود.
              </span>
            </span>
            <input
              type="checkbox"
              name="featuredVisible"
              defaultChecked={featuredVisible}
              className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--primary))]"
            />
          </label>

          <button className="btn-primary w-full justify-center">
            <Save className="h-4 w-4" /> ذخیره
          </button>
        </form>
      </div>

      {/* ---------------------------------------- */}
      {/*  پیش‌نمایش لیست قیمت در صفحهٔ اول        */}
      {/* ---------------------------------------- */}
      <div className="mb-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-black">
          <Tag className="h-5 w-5 text-primary" /> پیش‌نمایش لیست قیمت
        </h2>
        <form action={saveHomePriceListVisible} className="card space-y-4 p-6">
          <label className="flex items-start justify-between gap-3">
            <span>
              <span className="block text-sm font-bold">نمایش در صفحهٔ اول</span>
              <span className="mt-0.5 block text-xs text-muted">
                وقتی غیرفعال باشد، سکشن «لیست قیمت محصولات» از صفحهٔ اول حذف می‌شود (صفحهٔ جدا می‌ماند).
              </span>
            </span>
            <input
              type="checkbox"
              name="homePriceListVisible"
              defaultChecked={homePriceListVisible}
              className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--primary))]"
            />
          </label>

          <button className="btn-primary w-full justify-center">
            <Save className="h-4 w-4" /> ذخیره
          </button>
        </form>
      </div>

      {/* ---------------------------------------- */}
      {/*  هوش مصنوعی — فقط مالک                     */}
      {/* ---------------------------------------- */}
      {!isOwner ? (
        <div className="card flex items-start gap-3 p-6">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
          <div>
            <h2 className="text-sm font-bold">هوش مصنوعی</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              این بخش فقط برای مالک سایت است. فعال‌سازی دستیار هوشمند هزینهٔ سرویس دارد
              و با تأیید کارفرما انجام می‌شود.
            </p>
          </div>
        </div>
      ) : (
      <>
      <div className="mb-2">
        <h2 className="flex items-center gap-2 text-lg font-black">
          <Settings className="h-5 w-5 text-primary" /> هوش مصنوعی
        </h2>
        <p className="mt-1 text-sm text-muted">
          ارائه‌دهنده، کلید و مدل را انتخاب کنید. کلید API فقط روی سرور نگهداری می‌شود و هرگز به مرورگر
          ارسال نمی‌شود.
        </p>
      </div>

      <form action={saveAiSettings} className="card space-y-5 p-6">
        {/* فعال‌سازی */}
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-bold">فعال‌سازی دستیار هوشمند</span>
            <span className="block text-xs text-muted">چت مشاور خرید، جستجوی هوشمند و دستیار پنل</span>
          </span>
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={cfg.enabled}
            className="h-5 w-5 accent-[rgb(var(--primary))]"
          />
        </label>

        {/* ارائه‌دهنده */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">ارائه‌دهنده</label>
          <select
            name="provider"
            defaultValue={cfg.provider}
            className="w-full rounded-xl border bg-elev px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* حالت نمایش پاسخ */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">حالت نمایش پاسخ</label>
          <select
            name="streaming"
            defaultValue={cfg.streaming ? "stream" : "instant"}
            className="w-full rounded-xl border bg-elev px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="stream">ذره‌ذره (تایپ زنده) — کلمات همان‌طور که آماده می‌شوند نمایش داده می‌شوند</option>
            <option value="instant">یک‌جا (کامل) — پاسخ پس از آماده‌شدن یک‌باره نشان داده می‌شود</option>
          </select>
          <p className="mt-1 text-xs text-muted">
            «تایپ زنده» زودتر شروع می‌شود اما ممکن است روی برخی سرویس‌ها فرقی حس نشود؛ «یک‌جا» تا پایان صبر می‌کند.
          </p>
        </div>

        {/* آدرس پایه */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">
            آدرس پایه (Base URL) — اختیاری
          </label>
          <input
            name="baseUrl"
            defaultValue={cfg.baseUrl}
            dir="ltr"
            placeholder="مثلاً https://api.openai.com/v1"
            className="w-full rounded-xl border bg-elev px-3 py-2.5 text-left text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-xs text-muted">
            خالی بگذارید تا آدرس پیش‌فرض ارائه‌دهنده استفاده شود.
          </p>
        </div>

        {/* مدل */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">نام مدل</label>
          <input
            name="model"
            defaultValue={cfg.model}
            dir="ltr"
            placeholder="مثلاً claude-sonnet-5 یا gpt-4o-mini"
            className="w-full rounded-xl border bg-elev px-3 py-2.5 text-left text-sm outline-none focus:border-primary"
          />
        </div>

        {/* کلید API */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-muted">کلید API</label>
          <input
            type="password"
            name="apiKey"
            autoComplete="off"
            placeholder={keySet ? "••••••••  (تنظیم‌شده — برای حفظ، خالی بگذارید)" : "کلید API را وارد کنید"}
            className="w-full rounded-xl border bg-elev px-3 py-2.5 text-left text-sm outline-none focus:border-primary"
            dir="ltr"
          />
          <p className="mt-1 flex items-start gap-1.5 text-xs text-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            برای تغییر نکردن کلید فعلی، این فیلد را خالی بگذارید.
          </p>
        </div>

        <button className="btn-primary w-full justify-center">
          <Save className="h-4 w-4" /> ذخیرهٔ تنظیمات
        </button>
      </form>
      </>
      )}
    </div>
  );
}
