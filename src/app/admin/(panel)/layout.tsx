import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutGrid, Package, Tags, ShoppingBag, MessageSquare, Ticket, Newspaper, Sparkles, Settings, LogOut, ExternalLink, Users, UserCircle, Images, Inbox, FileText } from "lucide-react";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toFa } from "@/lib/utils";
import { logoutAction } from "../actions";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

// بخش «مدیریت کاربران» فقط برای مالک قابل‌دسترس است (در پایین فیلتر می‌شود)
const nav = [
  { href: "/admin", label: "داشبورد", icon: LayoutGrid },
  { href: "/admin/banners", label: "بنرها", icon: Images },
  { href: "/admin/forms", label: "درخواست‌ها", icon: Inbox },
  { href: "/admin/content", label: "محتوای سایت", icon: FileText },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/categories", label: "دسته‌ها", icon: Tags },
  { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag },
  { href: "/admin/reviews", label: "نظرات", icon: MessageSquare },
  { href: "/admin/coupons", label: "کد تخفیف", icon: Ticket },
  { href: "/admin/blog", label: "بلاگ", icon: Newspaper },
  { href: "/admin/assistant", label: "دستیار هوشمند", icon: Sparkles, ownerOnly: true },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
  { href: "/admin/users", label: "مدیریت کاربران", icon: Users, ownerOnly: true },
  { href: "/admin/account", label: "حساب کاربری", icon: UserCircle },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentAdmin();
  if (!me) redirect("/admin/login");
  const isOwner = me.role === "OWNER";

  // شمارنده‌های خوانده‌نشده برای بج قرمز منو
  const [newForms, pendingReviews, pendingOrders] = await Promise.all([
    prisma.formSubmission.count({ where: { status: "NEW" } }).catch(() => 0),
    prisma.review.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.order.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);
  const badges: Record<string, number> = {
    "/admin/forms": newForms,
    "/admin/reviews": pendingReviews,
    "/admin/orders": pendingOrders,
  };

  return (
    <div className="min-h-screen bg-bg lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-l bg-elev p-5 lg:min-h-screen">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-grad text-primary-fg">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <div className="text-sm font-black leading-tight">
            پنل مدیریت
            <div className="text-xs font-normal text-muted">{siteConfig.brand.name}</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {nav
            .filter((n) => !n.ownerOnly || isOwner)
            .map((n) => {
              const count = badges[n.href] ?? 0;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                >
                  <n.icon className="h-4.5 w-4.5" />
                  <span className="flex-1">{n.label}</span>
                  {count > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1.5 text-[11px] font-black text-white">
                      {toFa(count > 99 ? "۹۹+" : count)}
                    </span>
                  )}
                </Link>
              );
            })}
        </nav>

        <div className="mt-6 space-y-1 border-t pt-4">
          <div className="rounded-xl bg-primary-soft/60 px-3 py-2.5 text-xs">
            <div className="font-black text-primary-deep dark:text-primary">{me.name}</div>
            <div className="text-muted" dir="ltr">
              @{me.username} · {isOwner ? "مالک" : "مدیر"}
            </div>
          </div>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:text-primary"
          >
            <ExternalLink className="h-4.5 w-4.5" /> مشاهدهٔ سایت
          </Link>
          <form action={logoutAction}>
            <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10">
              <LogOut className="h-4.5 w-4.5" /> خروج
            </button>
          </form>
        </div>
      </aside>

      <main className="p-6 lg:p-8">{children}</main>
    </div>
  );
}
