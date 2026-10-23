import Link from "next/link";

export const CONTENT_TABS = [
  { href: "/admin/content", label: "عمومی" },
  { href: "/admin/content/hero", label: "بنر اول" },
  { href: "/admin/content/footer", label: "فوتر" },
  { href: "/admin/content/about", label: "درباره ما" },
  { href: "/admin/content/services", label: "خدمات" },
];

/** ناوبری بالای صفحات محتوا — بدون اسکرول، هر بخش صفحهٔ خودش */
export function ContentNav({ current }: { current: string }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {CONTENT_TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
            current === t.href
              ? "bg-brand-grad text-primary-fg"
              : "border hover:border-primary hover:text-primary"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

export function H({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-black">{children}</h2>;
}

export function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

export const field =
  "w-full rounded-xl border bg-elev px-4 py-2.5 text-sm outline-none focus:border-primary";
