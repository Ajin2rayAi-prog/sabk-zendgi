import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { loginAction } from "../actions";
import { siteConfig } from "@/config/site";

export const metadata = { title: "ورود پنل مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminLogin({ searchParams }: { searchParams: { e?: string } }) {
  if (await isAdmin()) redirect("/admin");
  const err = searchParams?.e === "1";

  return (
    <div className="grid min-h-screen place-items-center bg-brand-soft p-6">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-grad text-primary-fg shadow-brand">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-xl font-black">پنل مدیریت</h1>
          <p className="mt-1 text-sm text-muted">{siteConfig.brand.name}</p>
        </div>

        <form action={loginAction} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">نام کاربری</label>
            <input
              type="text"
              name="username"
              autoComplete="username"
              autoFocus
              required
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="owner"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">رمز عبور</label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>
          {err && <p className="text-sm text-rose-500">نام کاربری یا رمز عبور نادرست است.</p>}
          <button type="submit" className="btn-primary w-full justify-center">
            ورود
          </button>
        </form>
      </div>
    </div>
  );
}
