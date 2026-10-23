import { redirect } from "next/navigation";
import { KeyRound, UserCircle } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { changeOwnPassword } from "../../actions";

export const metadata = { title: "حساب کاربری" };
export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { pw?: string };
}) {
  const me = await getCurrentAdmin();
  if (!me) redirect("/admin/login");

  const pwChanged = searchParams?.pw === "1";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-black">حساب کاربری</h1>
        <p className="mt-1 text-sm text-muted">اطلاعات حساب شما و تغییر رمز عبور.</p>
      </header>

      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <UserCircle className="h-5 w-5 text-primary" /> مشخصات
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">نام نمایشی</dt>
            <dd className="font-bold">{me.name}</dd>
          </div>
          <div>
            <dt className="text-muted">نام کاربری</dt>
            <dd className="font-bold" dir="ltr">
              @{me.username}
            </dd>
          </div>
          <div>
            <dt className="text-muted">نقش</dt>
            <dd>
              {me.role === "OWNER" ? (
                <span className="chip bg-primary-soft text-primary">مالک</span>
              ) : (
                <span className="chip text-muted">مدیر</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">وضعیت</dt>
            <dd className="font-semibold text-emerald-600 dark:text-emerald-400">
              {me.active ? "فعال" : "غیرفعال"}
            </dd>
          </div>
        </dl>
        {me.role !== "OWNER" && (
          <p className="mt-4 rounded-xl bg-elev/60 p-3 text-xs text-muted">
            برای تغییر نام کاربری یا نقش خود، با مالک سایت تماس بگیرید.
          </p>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <KeyRound className="h-5 w-5 text-primary" /> تغییر رمز عبور
        </h2>
        {pwChanged && (
          <p className="mb-4 rounded-xl bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            رمز عبور با موفقیت تغییر کرد.
          </p>
        )}
        <form action={changeOwnPassword} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">رمز عبور فعلی</label>
            <input
              type="password"
              name="currentPassword"
              required
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">رمز عبور جدید</label>
            <input
              type="password"
              name="newPassword"
              required
              minLength={6}
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="حداقل ۶ کاراکتر"
            />
          </div>
          <button type="submit" className="btn-primary justify-center">
            <KeyRound className="h-4.5 w-4.5" /> ذخیره رمز جدید
          </button>
        </form>
      </section>
    </div>
  );
}
