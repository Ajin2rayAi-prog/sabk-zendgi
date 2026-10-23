import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getCurrentCustomer } from "@/lib/customer";
import { prisma } from "@/lib/prisma";
import { ProductThumb } from "@/components/product-thumb";
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_CLASS,
  PAYMENT_STATUS_LABEL,
} from "@/lib/orders";
import { formatPrice, toFa } from "@/lib/utils";

export const dynamic = "force-dynamic";

const faDate = (d: Date) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "full", timeStyle: "short" }).format(d);

export default async function CustomerOrderPage({ params }: { params: { code: string } }) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/login?next=/account/orders/${params.code}`);

  const order = await prisma.order.findUnique({
    where: { code: params.code },
    include: { items: true },
  });
  // سفارش باید متعلق به همین مشتری باشد
  if (!order || order.customerId !== customer.id) notFound();

  return (
    <div className="container-lux py-8">
      <Link href="/account" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
        <ChevronRight className="h-4 w-4" /> بازگشت به حساب کاربری
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" dir="ltr">{order.code}</h1>
          <p className="mt-1 text-sm text-muted">{faDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${ORDER_STATUS_CLASS[order.status]}`}>
            {ORDER_STATUS_LABEL[order.status]}
          </span>
          <span className="rounded-full bg-primary-soft/60 px-3 py-1 text-xs font-bold text-muted">
            {PAYMENT_STATUS_LABEL[order.paymentStatus]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card divide-y overflow-hidden">
          {order.items.map((it) => (
            <div key={it.id} className="flex items-center gap-4 p-4">
              <Link href={`/product/${it.slug}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border">
                <ProductThumb categorySlug="" image={it.image ?? undefined} alt={it.title} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${it.slug}`} className="line-clamp-2 text-sm font-bold hover:text-primary">
                  {it.title}
                </Link>
                <div className="mt-1 text-xs text-muted">
                  {toFa(it.qty)} × {formatPrice(it.price)}
                </div>
              </div>
              <div className="shrink-0 text-sm font-black">
                {formatPrice((it.price ?? 0) * it.qty)}
              </div>
            </div>
          ))}
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-4 text-sm font-black">اطلاعات سفارش</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">گیرنده</dt>
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
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <span className="text-sm text-muted">جمع کل</span>
            <span className="font-black text-primary">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
