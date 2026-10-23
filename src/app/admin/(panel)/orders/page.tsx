import Link from "next/link";
import { Eye, ShoppingBag } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUS_LABEL, ORDER_STATUS_CLASS, PAYMENT_STATUS_LABEL } from "@/lib/orders";
import { formatPrice, toFa } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "مدیریت سفارش‌ها" };

const faDate = (d: Date) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(d);

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">سفارش‌ها</h1>
          <p className="mt-1 text-sm text-muted">{toFa(orders.length)} سفارش — مبالغ به ریال</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card p-12 text-center text-sm text-muted">
          <ShoppingBag className="mx-auto mb-3 h-9 w-9 opacity-40" />
          هنوز سفارشی ثبت نشده است.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b bg-primary-soft/40 text-right text-xs text-muted">
                <th className="px-4 py-3 font-semibold">شمارهٔ سفارش</th>
                <th className="px-4 py-3 font-semibold">مشتری</th>
                <th className="px-4 py-3 font-semibold">تاریخ</th>
                <th className="px-4 py-3 font-semibold">مبلغ</th>
                <th className="px-4 py-3 font-semibold">وضعیت</th>
                <th className="px-4 py-3 font-semibold">پرداخت</th>
                <th className="px-4 py-3 font-semibold">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-primary-soft/20">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs font-bold text-primary">{o.code}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold">{o.customerName || "—"}</div>
                    <div className="text-xs text-muted" dir="ltr">{toFa(o.customerMobile)}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-muted">{faDate(o.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 font-black tabular-nums">{formatPrice(o.total)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold ${ORDER_STATUS_CLASS[o.status]}`}>
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted">{PAYMENT_STATUS_LABEL[o.paymentStatus]}</td>
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="grid h-8 w-8 place-items-center rounded-lg border hover:border-primary hover:text-primary"
                      title="مشاهده"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
