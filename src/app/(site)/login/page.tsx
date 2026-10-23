import Link from "next/link";
import { redirect } from "next/navigation";
import { Smartphone, KeyRound, ArrowRight } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer";
import { requestOtpAction, verifyOtpAction } from "./actions";
import { siteConfig } from "@/config/site";
import { toFa } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "ورود / ثبت‌نام" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { step?: string; mobile?: string; next?: string; dev?: string; e?: string };
}) {
  const next = searchParams?.next ?? "/account";

  // اگر قبلاً وارد شده، مستقیم برو
  const customer = await getCurrentCustomer();
  if (customer) redirect(next);

  const verify = searchParams?.step === "verify" && !!searchParams?.mobile;
  const mobile = searchParams?.mobile ?? "";

  return (
    <div className="container-lux grid min-h-[70vh] place-items-center py-10">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-grad text-primary-fg shadow-brand">
            {verify ? <KeyRound className="h-7 w-7" /> : <Smartphone className="h-7 w-7" />}
          </div>
          <h1 className="mt-4 text-xl font-black">{verify ? "کد تأیید" : "ورود / ثبت‌نام"}</h1>
          <p className="mt-1 text-sm text-muted">
            {verify ? `کد پیامک‌شده به ${toFa(mobile)} را وارد کنید` : "با شمارهٔ موبایل خود وارد شوید"}
          </p>
        </div>

        {!verify ? (
          <form action={requestOtpAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="mb-1.5 block text-sm font-semibold">شمارهٔ موبایل</label>
              <input
                name="mobile"
                type="tel"
                inputMode="tel"
                dir="ltr"
                autoFocus
                required
                placeholder="09xxxxxxxxx"
                className="w-full rounded-xl border bg-elev px-4 py-2.5 text-center text-sm outline-none focus:border-primary"
              />
            </div>
            {searchParams?.e === "mobile" && (
              <p className="text-sm text-rose-500">شمارهٔ موبایل نامعتبر است.</p>
            )}
            <button type="submit" className="btn-primary w-full justify-center">
              دریافت کد <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          <form action={verifyOtpAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="mobile" value={mobile} />

            {searchParams?.dev && (
              <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-center text-sm">
                <span className="text-muted">کد آزمایشی (نسخهٔ توسعه): </span>
                <span dir="ltr" className="font-black tabular-nums text-amber-600 dark:text-amber-400">
                  {toFa(searchParams.dev)}
                </span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold">کد ۵ رقمی</label>
              <input
                name="code"
                type="text"
                inputMode="numeric"
                dir="ltr"
                autoFocus
                required
                maxLength={5}
                placeholder="- - - - -"
                className="w-full rounded-xl border bg-elev px-4 py-2.5 text-center text-lg font-black tracking-[0.4em] outline-none focus:border-primary"
              />
            </div>
            {searchParams?.e === "code" && (
              <p className="text-sm text-rose-500">کد نادرست یا منقضی‌شده است.</p>
            )}
            <button type="submit" className="btn-primary w-full justify-center">
              ورود
            </button>
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="block text-center text-xs text-muted hover:text-primary"
            >
              تغییر شمارهٔ موبایل
            </Link>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          با ورود، شرایط و قوانین {siteConfig.brand.name} را می‌پذیرید.
        </p>
      </div>
    </div>
  );
}
