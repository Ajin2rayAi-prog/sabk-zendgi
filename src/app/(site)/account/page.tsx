import Link from "next/link";
import { redirect } from "next/navigation";
import { User, Phone, Package, ChevronLeft, LogOut } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer";
import { prisma } from "@/lib/prisma";
import { logoutCustomerAction } from "@/app/(site)/login/actions";
import { ORDER_STATUS_LABEL, ORDER_STATUS_CLASS } from "@/lib/orders";
import { formatPrice, toFa } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "حساب کاربری" };

const faDate = (d: Date) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(d);

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/account");

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div className="container-lux py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black">حساب کاربری</h1>
        <form action={logoutCustomerAction}>
          <button className="btn-ghost text-rose-500">
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* پروفایل */}
        <div className="card h-fit p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="font-black">{customer.name || "کاربر"}</div>
              <div className="flex items-center gap-1 text-xs text-muted" dir="ltr">
                <Phone className="h-3 w-3" /> {toFa(customer.mobile)}
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-primary-soft/40 p-3 text-center text-sm">
            <span className="text-muted">تعداد سفارش‌ها: </span>
            <span className="font-black text-primary">{toFa(orders.length)}</span>
          </div>
        </div>

        {/* سفارش‌ها */}
        <div>
          <h2 className="mb-3 text-sm font-black">سفارش‌های من</h2>
          {orders.length === 0 ? (
            <div className="card p-10 text-center text-sm text-muted">
              <Package className="mx-auto mb-3 h-8 w-8 opacity-50" />
              هنوز سفارشی ثبت نکرده‌اید.
              <div className="mt-4">
                <Link href="/products" className="link-primary">شروع خرید</Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/account/orders/${o.code}`}
                  className="card flex items-center justify-between gap-4 p-4 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span dir="ltr" className="font-black text-primary">{o.code}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${ORDER_STATUS_CLASS[o.status]}`}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {faDate(o.createdAt)} · {toFa(o._count.items)} قلم
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-black">{formatPrice(o.total)}</span>
                    <ChevronLeft className="h-4 w-4 text-muted" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
