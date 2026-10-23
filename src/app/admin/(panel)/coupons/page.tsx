import { Ticket, Trash2, Plus } from "lucide-react";
import { listCoupons } from "@/lib/coupons";
import { saveCoupon, deleteCoupon } from "../../actions";
import { DeleteButton } from "../delete-button";
import { formatPrice, toFa } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "کد تخفیف" };

export default async function AdminCouponsPage() {
  const coupons = await listCoupons();
  const inputCls =
    "w-full rounded-xl border bg-elev px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-2">
        <Ticket className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-black">کدهای تخفیف</h1>
      </div>

      {/* فرم افزودن */}
      <form action={saveCoupon} className="card mb-8 space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-sm font-black">
          <Plus className="h-4 w-4 text-primary" /> کد تخفیف جدید
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">کد</label>
            <input name="code" dir="ltr" required placeholder="OFF20" className={`${inputCls} text-left`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">نوع تخفیف</label>
            <select name="type" className={inputCls} defaultValue="PERCENT">
              <option value="PERCENT">درصدی</option>
              <option value="FIXED">مبلغ ثابت (ریال)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">مقدار (درصد یا ریال)</label>
            <input name="value" dir="ltr" required placeholder="20" className={`${inputCls} text-left`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">حداقل مبلغ سبد (اختیاری)</label>
            <input name="minTotal" dir="ltr" placeholder="بدون محدودیت" className={`${inputCls} text-left`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">حداکثر دفعات استفاده (اختیاری)</label>
            <input name="maxUses" dir="ltr" placeholder="نامحدود" className={`${inputCls} text-left`} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted">تاریخ انقضا (اختیاری)</label>
            <input type="date" name="expiresAt" dir="ltr" className={`${inputCls} text-left`} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked className="h-5 w-5 accent-[rgb(var(--primary))]" />
          فعال باشد
        </label>
        <button className="btn-primary justify-center">
          <Plus className="h-4 w-4" /> ذخیرهٔ کد
        </button>
      </form>

      {/* فهرست */}
      {coupons.length === 0 ? (
        <p className="card p-6 text-sm text-muted">هنوز کد تخفیفی ثبت نشده است.</p>
      ) : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c.id} className="card flex flex-wrap items-center gap-3 p-4">
              <span dir="ltr" className="rounded-lg bg-primary-soft px-3 py-1 font-mono text-sm font-bold text-primary-deep dark:text-primary">
                {c.code}
              </span>
              <span className="text-sm font-semibold">
                {c.type === "PERCENT" ? `${toFa(c.value)}٪` : formatPrice(c.value)} تخفیف
              </span>
              {c.minTotal != null && (
                <span className="text-xs text-muted">حداقل {formatPrice(c.minTotal)}</span>
              )}
              <span className="text-xs text-muted">
                استفاده: {toFa(c.usedCount)}{c.maxUses != null ? ` / ${toFa(c.maxUses)}` : ""}
              </span>
              {c.expiresAt && (
                <span className="text-xs text-muted">
                  انقضا: {toFa(new Date(c.expiresAt).toLocaleDateString("fa-IR"))}
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  c.active ? "bg-emerald-400/15 text-emerald-600 dark:text-emerald-400" : "bg-border/50 text-muted"
                }`}
              >
                {c.active ? "فعال" : "غیرفعال"}
              </span>
              <DeleteButton
                action={deleteCoupon}
                id={c.id}
                message="این کد تخفیف حذف شود؟"
                formClassName="mr-auto"
                className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> حذف
              </DeleteButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
