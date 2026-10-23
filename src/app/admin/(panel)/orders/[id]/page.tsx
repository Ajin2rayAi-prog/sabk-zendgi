import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductThumb } from "@/components/product-thumb";
import { updateOrderStatusAction } from "../../../actions";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_VALUES,
} from "@/lib/orders";
import { formatPrice, toFa } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "جزئیات سفارش" };

const faDate = (d: Date) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "full", timeStyle: "short" }).format(d);

export default async function AdminOrderDetail({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
        <ChevronRight className="h-4 w-4" /> بازگشت به سفارش‌ها
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-black" dir="ltr">{order.code}</h1>
        <p className="mt-1 text-sm text-muted">{faDate(order.createdAt)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* اقلام */}
        <div className="card divide-y overflow-hidden">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center gap-4 p-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border">
                <ProductThumb categorySlug="" image={it.image ?? undefined} alt={it.title} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-sm font-bold">{it.title}</div>
                <div className="mt-1 text-xs text-muted">
                  {it.productSku} · {toFa(it.qty)} × {formatPrice(it.price)}
                </div>
              </div>
              <div className="shrink-0 text-sm font-black">{formatPrice((it.price ?? 0) * it.qty)}</div>
            </div>
          ))}
          <div className="flex items-center justify-between p-4">
            <span className="text-sm text-muted">جمع کل</span>
            <span className="font-black text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="space-y-6">
          {/* اطلاعات مشتری */}
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-black">مشتری</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">نام</dt>
                <dd className="font-semibold">{order.customerName || "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">موبایل</dt>
                <dd dir="ltr" className="font-semibold">{toFa(order.customerMobile)}</dd>
              </div>
              {order.address && (
                <div className="flex flex-col gap-1">
                  <dt className="text-muted">نشانی</dt>
                  <dd className="leading-relaxed">{order.address}</dd>
                </div>
              )}
              {order.note && (
                <div className="flex flex-col gap-1">
                  <dt className="text-muted">توضیحات</dt>
                  <dd className="leading-relaxed">{order.note}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* تغییر وضعیت */}
          <form action={updateOrderStatusAction} className="card space-y-4 p-5">
            <h2 className="text-sm font-black">وضعیت سفارش</h2>
            <input type="hidden" name="id" value={order.id} />
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">وضعیت پردازش</label>
              <select
                name="status"
                defaultValue={order.status}
                className="w-full rounded-xl border bg-elev px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {ORDER_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted">وضعیت پرداخت</label>
              <select
                name="paymentStatus"
                defaultValue={order.paymentStatus}
                className="w-full rounded-xl border bg-elev px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                {PAYMENT_STATUS_VALUES.map((s) => (
                  <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <button className="btn-primary w-full justify-center">
              <Save className="h-4 w-4" /> ذخیرهٔ وضعیت
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
