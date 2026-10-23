import Link from "next/link";
import { Package, Tags, ShoppingBag, Phone, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toFa } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "داشبورد مدیریت" };

export default async function AdminDashboard() {
  const [products, categories, orders, pending] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  const stats = [
    { label: "محصولات", value: products, icon: Package, href: "/admin/products" },
    { label: "دسته‌ها", value: categories, icon: Tags, href: "/admin/categories" },
    { label: "کل سفارش‌ها", value: orders, icon: ShoppingBag, href: "/admin/orders" },
    { label: "در انتظار تأیید", value: pending, icon: Phone, href: "/admin/orders" },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">داشبورد</h1>
          <p className="mt-1 text-sm text-muted">مدیریت محصولات، قیمت‌ها و دسته‌بندی‌ها</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> محصول جدید
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-5 transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <s.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 text-3xl font-black tabular-nums">{toFa(s.value)}</div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
