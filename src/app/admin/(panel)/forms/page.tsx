import Link from "next/link";
import { FileDown, Briefcase, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toFa } from "@/lib/utils";
import { updateFormStatus, deleteFormSubmission } from "../../actions";
import { DeleteButton } from "../delete-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "درخواست‌های همکاری" };

const TYPE_FA: Record<string, string> = { JOB: "استخدام", DISTRIBUTOR: "توزیعی" };
const STATUS_FA: Record<string, string> = { NEW: "جدید", READ: "خوانده‌شده", ARCHIVED: "بایگانی" };

export default async function AdminForms({
  searchParams,
}: {
  searchParams: { type?: string; status?: string };
}) {
  const where: { type?: "JOB" | "DISTRIBUTOR"; status?: "NEW" | "READ" | "ARCHIVED" } = {};
  if (searchParams.type === "JOB" || searchParams.type === "DISTRIBUTOR") where.type = searchParams.type;
  if (["NEW", "READ", "ARCHIVED"].includes(searchParams.status ?? "")) {
    where.status = searchParams.status as "NEW" | "READ" | "ARCHIVED";
  }
  const [forms, newCount] = await Promise.all([
    prisma.formSubmission.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.formSubmission.count({ where: { status: "NEW" } }),
  ]);

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
        active ? "bg-brand-grad text-primary-fg" : "border hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black">درخواست‌های همکاری</h1>
        <p className="mt-1 text-sm text-muted">
          {toFa(newCount)} درخواست خوانده‌نشده — از فرم‌های استخدام و توزیعی صفحهٔ «همکاری با ما».
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tab("/admin/forms", "همه", !searchParams.type && !searchParams.status)}
        {tab("/admin/forms?type=JOB", "استخدام", searchParams.type === "JOB")}
        {tab("/admin/forms?type=DISTRIBUTOR", "توزیعی", searchParams.type === "DISTRIBUTOR")}
        {tab("/admin/forms?status=NEW", "خوانده‌نشده", searchParams.status === "NEW")}
        {tab("/admin/forms?status=ARCHIVED", "بایگانی", searchParams.status === "ARCHIVED")}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b bg-primary-soft/40 text-right text-xs text-muted">
              <th className="px-4 py-3 font-semibold">نوع</th>
              <th className="px-4 py-3 font-semibold">نام</th>
              <th className="px-4 py-3 font-semibold">موبایل</th>
              <th className="px-4 py-3 font-semibold">شهر</th>
              <th className="px-4 py-3 font-semibold">توضیحات / رزومه</th>
              <th className="px-4 py-3 font-semibold">وضعیت</th>
              <th className="px-4 py-3 font-semibold">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {forms.map((f) => (
              <tr key={f.id} className={`border-b last:border-0 hover:bg-primary-soft/20 ${f.status === "NEW" ? "bg-primary-soft/30 font-medium" : ""}`}>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className="inline-flex items-center gap-1 text-xs font-bold">
                    {f.type === "JOB" ? <Briefcase className="h-3.5 w-3.5" /> : <Store className="h-3.5 w-3.5" />}
                    {TYPE_FA[f.type]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <div className="font-semibold">{f.name}</div>
                  {f.position && (
                    <div className="mt-0.5 text-xs text-primary">{f.position}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5" dir="ltr">{f.mobile}</td>
                <td className="whitespace-nowrap px-4 py-2.5 text-muted">{f.city ?? "—"}</td>
                <td className="max-w-[260px] px-4 py-2.5">
                  {f.message && <div className="line-clamp-2 text-xs text-muted">{f.message}</div>}
                  {f.fileUrl && (
                    <a
                      href={f.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-primary mt-1 inline-flex items-center gap-1 text-xs"
                    >
                      <FileDown className="h-3.5 w-3.5" /> دانلود رزومه
                    </a>
                  )}
                  {!f.message && !f.fileUrl && <span className="text-xs text-muted">—</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <form action={updateFormStatus} className="flex items-center gap-1.5">
                    <input type="hidden" name="id" value={f.id} />
                    <select
                      name="status"
                      defaultValue={f.status}
                      className="rounded-lg border bg-elev px-2 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      {Object.entries(STATUS_FA).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    <button
                      className="rounded-lg border px-2 py-1.5 text-xs font-bold hover:border-primary hover:text-primary"
                      title="ذخیرهٔ وضعیت"
                    >
                      ثبت
                    </button>
                  </form>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <DeleteButton action={deleteFormSubmission} id={f.id} message="این درخواست حذف شود؟" />
                </td>
              </tr>
            ))}
            {forms.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  درخواستی با این فیلتر ثبت نشده است.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
