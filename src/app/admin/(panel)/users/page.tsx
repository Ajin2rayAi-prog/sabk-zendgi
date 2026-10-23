import { redirect } from "next/navigation";
import { UserPlus, Shield, KeyRound, Trash2, Check, X, Pencil } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createAdmin,
  updateAdmin,
  toggleAdminActive,
  resetAdminPassword,
  deleteAdmin,
} from "../../actions";
import { UserEditDialog } from "./user-edit-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { DeleteButton } from "../delete-button";

export const metadata = { title: "مدیریت کاربران" };
export const dynamic = "force-dynamic";

async function requireOwnerOrRedirect() {
  const me = await getCurrentAdmin();
  if (!me) redirect("/admin/login");
  if (me.role !== "OWNER") redirect("/admin");
  return me;
}

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export default async function UsersPage() {
  const me = await requireOwnerOrRedirect();
  const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">مدیریت کاربران</h1>
          <p className="mt-1 text-sm text-muted">
            مدیریت مدیران پنل؛ ایجاد حساب، ویرایش نام کاربری/رمز عبور و کنترل دسترسی.
          </p>
        </div>
        <span className="chip bg-primary-soft text-primary">نقش شما: مالک</span>
      </header>

      {/* فرم ایجاد مدیر جدید */}
      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <UserPlus className="h-5 w-5 text-primary" /> افزودن مدیر جدید
        </h2>
        <form action={createAdmin} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">نام نمایشی</label>
            <input
              name="name"
              required
              placeholder="مثلاً: مدیر محتوا"
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">نام کاربری</label>
            <input
              name="username"
              required
              dir="ltr"
              placeholder="manager1"
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">رمز عبور</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="حداقل ۶ کاراکتر"
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">نقش</label>
            <select
              name="role"
              defaultValue="MANAGER"
              className="w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="MANAGER">مدیر (محتوا/محصول/سفارش)</option>
              <option value="OWNER">مالک (دسترسی کامل)</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn-primary justify-center">
              <UserPlus className="h-4.5 w-4.5" /> افزودن کاربر
            </button>
          </div>
        </form>
      </section>

      {/* جدول کاربران */}
      <section className="card overflow-hidden">
        <div className="border-b p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Shield className="h-5 w-5 text-primary" /> مدیران ثبت‌شده
            <span className="chip font-normal text-muted">({users.length} نفر)</span>
          </h2>
        </div>

        {users.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">
            هنوز کاربری وجود ندارد. در اولین اجرا حساب مالک از متغیرهای محیطی ساخته می‌شود.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-elev/60 text-xs text-muted">
                <tr>
                  <th className="p-3 font-semibold">نام</th>
                  <th className="p-3 font-semibold">نام کاربری</th>
                  <th className="p-3 font-semibold">نقش</th>
                  <th className="p-3 font-semibold">وضعیت</th>
                  <th className="p-3 font-semibold">آخرین ورود</th>
                  <th className="p-3 font-semibold">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === me.id;
                  return (
                    <tr key={u.id} className="border-t">
                      <td className="p-3 font-semibold">{u.name}</td>
                      <td className="p-3" dir="ltr">
                        {u.username}
                      </td>
                      <td className="p-3">
                        {u.role === "OWNER" ? (
                          <span className="chip bg-primary-soft text-primary">مالک</span>
                        ) : (
                          <span className="chip text-muted">مدیر</span>
                        )}
                      </td>
                      <td className="p-3">
                        {u.active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Check className="h-4 w-4" /> فعال
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500">
                            <X className="h-4 w-4" /> غیرفعال
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-muted">{fmtDate(u.lastLoginAt)}</td>
                      <td className="p-3">
                        {isSelf ? (
                          <span className="text-xs text-muted">حساب جاری شما</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <UserEditDialog user={u} />
                            <form action={toggleAdminActive}>
                              <input type="hidden" name="id" value={u.id} />
                              <button
                                type="submit"
                                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-primary-soft hover:text-primary"
                              >
                                {u.active ? "غیرفعال‌سازی" : "فعال‌سازی"}
                              </button>
                            </form>
                            <ResetPasswordDialog username={u.username} id={u.id} />
                            <DeleteButton
                              action={deleteAdmin}
                              id={u.id}
                              message={`مدیر «${u.username}» حذف شود؟`}
                              title="حذف کاربر"
                              className="flex items-center gap-1 rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> حذف
                            </DeleteButton>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
